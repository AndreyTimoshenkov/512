import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DEFAULT_TARGET } from '../../interfaces/general.types';
import { EPerk } from '../../interfaces/perk.types';
import { ColourDirective } from '../../directives/colour.directive';
import { GamePanelComponent } from '../game-panel/game-panel.component';
import { GridCellComponent } from '../grid-cell/grid-cell.component';
import { PerkIconComponent } from '../perk-icon/perk-icon.component';

export type TIntroDemo = 'slide' | 'merge';

export interface IIntroStep {
  title: string;
  text: string;
  demo?: TIntroDemo;
  // Values for the text, on top of the target.
  params?: Record<string, number>;
  // The perks this step is about: shows their icons here and points at them in the tray.
  perks?: EPerk[];
  // Lights up the whole tray and the ladder's reward tiles.
  spotlight?: boolean;
}

export const FIRST_PLAY_STEPS: IIntroStep[] = [
  { title: 'INTRO_MOVE_TITLE', text: 'INTRO_MOVE', demo: 'slide' },
  { title: 'INTRO_MERGE_TITLE', text: 'INTRO_MERGE', demo: 'merge' },
  { title: 'INTRO_PERKS_TITLE', text: 'INTRO_PERKS', spotlight: true },
];

// Announces everything a milestone paid out, then explains it one perk at a time.
export const perkSteps = (perks: EPerk[], tile: number): IIntroStep[] => [
  { title: 'PERK_EARNED_TITLE', text: 'PERK_EARNED_TEXT', params: { tile }, perks },
  ...perks.map(perk => ({ title: `PERK_${perk}`, text: `PERK_${perk}_INFO`, perks: [perk] })),
];

@Component({
    selector: 'app-intro',
    imports: [TranslateModule, GamePanelComponent, GridCellComponent, ColourDirective, PerkIconComponent],
    templateUrl: './intro.component.html',
    styleUrl: './intro.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class IntroComponent {
  steps = input.required<IIntroStep[]>();
  target = input(DEFAULT_TARGET);
  finishLabel = input('INTRO_PLAY');
  step = model(0);
  done = output();

  current = computed(() => this.steps()[this.step()]);
  params = computed(() => ({ target: this.target(), ...this.current().params }));
  isLast = computed(() => this.step() === this.steps().length - 1);

  next() {
    if (this.isLast()) {
      this.done.emit();
    } else {
      this.step.update(step => step + 1);
    }
  }
}
