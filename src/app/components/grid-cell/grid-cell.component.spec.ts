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

  it('lays out exactly as many pips as the tile is worth', () => {
    expect(pipGrid(0)).toEqual([1, 1]);
    expect(pipGrid(2)).toEqual([2, 1]);
    expect(pipGrid(16)).toEqual([4, 4]);
    expect(pipGrid(512)).toEqual([32, 16]);
  });
});
