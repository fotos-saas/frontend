import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DestroyRef } from '@angular/core';
import { AlbumListStateService } from './album-list-state.service';
import { ClientService } from '../../services/client.service';

describe('AlbumListStateService', () => {
  let service: AlbumListStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AlbumListStateService,
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ClientService, useValue: { getAlbums: vi.fn() } },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });
    service = TestBed.inject(AlbumListStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default signal values', () => {
    expect(service.albums()).toEqual([]);
    expect(service.loading()).toBe(true);
    expect(service.error()).toBeNull();
  });
});
