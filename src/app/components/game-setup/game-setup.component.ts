import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DEFAULT_GRID_SIZE, DEFAULT_TARGET, GAME_TARGETS, GRID_SIZES } from '../../interfaces/general.types';

@Component({
    selector: 'app-game-setup',
    imports: [TranslateModule],
    templateUrl: './game-setup.component.html',
    styleUrl: './game-setup.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameSetupComponent {
  target = model(DEFAULT_TARGET);
  size = model(DEFAULT_GRID_SIZE);

  targets = GAME_TARGETS;
  sizes = GRID_SIZES;
}
