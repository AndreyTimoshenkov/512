import { Component, effect, HostListener, Injector, signal, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GridContainerComponent } from './components/grid-container/grid-container.component';
import { GridCellComponent } from './components/grid-cell/grid-cell.component';
import { GridRowComponent } from './components/grid-row/grid-row.component';
import { IGridCellState } from './components/grid-cell/grid-cell.type';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GridContainerComponent, GridCellComponent, GridRowComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent {
  title = '512';
  rows = [0, 1, 2, 3];
  values = [1, 2, 2, 1];
  state: WritableSignal<Array<number>> = signal(this.values);
  turn: number = 0;

  constructor(private injector: Injector) {
    this.state.set(this.values);
    effect(() => {
      if (this.state()) console.log('effect', this.state());
    }, {injector: this.injector})
  }

  @HostListener('window:keydown.ArrowRight', ['$event'])
  right(event: KeyboardEvent) {
    this.state.update((state) => {
      // return Array.from(this.shiftArrayRight(state))
      return [...this.shiftArrayRight(state)]
    });
    this.turn++;
  }

  @HostListener('window:keydown.ArrowLeft', ['$event'])
  left(event: KeyboardEvent) {
    this.state.update((state) => {
      return Array.from(this.shiftArrayLeft(state))
    });
    this.turn++;
  }

  shiftArrayRight(list: Array<number>): Array<number> {
    for (let i = 0; i < list.length - 1; i++) {
      if ((list[i] && !list[i + 1]) || list[i] === list[i + 1]) {
        list[i + 1] += list[i];
        list[i] = 0;
      }
    }
    for (let i = 0; i < list.length - 1; i++) {
      if (list[i] && !list[i + 1]) {
        list[i + 1] += list[i];
        list[i] = 0;
      }
    }
    return list;
  }

  shiftArrayLeft(list: Array<number>): Array<number> {
    for (let i = list.length - 1; i > 0; i--) {
      if ((list[i] && !list[i - 1]) || list[i] === list[i - 1]) {
        list[i - 1] += list[i];
        list[i] = 0;
      }
    }
    for (let i = list.length - 1; i > 0; i--) {
      if (list[i] && !list[i - 1]) {
        list[i - 1] = list[i];
        list[i] = 0;
      }
    }
    return list;
  }

  onGridCellEmit(state: IGridCellState) {
    // console.log(state);
  }
}
