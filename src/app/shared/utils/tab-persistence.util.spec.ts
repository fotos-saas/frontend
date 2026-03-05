import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { initTabFromFragment, setTabFragment } from './tab-persistence.util';

type TestTab = 'overview' | 'users' | 'settings';
const VALID_TABS: readonly TestTab[] = ['overview', 'users', 'settings'] as const;

describe('tab-persistence.util', () => {
  let mockLocation: {
    path: ReturnType<typeof vi.fn>;
    replaceState: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockLocation = {
      path: vi.fn(),
      replaceState: vi.fn(),
    };
  });

  // ==========================================================================
  // initTabFromFragment
  // ==========================================================================
  describe('initTabFromFragment', () => {
    it('should set tab from URL fragment', () => {
      TestBed.configureTestingModule({});
      TestBed.runInInjectionContext(() => {
        const tabSignal = signal<TestTab>('overview');
        mockLocation.path.mockReturnValue('/page#users');

        initTabFromFragment(tabSignal, mockLocation as unknown as Location, VALID_TABS, 'overview');

        expect(tabSignal()).toBe('users');
      });
    });

    it('should not change signal if fragment is not a valid tab', () => {
      TestBed.configureTestingModule({});
      TestBed.runInInjectionContext(() => {
        const tabSignal = signal<TestTab>('overview');
        mockLocation.path.mockReturnValue('/page#invalid');

        initTabFromFragment(tabSignal, mockLocation as unknown as Location, VALID_TABS, 'overview');

        expect(tabSignal()).toBe('overview');
      });
    });

    it('should not change signal if no fragment', () => {
      TestBed.configureTestingModule({});
      TestBed.runInInjectionContext(() => {
        const tabSignal = signal<TestTab>('overview');
        mockLocation.path.mockReturnValue('/page');

        initTabFromFragment(tabSignal, mockLocation as unknown as Location, VALID_TABS, 'overview');

        expect(tabSignal()).toBe('overview');
      });
    });

    it('should not change signal if fragment is empty after hash', () => {
      TestBed.configureTestingModule({});
      TestBed.runInInjectionContext(() => {
        const tabSignal = signal<TestTab>('overview');
        mockLocation.path.mockReturnValue('/page#');

        initTabFromFragment(tabSignal, mockLocation as unknown as Location, VALID_TABS, 'overview');

        expect(tabSignal()).toBe('overview');
      });
    });

    it('should handle the settings tab', () => {
      TestBed.configureTestingModule({});
      TestBed.runInInjectionContext(() => {
        const tabSignal = signal<TestTab>('overview');
        mockLocation.path.mockReturnValue('/dashboard#settings');

        initTabFromFragment(tabSignal, mockLocation as unknown as Location, VALID_TABS, 'overview');

        expect(tabSignal()).toBe('settings');
      });
    });
  });

  // ==========================================================================
  // setTabFragment
  // ==========================================================================
  describe('setTabFragment', () => {
    it('should set signal and update URL fragment', () => {
      TestBed.configureTestingModule({});
      TestBed.runInInjectionContext(() => {
        const tabSignal = signal<TestTab>('overview');
        mockLocation.path.mockReturnValue('/page');

        setTabFragment(tabSignal, mockLocation as unknown as Location, 'users', 'overview');

        expect(tabSignal()).toBe('users');
        expect(mockLocation.replaceState).toHaveBeenCalledWith('/page#users');
      });
    });

    it('should remove fragment for default tab', () => {
      TestBed.configureTestingModule({});
      TestBed.runInInjectionContext(() => {
        const tabSignal = signal<TestTab>('users');
        mockLocation.path.mockReturnValue('/page#users');

        setTabFragment(tabSignal, mockLocation as unknown as Location, 'overview', 'overview');

        expect(tabSignal()).toBe('overview');
        expect(mockLocation.replaceState).toHaveBeenCalledWith('/page');
      });
    });

    it('should replace existing fragment', () => {
      TestBed.configureTestingModule({});
      TestBed.runInInjectionContext(() => {
        const tabSignal = signal<TestTab>('users');
        mockLocation.path.mockReturnValue('/page#users');

        setTabFragment(tabSignal, mockLocation as unknown as Location, 'settings', 'overview');

        expect(tabSignal()).toBe('settings');
        expect(mockLocation.replaceState).toHaveBeenCalledWith('/page#settings');
      });
    });

    it('should handle path without existing fragment', () => {
      TestBed.configureTestingModule({});
      TestBed.runInInjectionContext(() => {
        const tabSignal = signal<TestTab>('overview');
        mockLocation.path.mockReturnValue('/dashboard/projects');

        setTabFragment(tabSignal, mockLocation as unknown as Location, 'settings', 'overview');

        expect(mockLocation.replaceState).toHaveBeenCalledWith('/dashboard/projects#settings');
      });
    });
  });
});
