import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, Input, OnDestroy } from '@angular/core';

@Component({
    selector: 'app-game-panel',
    templateUrl: './game-panel.component.html',
    styleUrl: './game-panel.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        'role': 'alertdialog',
        '[attr.aria-modal]': 'modal',
        '[attr.aria-label]': 'heading',
    }
})
export class GamePanelComponent implements AfterViewInit, OnDestroy {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private previousFocus: Element | null = null;

  @Input() heading = '';
  @Input() message = '';
  @Input() modal = true;

  ngAfterViewInit(): void {
    this.previousFocus = this.host.nativeElement.ownerDocument.activeElement;
    this.host.nativeElement.querySelector('button')?.focus();
  }

  ngOnDestroy(): void {
    (this.previousFocus as HTMLElement | null)?.focus?.();
  }
}
