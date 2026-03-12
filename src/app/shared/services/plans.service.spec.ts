import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PlansService, PlansResponse, PlanConfig, PlanLimits } from './plans.service';

// ─── Mock adat ───

const mockPlanLimits = (overrides: Partial<PlanLimits> = {}): PlanLimits => ({
  storage_gb: 5,
  max_classes: 10,
  max_schools: 20,
  max_contacts: 50,
  max_templates: 10,
  ...overrides,
});

const mockPlanConfig = (overrides: Partial<PlanConfig> = {}): PlanConfig => ({
  name: 'TablóStúdió Alap',
  description: 'Alap csomag',
  monthly_price: 5000,
  yearly_price: 50000,
  paused_price: 1000,
  limits: mockPlanLimits(),
  feature_keys: ['basic'],
  feature_labels: ['Alap funkciók'],
  ...overrides,
});

const mockPlansResponse: PlansResponse = {
  plans: {
    alap: mockPlanConfig({
      name: 'TablóStúdió Alap',
      description: 'Alap csomag',
      monthly_price: 5000,
      yearly_price: 50000,
      paused_price: 1000,
      limits: mockPlanLimits({ storage_gb: 5, max_classes: 10, max_schools: 20, max_contacts: 50, max_templates: 10 }),
      feature_labels: ['Alap funkciók'],
    }),
    iskola: mockPlanConfig({
      name: 'TablóStúdió Iskola',
      description: 'Iskola csomag',
      popular: true,
      monthly_price: 15000,
      yearly_price: 150000,
      paused_price: 3000,
      limits: mockPlanLimits({ storage_gb: 100, max_classes: 20, max_schools: null, max_contacts: null, max_templates: null }),
      feature_labels: ['Alap funkciók', 'Iskola funkciók'],
    }),
    studio: mockPlanConfig({
      name: 'TablóStúdió Stúdió',
      description: 'Stúdió csomag',
      monthly_price: 30000,
      yearly_price: 300000,
      paused_price: 5000,
      limits: mockPlanLimits({ storage_gb: 500, max_classes: null, max_schools: null, max_contacts: null, max_templates: null }),
      feature_labels: ['Alap funkciók', 'Iskola funkciók', 'Stúdió funkciók'],
    }),
    vip: mockPlanConfig({
      name: 'TablóStúdió VIP',
      description: 'VIP csomag',
      monthly_price: 50000,
      yearly_price: 500000,
      paused_price: 8000,
      limits: mockPlanLimits({ storage_gb: null, max_classes: null, max_schools: null, max_contacts: null, max_templates: null }),
      feature_labels: ['Minden funkció'],
    }),
  },
  addons: {
    webshop: {
      name: 'Webshop',
      description: 'Webshop addon',
      includes: ['webshop_feature'],
      monthly_price: 3000,
      yearly_price: 30000,
      available_for: ['iskola', 'studio'],
    },
  },
  storage_addon: {
    unit_price_monthly: 500,
    unit_price_yearly: 5000,
  },
};

