import { Component, effect, HostListener, OnInit, signal, ViewChild, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GridContainerComponent } from './components/grid-container/grid-container.component';
import { GridCellComponent } from './components/grid-cell/grid-cell.component';
import { EDirection } from './interfaces/general.types';
import { isDirection } from './helpers/event.helpers';
import { LocalStorageService } from './services/local-storage/local-storage.service';
import { KeyboardComponent } from './components/keyboard/keyboard/keyboard.component';
import { BreakpointObserver, BreakpointState } from './services/breakpoint-observer/breakpoint-observer';
import { NgIf } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GridContainerComponent, GridCellComponent, KeyboardComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
})
export class AppComponent implements OnInit{
  turn$$: WritableSignal<number> = signal(1);
  score$$: WritableSignal<number> = signal(0);
  isMobile$$ = signal(false);

  //@ts-ignore
  @ViewChild(GridContainerComponent) container: GridContainerComponent;

  constructor(
    private ls: LocalStorageService,
    private breakPointObserver: BreakpointObserver,
  ) {
    //@ts-ignore
    this.isMobile$$ = toSignal(this.breakPointObserver.observe('(max-width: 959.98px)').pipe(
        map((state: BreakpointState) => state.matches)
    ));
    effect(() => {
      this.ls.saveTurn(this.turn$$());
    })
  }
  ngOnInit(): void {
    const turn = this.ls.getTurn();
    this.turn$$.set(turn);
    // this.shift
  }

  @HostListener('window:keydown', ['$event'])
    move(event: KeyboardEvent) {
      const direction = event.code as EDirection;
      if (!isDirection(direction)) { return; }
      this.container.move(direction);
    }

  restartGame() {
    this.container.restartGame();
    this.turn$$.set(1);
  }

  onKeyboardClick(direction: EDirection) {
    this.container.move(direction);
  }

  updateTurn() {
    this.turn$$.update(turn => turn += 1);
  }
}