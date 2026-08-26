import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestActionPanel } from './request-action-panel';

describe('RequestActionPanel', () => {
  let component: RequestActionPanel;
  let fixture: ComponentFixture<RequestActionPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestActionPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestActionPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
