import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GridContainerComponent } from './components/grid-container/grid-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GridContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent {
  title = '512';
}
