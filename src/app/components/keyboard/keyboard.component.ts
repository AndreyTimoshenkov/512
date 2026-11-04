import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { EDirection } from '../../interfaces/general.types';

@Component({
    selector: 'app-keyboard',
    imports: [],
    templateUrl: './keyboard.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './keyboard.component.less'
})
export class KeyboardComponent {
  @Output() keyboardClick = new EventEmitter<EDirection>();

  onLeftClick() {
    this.keyboardClick.emit(EDirection.left);
  }

  onRightClick() {
    this.keyboardClick.emit(EDirection.right);
  }

  onUpClick() {
    this.keyboardClick.emit(EDirection.up);
  }

  onDownClick() {
    this.keyboardClick.emit(EDirection.down);
  }
}
