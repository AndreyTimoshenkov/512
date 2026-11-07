import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EPerk } from '../../interfaces/perk.types';
import { PerkIconComponent } from '../perk-icon/perk-icon.component';

@Component({
    selector: 'app-rescue-perks',
    imports: [TranslateModule, PerkIconComponent],
    templateUrl: './rescue-perks.component.html',
    styleUrl: './rescue-perks.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RescuePerksComponent {
  perks = input.required<Set<EPerk>>();
  saved = input(false);
  use = output<EPerk>();
  reload = output();

  save = EPerk.save;
}
