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

  it('splits and slides lines of any length', () => {
    const state = Array.from({ length: 36 }, (_, key) => ({ key, value: key === 6 ? 2 : 0 }));
    const rows = service.splitArray(state, EDirection.right, 6);
    expect(rows.length).toBe(6);
    expect(rows[1].map(cell => cell.key)).toEqual([6, 7, 8, 9, 10, 11]);
    expect(service.splitArray(state, EDirection.down, 6)[0].map(cell => cell.key)).toEqual([0, 6, 12, 18, 24, 30]);
    expect(service.shiftArray(rows[1], EDirection.right)[0].map(cell => cell.value)).toEqual([0, 0, 0, 0, 0, 2]);
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
