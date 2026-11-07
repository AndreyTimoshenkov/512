import { inject, Injectable } from '@angular/core';
import { IGridCellState, ITileMove } from '../../components/grid-cell/grid-cell.type';
import { EPerk, IPerkState, PERK_TIERS, PERKS, TPerkInventory } from '../../interfaces/perk.types';
import { GameService } from '../game/game.service';

@Injectable({
  providedIn: 'root'
})
export class PerksService {
  private game = inject(GameService);
  private readonly shuffleAttempts = 20;

  newPerks(highest: number = 2): IPerkState {
    const inventory = Object.fromEntries(PERKS.map(perk => [perk, 0])) as TPerkInventory;
    return { inventory: { ...inventory, [EPerk.undo]: 1 }, highest, doubleMoves: 0, nextSpawn: null, undo: null, save: null };
  }

  // Saved games can predate newer perks, so anything they don't have falls back to the defaults.
  restore(saved: IPerkState | null, highest: number): IPerkState {
    const fresh = this.newPerks(highest);
    return saved ? { ...fresh, ...saved, inventory: { ...fresh.inventory, ...saved.inventory } } : fresh;
  }

  earned(highest: number, best: number, target: number): EPerk[] {
    return PERK_TIERS
      .filter(({ share }) => target / share > highest && target / share <= best)
      .flatMap(tier => tier.perks);
  }

  rewardTiles(target: number): number[] {
    return PERK_TIERS.map(({ share }) => target / share);
  }

  rewardTile(perk: EPerk, target: number): number {
    return target / PERK_TIERS.find(tier => tier.perks.includes(perk))!.share;
  }

  isAvailable(perk: EPerk, perks: IPerkState, state: IGridCellState[], size: number, lost: boolean): boolean {
    if (!perks.inventory[perk]) { return false; }

    const tiles = state.filter(cell => cell.value);
    switch (perk) {
      case EPerk.undo:
        return !!perks.undo;
      case EPerk.double:
        return !perks.doubleMoves && !lost;
      case EPerk.sweep:
        return tiles.some(cell => cell.value <= 4) && tiles.some(cell => cell.value > 4);
      case EPerk.shuffle:
        return tiles.length > 1;
      case EPerk.save:
        return !lost;
      default:
        return this.pickable(perk, state, size).size > 0;
    }
  }

  // The cells a tile perk can be aimed at; swaps narrow to the first tile's neighbours once it is picked.
  pickable(perk: EPerk, state: IGridCellState[], size: number, first: number | null = null): Set<number> {
    const tiles = state.filter(cell => cell.value);
    const best = Math.max(0, ...tiles.map(cell => cell.value));
    switch (perk) {
      case EPerk.hammer:
        return new Set(tiles.length > 1 ? tiles.map(cell => cell.key) : []);
      case EPerk.upgrade:
        return new Set(tiles.filter(cell => cell.value < best).map(cell => cell.key));
      case EPerk.swap:
        return new Set(first === null
          ? tiles.filter(cell => this.swapPartners(cell.key, state, size).length).map(cell => cell.key)
          : this.swapPartners(first, state, size));
      default:
        return new Set();
    }
  }

  hammer(state: IGridCellState[], key: number): IGridCellState[] {
    return state.map(cell => cell.key === key ? { ...cell, value: 0 } : cell);
  }

  upgrade(state: IGridCellState[], key: number): IGridCellState[] {
    return state.map(cell => cell.key === key ? { ...cell, value: cell.value * 2 } : cell);
  }

  swap(state: IGridCellState[], first: number, second: number): IGridCellState[] {
    const valueOf = (key: number) => state.find(cell => cell.key === key)!.value;
    return state.map(cell => {
      if (cell.key === first) { return { ...cell, value: valueOf(second) }; }
      return cell.key === second ? { ...cell, value: valueOf(first) } : cell;
    });
  }

  sweep(state: IGridCellState[]): IGridCellState[] {
    return state.map(cell => cell.value <= 4 ? { ...cell, value: 0 } : cell);
  }

  // Keeps trying for a board that isn't stuck, since this is the perk players reach for when they are.
  shuffle(state: IGridCellState[], size: number): IGridCellState[] {
    let result = state;
    for (let attempt = 0; attempt < this.shuffleAttempts; attempt++) {
      const values = state.map(cell => cell.value);
      for (let index = values.length - 1; index > 0; index--) {
        const other = Math.floor(Math.random() * (index + 1));
        [values[index], values[other]] = [values[other], values[index]];
      }
      result = state.map((cell, index) => ({ ...cell, value: values[index] }));
      if (!this.game.isGameOver(result, size) && result.some((cell, index) => cell.value !== state[index].value)) {
        break;
      }
    }
    return result;
  }

  // Pairs every tile with one of the same value on the old board. Tiles that kept their cell stay put.
  travel(previous: IGridCellState[], next: IGridCellState[]): ITileMove[] {
    const stayed = (index: number) => !!next[index].value && previous[index].value === next[index].value;
    const free = previous.filter((cell, index) => cell.value && !stayed(index));
    return next.filter((cell, index) => cell.value && !stayed(index)).map(cell => {
      const from = free.splice(free.findIndex(other => other.value === cell.value), 1)[0];
      return { from: from.key, to: cell.key, value: cell.value };
    });
  }

  private swapPartners(key: number, state: IGridCellState[], size: number): number[] {
    const value = state[key].value;
    const neighbours = [key - size, key + size];
    if (key % size > 0) { neighbours.push(key - 1); }
    if (key % size < size - 1) { neighbours.push(key + 1); }
    return neighbours.filter(other => state[other]?.value && state[other].value !== value);
  }
}
