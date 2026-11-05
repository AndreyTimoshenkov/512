import { TestBed } from '@angular/core/testing';

import { GameService } from './game.service';

describe('GameService', () => {
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('checks every line of a larger board without touching it', () => {
    const checkerboard = Array.from({ length: 25 }, (_, key) => ({ key, value: key % 2 ? 2 : 4 }));
    const snapshot = structuredClone(checkerboard);
    expect(service.isGameOver(checkerboard, 5)).toBe(true);
    expect(checkerboard).toEqual(snapshot);

    checkerboard[24].value = 2;
    checkerboard[23].value = 2;
    expect(service.isGameOver(checkerboard, 5)).toBe(false);
  });

  it('wins at the given target', () => {
    const state = [{ key: 0, value: 512 }];
    expect(service.isGameWon(state)).toBe(true);
    expect(service.isGameWon(state, 1024)).toBe(false);
  });
});
