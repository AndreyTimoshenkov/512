import { Directive, EventEmitter, Output } from '@angular/core';
import { EDirection } from '../interfaces/general.types';

@Directive({
  selector: '[appSwipe]',
  standalone: true,
  host: {
    '[style.touch-action]': '"none"',
    '[style.user-select]': '"none"',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'cancel($event)',
    '(lostpointercapture)': 'cancel($event)',
  },
})
export class SwipeDirective {
  // Capturing the pointer would steal the click from these, so gestures never start on them.
  private readonly controls = 'a, button, input, label, select, textarea';

  @Output() swipe = new EventEmitter<EDirection>();

  private start: { id: number; x: number; y: number } | null = null;
  private readonly threshold = 30;

  onPointerDown(event: PointerEvent): void {
    // A second contact cancels the gesture rather than producing an accidental move.
    if (!event.isPrimary) {
      this.start = null;
      return;
    }
    if (event.button !== 0 || this.start || (event.target as Element | null)?.closest?.(this.controls)) { return; }
    this.start = { id: event.pointerId, x: event.clientX, y: event.clientY };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPointerUp(event: PointerEvent): void {
    const start = this.start;
    if (!start || event.pointerId !== start.id) { return; }
    this.start = null;
    const host = event.currentTarget as HTMLElement;
    if (host.hasPointerCapture(event.pointerId)) {
      host.releasePointerCapture(event.pointerId);
    }

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < this.threshold || Math.abs(dx) === Math.abs(dy)) {
      return;
    }
    this.swipe.emit(Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? EDirection.right : EDirection.left)
      : (dy > 0 ? EDirection.down : EDirection.up));
  }

  cancel(event: PointerEvent): void {
    if (event.pointerId === this.start?.id) { this.start = null; }
  }
}
