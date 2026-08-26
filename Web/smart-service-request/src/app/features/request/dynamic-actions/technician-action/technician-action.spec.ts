import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechnicianAction } from './technician-action';

describe('TechnicianAction', () => {
  let component: TechnicianAction;
  let fixture: ComponentFixture<TechnicianAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechnicianAction],
    }).compileComponents();

    fixture = TestBed.createComponent(TechnicianAction);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
