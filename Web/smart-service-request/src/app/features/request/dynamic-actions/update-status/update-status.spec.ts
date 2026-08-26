import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateStatus } from './update-status';

describe('UpdateStatus', () => {
  let component: UpdateStatus;
  let fixture: ComponentFixture<UpdateStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateStatus],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateStatus);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
