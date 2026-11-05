import { TestBed } from '@angular/core/testing';

import { ShiftService } from './shift.service';
import { EDirection } from '../../interfaces/general.types';

describe('ShiftService', () => {
  let service: ShiftService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShiftService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('scores each merge by the power of two of the merged tiles, in both directions', () => {
    const row = (values: number[]) => values.map((value, key) => ({ key, value }));
    expect(service.shiftArray(row([2, 2, 4, 4]), EDirection.left)[1]).toBe(3);
    expect(service.shiftArray(row([2, 2, 4, 4]), EDirection.right)[1]).toBe(3);
    expect(service.shiftArray(row([8, 0, 0, 8]), EDirection.up)[1]).toBe(3);
    expect(service.shiftArray(row([256, 256, 0, 0]), EDirection.left)[1]).toBe(8);
    expect(service.shiftArray(row([2, 4, 8, 16]), EDirection.down)[1]).toBe(0);
  });

  it('counts each step of a chain merge', () => {
    const row = [2, 2, 4, 0].map((value, key) => ({ key, value }));
    const [line, score] = service.shiftArray(row, EDirection.left);
    expect(line.map(cell => cell.value)).toEqual([8, 0, 0, 0]);
    expect(score).toBe(3);
  });

  it('traces where every tile lands', () => {
    const row = (values: number[]) => values.map((value, key) => ({ key, value }));
    expect(service.traceMoves(row([2, 2, 0, 4]), row([0, 0, 4, 4]))).toEqual([
      { from: 0, to: 2, value: 2 },
      { from: 1, to: 2, value: 2 },
      { from: 3, to: 3, value: 4 },
    ]);
    expect(service.traceMoves(row([2, 0, 8, 0]), row([0, 0, 2, 8]))).toEqual([
      { from: 0, to: 2, value: 2 },
      { from: 2, to: 3, value: 8 },
    ]);
  });
});
