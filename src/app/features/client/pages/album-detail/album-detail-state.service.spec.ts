import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { DestroyRef } from '@angular/core';
import { of } from 'rxjs';
import { AlbumDetailStateService } from './album-detail-state.service';
import { ClientService } from '../../services/client.service';

describe('AlbumDetailStateService', () => {
  let service: AlbumDetailStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AlbumDetailStateService,
        { provide: ActivatedRoute, useValue: { paramMap: of(new Map()) } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ClientService, useValue: { getAlbumDetail: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(AlbumDetailStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.album()).toBeNull();
    expect(service.loading()).toBe(true);
    expect(service.error()).toBeNull();
    expect(service.saving()).toBe(false);
    expect(service.selectedIds()).toEqual([]);
  });
});
