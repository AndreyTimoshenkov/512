import { vi } from 'vitest';
import { SwipeDirective } from './swipe.directive';
import { EDirection } from '../interfaces/general.types';

describe('SwipeDirective', () => {
  let directive: SwipeDirective;
  const host = { setPointerCapture: vi.fn(), hasPointerCapture: () => true, releasePointerCapture: vi.fn() };
  const pointer = (x: number, y: number, overrides = {}) => ({
    pointerId: 1, clientX: x, clientY: y, button: 0, isPrimary: true,
    currentTarget: host, ...overrides,
  } as unknown as PointerEvent);

  beforeEach(() => { directive = new SwipeDirective(); });

  it.each([
    [100, 10, EDirection.right], [-100, 10, EDirection.left],
    [10, -100, EDirection.up], [10, 100, EDirection.down],
  ])('emits the dominant direction for (%s, %s) once on release', (x, y, direction) => {
    const emit = vi.spyOn(directive.swipe, 'emit');
    directive.onPointerDown(pointer(0, 0));
    directive.onPointerUp(pointer(x, y));
    directive.onPointerUp(pointer(x, y));
    expect(emit).toHaveBeenCalledExactlyOnceWith(direction);
  });

  it('ignores taps, short movements, and ambiguous diagonals', () => {
    const emit = vi.spyOn(directive.swipe, 'emit');
    for (const [x, y] of [[0, 0], [29, 10], [60, 60]]) {
      directive.onPointerDown(pointer(0, 0));
      directive.onPointerUp(pointer(x, y));
    }
    expect(emit).not.toHaveBeenCalled();
  });

  it('ignores secondary buttons and canceled or multi-touch gestures', () => {
    const emit = vi.spyOn(directive.swipe, 'emit');
    directive.onPointerDown(pointer(0, 0, { button: 2 }));
    directive.onPointerUp(pointer(100, 0));
    directive.onPointerDown(pointer(0, 0));
    directive.cancel(pointer(0, 0));
    directive.onPointerUp(pointer(100, 0));
    directive.onPointerDown(pointer(0, 0));
    directive.onPointerDown(pointer(0, 0, { pointerId: 2, isPrimary: false }));
    directive.onPointerUp(pointer(100, 0));
    expect(emit).not.toHaveBeenCalled();
  });

  it('ignores release from another pointer while preserving the active gesture', () => {
    const emit = vi.spyOn(directive.swipe, 'emit');
    directive.onPointerDown(pointer(0, 0));
    directive.onPointerUp(pointer(100, 0, { pointerId: 2 }));
    expect(emit).not.toHaveBeenCalled();
    directive.onPointerUp(pointer(100, 0));
    expect(emit).toHaveBeenCalledExactlyOnceWith(EDirection.right);
  });
});
