import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecepcionCompra } from './recepcion-compra';

describe('RecepcionCompra', () => {
  let component: RecepcionCompra;
  let fixture: ComponentFixture<RecepcionCompra>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecepcionCompra]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecepcionCompra);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
