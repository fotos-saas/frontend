import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SelectionGridComponent } from './selection-grid.component';
import { LoadMoreButtonComponent } from '../../../../shared/components/load-more-button';
import { WorkflowPhoto } from '../../models/workflow.models';
import {
  generateStressTestPhotos,
  FrameTimeMonitor,
  getMemoryMetrics,
  formatPerformanceReport,
  PerformanceReport,
} from '../../../../shared/utils/performance-monitor.util';

/**
 * US-009 - Teljesítmény validálás és stress teszt
 *
 * Stress test stories a SelectionGrid komponenshez
 * Teszteli: 100, 500, 1000 képpel a teljesítményt
 */

// Photo generators for different test sizes
const photos100 = generateStressTestPhotos(100);
const photos500 = generateStressTestPhotos(500);
const photos1000 = generateStressTestPhotos(1000);

const meta: Meta<SelectionGridComponent> = {
  title: 'PhotoSelection/StressTests',
  component: SelectionGridComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ScrollingModule, LoadMoreButtonComponent],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `
# US-009 - Performance Stress Tests

Ez a story gyűjtemény a SelectionGrid komponens teljesítményét teszteli különböző
képmennyiségekkel. A tesztek a következő kritériumokat vizsgálják:

## Acceptance Criteria
- ✅ 100 képpel: smooth működés
- ✅ 500 képpel: smooth működés
- ✅ 1000 képpel: elfogadható működés
- ✅ Nincs 50ms+ frame (Chrome DevTools Performance tab)
- ✅ Nincs memory leak görgetéskor
- ✅ Safari-n tesztelve minden szcenárió

## Használat
1. Nyisd meg a DevTools Performance tab-ot
2. Indíts egy recording-ot
3. Görgess fel-le a listában
4. Ellenőrizd a frame rate-et és memory használatot

## Várt eredmények
- 100 kép: 60fps, <16ms frame time
- 500 kép: 60fps, <16ms frame time
- 1000 kép: 30+fps, <33ms frame time
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<SelectionGridComponent>;

/**
 * 100 Images - Virtual Scroll
 *
 * Tesztelési lépések:
 * 1. DevTools → Performance → Record
 * 2. Görgess végig a listán többször
 * 3. Ellenőrizd: Max frame time < 50ms
 */
export const Stress100VirtualScroll: Story = {
  name: '🧪 100 kép - Virtual Scroll',
  args: {
    photos: photos100,
    selectedIds: [],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: true,
    readonly: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
### 100 kép Virtual Scroll módban

**Várt eredmény:**
- 60fps smooth görgetés
- Max frame time: <16ms
- Memory stabil

**Tesztelés:**
\`\`\`
1. F12 → Performance tab → Start recording
2. Görgess fel-le 5x
3. Stop recording
4. Ellenőrizd: nincs piros frame (>50ms)
\`\`\`
        `,
      },
    },
  },
};

/**
 * 100 Images - Pagination
 */
export const Stress100Pagination: Story = {
  name: '🧪 100 kép - Pagination',
  args: {
    photos: photos100.slice(0, 50),
    selectedIds: [],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: false,
    pageSize: 50,
    totalPhotosCount: 100,
    readonly: false,
  },
  parameters: {
    docs: {
      description: {
        story: '100 kép pagination módban, 50-es page size-zal.',
      },
    },
  },
};

/**
 * 500 Images - Virtual Scroll
 */
export const Stress500VirtualScroll: Story = {
  name: '🧪 500 kép - Virtual Scroll',
  args: {
    photos: photos500,
    selectedIds: [],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: true,
    readonly: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
### 500 kép Virtual Scroll módban

**Várt eredmény:**
- 60fps smooth görgetés
- Max frame time: <16ms
- Virtual scroll hatékonyan renderel

**Kritikus ellenőrzés:**
- DOM node count stabil marad görgetés közben
- Memory nem növekszik folyamatosan
        `,
      },
    },
  },
};

/**
 * 500 Images - Pagination
 */
export const Stress500Pagination: Story = {
  name: '🧪 500 kép - Pagination',
  args: {
    photos: photos500.slice(0, 100),
    selectedIds: [],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: false,
    pageSize: 100,
    totalPhotosCount: 500,
    readonly: false,
  },
  parameters: {
    docs: {
      description: {
        story: '500 kép pagination módban, 100-as page size-zal.',
      },
    },
  },
};

/**
 * 1000 Images - Virtual Scroll
 */
export const Stress1000VirtualScroll: Story = {
  name: '🧪 1000 kép - Virtual Scroll',
  args: {
    photos: photos1000,
    selectedIds: [],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: true,
    readonly: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
### 1000 kép Virtual Scroll módban

**Várt eredmény:**
- 30+fps elfogadható görgetés
- Max frame time: <50ms
- Virtual scroll kezel minden elemet

**Acceptance Criteria:**
- Elfogadható működés (nem kell 60fps)
- Nincs 50ms+ frame drop
- Memory leak nincs
        `,
      },
    },
  },
};

/**
 * 1000 Images - Pagination
 */
export const Stress1000Pagination: Story = {
  name: '🧪 1000 kép - Pagination',
  args: {
    photos: photos1000.slice(0, 100),
    selectedIds: [],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: false,
    pageSize: 100,
    totalPhotosCount: 1000,
    readonly: false,
  },
  parameters: {
    docs: {
      description: {
        story: '1000 kép pagination módban, 100-as page size-zal. "Több kép betöltése" gombbal.',
      },
    },
  },
};

/**
 * Selection Stress Test - 1000 kép, 100 kiválasztva
 */