describe('PlansService', () => {
  let service: PlansService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlansService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ==========================================================================
  // getPlans
  // ==========================================================================
  describe('getPlans', () => {
    it('HTTP GET kérést küld az /api/plans-ra', () => {
      service.getPlans().subscribe(result => {
        expect(result).toEqual(mockPlansResponse);
      });

      const req = httpMock.expectOne('/api/plans');
      expect(req.request.method).toBe('GET');
      req.flush(mockPlansResponse);
    });

    it('cache-eli az eredményt a második hívásra', () => {
      // Első hívás
      service.getPlans().subscribe();
      const req = httpMock.expectOne('/api/plans');
      req.flush(mockPlansResponse);

      // Második hívás — nem indít új HTTP kérést
      service.getPlans().subscribe(result => {
        expect(result).toEqual(mockPlansResponse);
      });
      httpMock.expectNone('/api/plans');
    });

    it('clearCache után újra kérést indít', () => {
      // Első hívás + cache feltöltés
      service.getPlans().subscribe();
      httpMock.expectOne('/api/plans').flush(mockPlansResponse);

      // Cache törlés
      service.clearCache();

      // Harmadik hívás — újra HTTP kérés
      service.getPlans().subscribe();
      const req = httpMock.expectOne('/api/plans');
      req.flush(mockPlansResponse);
    });
  });

  // ==========================================================================
  // getPricingPlans
  // ==========================================================================
  describe('getPricingPlans', () => {
    it('PricingPlan tömbbé formázza a plans-t', () => {
      service.getPricingPlans().subscribe(plans => {
        expect(plans.length).toBe(4);

        const alap = plans.find(p => p.id === 'alap');
        expect(alap).toBeDefined();
        expect(alap!.name).toBe('Alap'); // "TablóStúdió " prefix levágva
        expect(alap!.monthlyPrice).toBe(5000);
        expect(alap!.yearlyPrice).toBe(50000);
        expect(alap!.pausedPrice).toBe(1000);
        expect(alap!.features).toEqual(['Alap funkciók']);
        expect(alap!.limits).toEqual(mockPlansResponse.plans['alap'].limits);
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });

    it('popular flag-et is átadja', () => {
      service.getPricingPlans().subscribe(plans => {
        const iskola = plans.find(p => p.id === 'iskola');
        expect(iskola!.popular).toBe(true);

        const alap = plans.find(p => p.id === 'alap');
        expect(alap!.popular).toBeUndefined();
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });
  });

  // ==========================================================================
  // getPlan
  // ==========================================================================
  describe('getPlan', () => {
    it('egyetlen plan-t ad vissza ID alapján', () => {
      service.getPlan('iskola').subscribe(plan => {
        expect(plan).toBeDefined();
        expect(plan!.name).toBe('TablóStúdió Iskola');
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });

    it('null-t ad vissza nem létező plan ID-ra', () => {
      service.getPlan('nem_letezik').subscribe(plan => {
        expect(plan).toBeNull();
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });
  });

  // ==========================================================================
  // getAddon
  // ==========================================================================
  describe('getAddon', () => {
    it('addon-t ad vissza key alapján', () => {
      service.getAddon('webshop').subscribe(addon => {
        expect(addon).toBeDefined();
        expect(addon!.name).toBe('Webshop');
        expect(addon!.monthly_price).toBe(3000);
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });

    it('null-t ad vissza nem létező addon key-re', () => {
      service.getAddon('nem_letezik').subscribe(addon => {
        expect(addon).toBeNull();
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });
  });

  // ==========================================================================
  // getStorageAddonPrices
  // ==========================================================================
  describe('getStorageAddonPrices', () => {
    it('storage addon árakat ad vissza', () => {
      service.getStorageAddonPrices().subscribe(prices => {
        expect(prices.unit_price_monthly).toBe(500);
        expect(prices.unit_price_yearly).toBe(5000);
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });
  });

  // ==========================================================================
  // getPlanPrices
  // ==========================================================================
  describe('getPlanPrices', () => {
    it('minden plan monthly és yearly árait adja', () => {
      service.getPlanPrices().subscribe(prices => {
        expect(prices['alap']).toEqual({ monthly: 5000, yearly: 50000 });
        expect(prices['iskola']).toEqual({ monthly: 15000, yearly: 150000 });
        expect(prices['studio']).toEqual({ monthly: 30000, yearly: 300000 });
        expect(prices['vip']).toEqual({ monthly: 50000, yearly: 500000 });
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });
  });

  // ==========================================================================
  // getNextPlan
  // ==========================================================================
  describe('getNextPlan', () => {
    it('a következő magasabb csomagot adja vissza', () => {
      service.getNextPlan('alap').subscribe(plan => {
        expect(plan).toBeDefined();
        expect(plan!.name).toBe('TablóStúdió Iskola');
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });

    it('null-t ad a legmagasabb csomag után', () => {
      service.getNextPlan('vip').subscribe(plan => {
        expect(plan).toBeNull();
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });

    it('null-t ad ismeretlen plan ID-ra', () => {
      service.getNextPlan('nem_letezik').subscribe(plan => {
        expect(plan).toBeNull();
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });
  });

  // ==========================================================================
  // getNextPlanId
  // ==========================================================================
  describe('getNextPlanId', () => {
    it('a következő csomag ID-ját adja vissza', () => {
      expect(service.getNextPlanId('alap')).toBe('iskola');
      expect(service.getNextPlanId('iskola')).toBe('studio');
      expect(service.getNextPlanId('studio')).toBe('vip');
    });

    it('null-t ad a legmagasabb csomagra', () => {
      expect(service.getNextPlanId('vip')).toBeNull();
    });

    it('null-t ad ismeretlen plan ID-ra', () => {
      expect(service.getNextPlanId('nem_letezik')).toBeNull();
    });
  });

  // ==========================================================================
  // getPlanLimit
  // ==========================================================================
  describe('getPlanLimit', () => {
    it('a megadott limit értékét adja vissza', () => {
      service.getPlanLimit('alap', 'max_classes').subscribe(limit => {
        expect(limit).toBe(10);
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });

    it('null-t ad korlátlan limitre', () => {
      service.getPlanLimit('studio', 'max_classes').subscribe(limit => {
        expect(limit).toBeNull();
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });

    it('null-t ad nem létező plan ID-ra', () => {
      service.getPlanLimit('nem_letezik', 'max_classes').subscribe(limit => {
        expect(limit).toBeNull();
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });
  });

  // ==========================================================================
  // getFeatureLimitKey
  // ==========================================================================
  describe('getFeatureLimitKey', () => {
    it('helyes limit key-t ad vissza minden feature-re', () => {
      expect(service.getFeatureLimitKey('schools')).toBe('max_schools');
      expect(service.getFeatureLimitKey('contacts')).toBe('max_contacts');
      expect(service.getFeatureLimitKey('projects')).toBe('max_classes');
      expect(service.getFeatureLimitKey('storage')).toBe('storage_gb');
      expect(service.getFeatureLimitKey('templates')).toBe('max_templates');
    });
  });

  // ==========================================================================
  // getUpgradeData
  // ==========================================================================
  describe('getUpgradeData', () => {
    it('helyes upgrade adatokat ad vissza', () => {
      service.getUpgradeData('alap', 'schools').subscribe(data => {
        expect(data.currentPlan).toBeDefined();
        expect(data.currentPlanName).toBe('Alap');
        expect(data.nextPlan).toBeDefined();
        expect(data.nextPlanName).toBe('Iskola');
        expect(data.currentLimit).toBe(20); // alap max_schools
        expect(data.nextLimit).toBeNull(); // iskola max_schools = null (korlátlan)
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });

    it('nextPlan null ha a legmagasabb csomagnál van', () => {
      service.getUpgradeData('vip', 'storage').subscribe(data => {
        expect(data.nextPlan).toBeNull();
        expect(data.nextPlanName).toBe('Következő');
        expect(data.nextLimit).toBeNull();
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });

    it('currentPlan null ha ismeretlen plan ID', () => {
      service.getUpgradeData('nem_letezik', 'projects').subscribe(data => {
        expect(data.currentPlan).toBeNull();
        expect(data.currentPlanName).toBe('nem_letezik');
        expect(data.currentLimit).toBeNull();
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });
  });

  // ==========================================================================
  // getPlanFilterOptions
  // ==========================================================================
  describe('getPlanFilterOptions', () => {
    it('tartalmazza az "Összes csomag" opciót az elején', () => {
      service.getPlanFilterOptions().subscribe(options => {
        expect(options[0]).toEqual({ value: '', label: 'Összes csomag' });
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });

    it('tartalmazza az összes csomagot a PLAN_ORDER szerint', () => {
      service.getPlanFilterOptions().subscribe(options => {
        expect(options.length).toBe(5); // Összes + 4 csomag
        expect(options[1].value).toBe('alap');
        expect(options[1].label).toBe('Alap');
        expect(options[2].value).toBe('iskola');
        expect(options[3].value).toBe('studio');
        expect(options[4].value).toBe('vip');
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });
  });

  // ==========================================================================
  // getPlanSelectOptions
  // ==========================================================================
  describe('getPlanSelectOptions', () => {
    it('NEM tartalmazza az "Összes" opciót', () => {
      service.getPlanSelectOptions().subscribe(options => {
        expect(options[0].value).not.toBe('');
        expect(options.find(o => o.label === 'Összes csomag')).toBeUndefined();
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });

    it('tartalmazza az összes csomagot', () => {
      service.getPlanSelectOptions().subscribe(options => {
        expect(options.length).toBe(4);
        expect(options.map(o => o.value)).toEqual(['alap', 'iskola', 'studio', 'vip']);
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });

    it('rövid neveket használ (TablóStúdió prefix nélkül)', () => {
      service.getPlanSelectOptions().subscribe(options => {
        options.forEach(o => {
          expect(o.label).not.toContain('TablóStúdió');
        });
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });
  });

  // ==========================================================================
  // getPlanName
  // ==========================================================================
  describe('getPlanName', () => {
    it('rövid nevet ad vissza (TablóStúdió prefix nélkül)', () => {
      service.getPlanName('alap').subscribe(name => {
        expect(name).toBe('Alap');
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });

    it('a plan ID-t adja vissza ha nem létező csomag', () => {
      service.getPlanName('nem_letezik').subscribe(name => {
        expect(name).toBe('nem_letezik');
      });

      httpMock.expectOne('/api/plans').flush(mockPlansResponse);
    });
  });

  // ==========================================================================
  // clearCache
  // ==========================================================================
  describe('clearCache', () => {
    it('töröl a cache-ből', () => {
      // Feltöltjük a cache-t
      service.getPlans().subscribe();
      httpMock.expectOne('/api/plans').flush(mockPlansResponse);

      // Cache törlés
      service.clearCache();

      // Következő hívás újra HTTP kérést indít
      service.getPlans().subscribe();
      const req = httpMock.expectOne('/api/plans');
      expect(req.request.method).toBe('GET');
      req.flush(mockPlansResponse);
    });
  });
});
