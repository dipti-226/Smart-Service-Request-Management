import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestCard } from './request-card';

describe('RequestCard', () => {
  let component: RequestCard;
  let fixture: ComponentFixture<RequestCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestCard],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