export const StressSelectionState: Story = {
  name: '🧪 Selection State - 100 kiválasztva',
  args: {
    photos: photos1000,
    selectedIds: Array.from({ length: 100 }, (_, i) => i + 1), // 1-100 selected
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: true,
    readonly: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
### 1000 kép, 100 kiválasztott állapottal

Teszteli a selection state kezelését nagy mennyiségű kiválasztással.
A Set-alapú lookup O(1) kell legyen.
        `,
      },
    },
  },
};

/**
 * Rapid Selection Toggle Test
 */
export const StressRapidSelection: Story = {
  name: '🧪 Rapid Selection - Gyors kattintás teszt',
  args: {
    photos: photos500,
    selectedIds: [],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: true,
    readonly: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
### Gyors kattintás stress teszt

**Tesztelési lépések:**
1. Kattints gyorsan sok képre egymás után
2. Shift+click range selection
3. Ellenőrizd: nincs lag, nincs frame drop

**Várt eredmény:**
- Azonnali vizuális feedback
- Nincs debounce a selection UI-on
- Auto-save debounce működik (300ms)
        `,
      },
    },
  },
};

/**
 * Memory Leak Test - Scroll repeatedly
 */
export const StressMemoryLeak: Story = {
  name: '🧪 Memory Leak - Ismételt görgetés',
  args: {
    photos: photos1000,
    selectedIds: [],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: true,
    readonly: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
### Memory Leak teszt

**Tesztelési lépések:**
1. DevTools → Memory tab
2. Take heap snapshot
3. Görgess fel-le 20x
4. Take heap snapshot
5. Compare snapshots

**Várt eredmény:**
- Memory delta: <10MB
- Nincs növekvő trend
- Detached DOM nodes: 0
        `,
      },
    },
  },
};

/**
 * Safari Compatibility Test
 */
export const StressSafariCompat: Story = {
  name: '🧪 Safari - Kompatibilitás',
  args: {
    photos: photos500,
    selectedIds: [1, 50, 100, 200, 300],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: true,
    readonly: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
### Safari Kompatibilitás teszt

**Ellenőrizendő Safari-n:**
1. ✅ Virtual scroll működik
2. ✅ Margin-based gap (nem flexbox gap)
3. ✅ Animációk smoothak
4. ✅ Touch scroll működik
5. ✅ Zoom gesture működik

**Safari DevTools:**
- Develop → Timeline → Start Recording
        `,
      },
    },
  },
};

/**
 * Mobile Performance Test
 */
export const StressMobileView: Story = {
  name: '🧪 Mobile - 3 oszlopos nézet',
  args: {
    photos: photos500,
    selectedIds: [],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: true,
    readonly: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: `
### Mobile nézet stress teszt

**Viewport:** 320px wide (3 oszlop)

**Ellenőrizendő:**
- Touch scroll smooth
- Zoom button látható
- 44px touch target
        `,
      },
    },
  },
};

/**
 * Console-based Performance Test Runner
 *
 * Ez a story egy interaktív tesztet futtat és kiírja az eredményt a console-ra.
 */
export const RunPerformanceTest: Story = {
  name: '🔬 Performance Test Runner',
  args: {
    photos: photos500,
    selectedIds: [],
    allowMultiple: true,
    maxSelection: null,
    isLoading: false,
    useVirtualScroll: true,
    readonly: false,
  },
  play: async ({ canvasElement }) => {
    // Wait for component to render
    await new Promise(resolve => setTimeout(resolve, 1000));

    const viewport = canvasElement.querySelector('cdk-virtual-scroll-viewport');
    if (!viewport) {
      console.error('Virtual scroll viewport not found');
      return;
    }

    console.log('\n🔬 Starting Performance Test...\n'); // keep

    const frameMonitor = new FrameTimeMonitor();
    const memoryStart = getMemoryMetrics();

    // Start monitoring
    frameMonitor.start();

    // Simulate scrolling
    const maxScroll = (viewport as HTMLElement).scrollHeight;
    for (let i = 0; i < 10; i++) {
      (viewport as HTMLElement).scrollTop = (maxScroll / 10) * (i + 1);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Scroll back up
    for (let i = 10; i >= 0; i--) {
      (viewport as HTMLElement).scrollTop = (maxScroll / 10) * i;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Stop monitoring
    const frameMetrics = frameMonitor.stop();
    const memoryEnd = getMemoryMetrics();

    const report: PerformanceReport = {
      testName: '500 Photos Virtual Scroll Test',
      photoCount: 500,
      duration: 2000,
      frameMetrics,
      memoryStart,
      memoryEnd,
      memoryDelta: memoryStart && memoryEnd ? memoryEnd.usedMB - memoryStart.usedMB : null,
      passed:
        frameMetrics.maxFrameTime < 50 && frameMetrics.fps >= 30 && frameMetrics.longFrames === 0,
      issues: [],
    };

    if (frameMetrics.maxFrameTime >= 50) {
      report.issues.push(`Max frame time ${frameMetrics.maxFrameTime}ms exceeds 50ms`);
    }
    if (frameMetrics.fps < 30) {
      report.issues.push(`FPS ${frameMetrics.fps} is below 30`);
    }
    if (frameMetrics.longFrames > 0) {
      report.issues.push(`${frameMetrics.longFrames} long frames detected`);
    }

    console.log(formatPerformanceReport(report)); // keep
  },
  parameters: {
    docs: {
      description: {
        story: `
### Automatikus Performance Teszt

Ez a story automatikusan futtat egy performance tesztet és kiírja az eredményt a browser console-ra.

**Használat:**
1. Nyisd meg ezt a story-t
2. Nyisd meg a DevTools Console-t (F12)
3. Nézd meg az eredményt

**A teszt:**
- 500 képpel
- Virtual scroll módban
- Fel-le görget 10x
- Méri: frame time, FPS, memory
        `,
      },
    },
  },
};
