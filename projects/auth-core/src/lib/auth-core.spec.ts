import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthCore } from './auth-core';

describe('AuthCore', () => {
  let component: AuthCore;
  let fixture: ComponentFixture<AuthCore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthCore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthCore);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
