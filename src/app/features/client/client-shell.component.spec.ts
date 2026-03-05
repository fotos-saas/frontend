import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ClientShellComponent } from './client-shell.component';
import { ClientService } from './services/client.service';
import { SidebarStateService } from '../../core/layout/services/sidebar-state.service';

describe('ClientShellComponent', () => {
  let component: ClientShellComponent;
  let fixture: ComponentFixture<ClientShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientShellComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
        { provide: ClientService, useValue: {} },
        { provide: SidebarStateService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientShellComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
