import { TestBed } from '@angular/core/testing';

import { PerksService } from './perks.service';
import { GameService } from '../game/game.service';
import { EPerk, PERKS } from '../../interfaces/perk.types';

describe('PerksService', () => {
  let service: PerksService;
  const board = (values: number[]) => values.map((value, key) => ({ key, value }));
  const values = (state: { value: number }[]) => state.map(cell => cell.value);

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PerksService);
  });

  it('starts every game with one undo', () => {
    const perks = service.newPerks();
    expect(perks.inventory[EPerk.undo]).toBe(1);
    expect(perks.inventory[EPerk.hammer]).toBe(0);
  });

  it('awards a whole tier at an eighth, a quarter and half of the target', () => {
    const [low, middle, high] = [
      [EPerk.double, EPerk.swap, EPerk.hammer],
      [EPerk.undo, EPerk.shuffle, EPerk.sweep],
      [EPerk.save, EPerk.upgrade],
    ];
    expect(service.rewardTiles(512)).toEqual([64, 128, 256]);
    expect(service.rewardTiles(1024)).toEqual([128, 256, 512]);
    expect(service.rewardTiles(2048)).toEqual([256, 512, 1024]);

    expect(service.earned(2, 32, 512)).toEqual([]);
    expect(service.earned(32, 64, 512)).toEqual(low);
    expect(service.earned(64, 128, 512)).toEqual(middle);
    expect(service.earned(128, 256, 512)).toEqual(high);
    expect(service.earned(32, 64, 1024)).toEqual([]);
    expect(service.earned(256, 512, 1024)).toEqual(high);
  });

  it('pays once, stops at the target, and covers tiers passed in a single move', () => {
    expect(service.earned(64, 64, 512)).toEqual([]);
    expect(service.earned(256, 2048, 512)).toEqual([]);
    expect(service.earned(32, 128, 512)).toEqual([EPerk.double, EPerk.swap, EPerk.hammer, EPerk.undo, EPerk.shuffle, EPerk.sweep]);
  });

  it('hands out every perk once, weakest first, climbing the ladder', () => {
    expect(service.earned(2, 256, 512)).toEqual(PERKS);
  });

  it('says which tile earns each perk for the target', () => {
    expect(service.rewardTile(EPerk.hammer, 512)).toBe(64);
    expect(service.rewardTile(EPerk.upgrade, 2048)).toBe(1024);
  });

  it('keeps older saved games working when perks are added', () => {
    const old = service.newPerks(64);
    const { [EPerk.save]: _, ...inventory } = old.inventory;
    const restored = service.restore({ ...old, inventory: { ...inventory, [EPerk.undo]: 0 } } as never, 64);
    expect(restored.inventory[EPerk.save]).toBe(0);
    expect(restored.inventory[EPerk.undo]).toBe(0);
    expect(service.restore(null, 64).highest).toBe(64);
  });

  it('only offers a perk that is owned and can do something', () => {
    const perks = service.newPerks();
    perks.inventory = { ...perks.inventory, [EPerk.sweep]: 1, [EPerk.double]: 1, [EPerk.shuffle]: 1 };
    const mixed = board([2, 8, ...Array(14).fill(0)]);

    expect(service.isAvailable(EPerk.undo, perks, mixed, 4, false)).toBe(false);
    expect(service.isAvailable(EPerk.hammer, perks, mixed, 4, false)).toBe(false);
    expect(service.isAvailable(EPerk.sweep, perks, mixed, 4, false)).toBe(true);
    expect(service.isAvailable(EPerk.sweep, perks, board([2, 4, ...Array(14).fill(0)]), 4, false)).toBe(false);
    expect(service.isAvailable(EPerk.sweep, perks, board([8, 16, ...Array(14).fill(0)]), 4, false)).toBe(false);
    expect(service.isAvailable(EPerk.shuffle, perks, board([8, ...Array(15).fill(0)]), 4, false)).toBe(false);
    expect(service.isAvailable(EPerk.double, perks, mixed, 4, true)).toBe(false);
    expect(service.isAvailable(EPerk.double, { ...perks, doubleMoves: 3 }, mixed, 4, false)).toBe(false);
  });

  it('never lets upgrade touch the highest tile, so it cannot win the game', () => {
    const state = board([256, 128, 256, 4, ...Array(12).fill(0)]);
    expect([...service.pickable(EPerk.upgrade, state, 4)]).toEqual([1, 3]);
    expect(values(service.upgrade(state, 1)).slice(0, 2)).toEqual([256, 256]);
  });

  it('keeps at least one tile on the board when smashing', () => {
    expect(service.pickable(EPerk.hammer, board([8, ...Array(15).fill(0)]), 4).size).toBe(0);
    expect(values(service.hammer(board([8, 2, ...Array(14).fill(0)]), 0)).slice(0, 2)).toEqual([0, 2]);
  });

  it('swaps only neighbouring tiles of different values, not around row ends', () => {
    const state = board([2, 4, 0, 0, 8, ...Array(11).fill(0)]);
    expect([...service.pickable(EPerk.swap, state, 4)].sort((a, b) => a - b)).toEqual([0, 1, 4]);
    expect([...service.pickable(EPerk.swap, state, 4, 0)].sort((a, b) => a - b)).toEqual([1, 4]);

    const wrapped = board([0, 0, 0, 2, 4, ...Array(11).fill(0)]);
    expect(service.pickable(EPerk.swap, wrapped, 4).size).toBe(0);
    expect(values(service.swap(state, 0, 1)).slice(0, 2)).toEqual([4, 2]);
  });

  it('sweeps away the 2s and 4s and leaves the rest', () => {
    expect(values(service.sweep(board([2, 4, 8, 16])))).toEqual([0, 0, 8, 16]);
  });

  it('shuffles a stuck board into one with a move, keeping the same tiles', () => {
    const stuck = board([2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2]);
    const game = TestBed.inject(GameService);
    expect(game.isGameOver(stuck, 4)).toBe(true);

    const shuffled = service.shuffle(stuck, 4);
    expect(game.isGameOver(shuffled, 4)).toBe(false);
    expect(values(shuffled).sort()).toEqual(values(stuck).sort());
    expect(shuffled.map(cell => cell.key)).toEqual(stuck.map(cell => cell.key));
  });
});
