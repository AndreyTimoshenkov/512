import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridCellComponent } from './grid-cell.component';
import { pipGrid } from './grid-cell.helper';

describe('GridCellComponent', () => {
  let component: GridCellComponent;
  let fixture: ComponentFixture<GridCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridCellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GridCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows its value and marks itself as a tile', () => {
    fixture.componentRef.setInput('value', 128);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent).toContain('128');
    expect(host.classList.contains('has-value')).toBe(true);
    expect(host.dataset['digits']).toBe('3');

    fixture.componentRef.setInput('value', 0);
    fixture.detectChanges();
    expect(host.textContent?.trim()).toBe('');
    expect(host.classList.contains('has-value')).toBe(false);
  });

  it('lays out exactly as many pips as the tile is worth', () => {
    expect(pipGrid(0)).toEqual([1, 1]);
    expect(pipGrid(2)).toEqual([2, 1]);
    expect(pipGrid(16)).toEqual([4, 4]);
    expect(pipGrid(512)).toEqual([32, 16]);
  });
});
