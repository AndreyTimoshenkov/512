import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-locale-switcher',
  standalone: true,
  imports: [ FormsModule],
  templateUrl: './locale-switcher.component.html',
  styleUrl: './locale-switcher.component.less'
})
export class LocaleSwitcherComponent implements OnChanges{
  ngOnChanges(): void {
    console.log(this.selectedOption);
  }

  @Input() options: string[] = [];
  selectedOption: string = '';
}
