import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestComponentsDemo } from './request-components-demo';

describe('RequestComponentsDemo', () => {
  let component: RequestComponentsDemo;
  let fixture: ComponentFixture<RequestComponentsDemo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestComponentsDemo],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestComponentsDemo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
