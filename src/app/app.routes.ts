import { Routes } from '@angular/router';
import { LocaleSwitcherComponent } from './components/locale-switcher/locale-switcher.component';

export const routes: Routes = [
  {
    path: '**',
    redirectTo: ''
  }
];
