import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ESupportedLocale, TCodes } from './locale.types';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { map, Subscription } from 'rxjs';
import { LocalStorageService } from '../../services/local-storage/local-storage.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-locale-switcher',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, CommonModule, IconComponent ],
  templateUrl: './locale-switcher.component.html',
  styleUrl: './locale-switcher.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocaleSwitcherComponent implements OnInit, OnDestroy {
  options = ESupportedLocale;
  form = new FormGroup({
    localeControl: new FormControl<TCodes>(null),
  });
  subscription: Subscription;

  @Output() localeChanged = new EventEmitter<TCodes>();

  get locale(): ESupportedLocale {
    return this.ls.getLocale() ? this.ls.getLocale() : environment.locale;
  }

  constructor(private ls: LocalStorageService) {}

  ngOnInit(): void {
    this.form.patchValue({
      localeControl: this.sanitize(this.locale)
    })

    this.subscription = this.form.valueChanges.pipe(
      map(data => data.localeControl?.valueOf() as TCodes)
    ).subscribe((selected: TCodes) => {
      if (ESupportedLocale.hasOwnProperty(selected)) {
        this.ls.saveLocale(ESupportedLocale[selected]);
        this.localeChanged.emit(selected);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  sanitize(item: ESupportedLocale): TCodes {
    if (!item) return null;

    for (const [key, value] of Object.entries(ESupportedLocale)) {
      if (item === value) { return key as TCodes; }
    }
    return null;
  }
}
