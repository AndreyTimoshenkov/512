import { NgIf } from '@angular/common';
import { Component, HostBinding, HostListener, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'grid-cell',
  standalone: true,
  imports: [ NgIf],
  templateUrl: './grid-cell.component.html',
  styleUrl: './grid-cell.component.less',
  host: {
    // 'class.has-value':'hasValue'
  }
})
export class GridCellComponent implements OnChanges{
  ngOnChanges(changes: SimpleChanges): void {
  //  console.log(this.hasValue, this.value)
  }
  //@ts-ignore
  @Input() value: number;
  //@ts-ignore
  @Input() key: number;

  @HostBinding('class.has-value') get hasValue() { return this.value; }
}
