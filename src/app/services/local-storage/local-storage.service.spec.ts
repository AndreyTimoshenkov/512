import { TestBed } from '@angular/core/testing';

import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('remembers the intro was seen across saves and new games', () => {
    localStorage.clear();
    expect(service.getIntroSeen()).toBe(false);
    service.saveIntroSeen();
    service.saveState([{ key: 0, value: 2 }]);
    service.clear();
    expect(service.getIntroSeen()).toBe(true);
    localStorage.clear();
  });

  it('falls back to the default target when nothing valid is saved', () => {
    localStorage.clear();
    expect(service.getTarget()).toBe(512);
    localStorage.setItem('target', '999');
    expect(service.getTarget()).toBe(512);
    service.saveTarget(2048);
    expect(service.getTarget()).toBe(2048);
    localStorage.clear();
  });
});
