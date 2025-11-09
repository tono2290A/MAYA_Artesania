import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventarioModificar } from './inventario-modificar';

describe('InventarioModificar', () => {
  let component: InventarioModificar;
  let fixture: ComponentFixture<InventarioModificar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventarioModificar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventarioModificar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
