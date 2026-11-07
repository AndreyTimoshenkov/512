import { inject } from '@angular/core';
import type { GamePlatform } from './game-platform';
import { YandexPlatform } from './yandex-platform';

export function createPlatform(): GamePlatform {
  return inject(YandexPlatform);
}
