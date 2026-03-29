import { BrowserWindow, TouchBar } from 'electron';
import log from 'electron-log/main';

const { TouchBarButton, TouchBarLabel, TouchBarSpacer, TouchBarSegmentedControl, TouchBarSlider } = TouchBar;

// ============ Touch Bar Types ============

export type TouchBarItemType = 'button' | 'label' | 'spacer' | 'segmented' | 'slider';

interface TouchBarItemBase {
  type: TouchBarItemType;
  id?: string;
}

interface TouchBarButtonItem extends TouchBarItemBase {
  type: 'button';
  label?: string;
  backgroundColor?: string;
}

interface TouchBarLabelItem extends TouchBarItemBase {
  type: 'label';
  label: string;
  textColor?: string;
}

interface TouchBarSpacerItem extends TouchBarItemBase {
  type: 'spacer';
  size?: 'small' | 'large' | 'flexible';
}

interface TouchBarSegmentedItem extends TouchBarItemBase {
  type: 'segmented';
  segments: Array<{ label?: string }>;
  selectedIndex?: number;
  mode?: 'single' | 'multiple' | 'buttons';
}

interface TouchBarSliderItem extends TouchBarItemBase {
  type: 'slider';
  minValue?: number;
  maxValue?: number;
  value?: number;
  label?: string;
}

export type TouchBarItem = TouchBarButtonItem | TouchBarLabelItem | TouchBarSpacerItem | TouchBarSegmentedItem | TouchBarSliderItem;

// ============ Touch Bar Factories ============

export function createDefaultTouchBar(mainWindow: BrowserWindow | null): TouchBar {
  return new TouchBar({
    items: [
      new TouchBarButton({
        label: 'Uj projekt',
        backgroundColor: '#6366f1',
        click: () => mainWindow?.webContents.send('touch-bar-action', 'new-project'),
      }),
      new TouchBarButton({
        label: 'Megrendelesek',
        click: () => mainWindow?.webContents.send('touch-bar-action', 'orders'),
      }),
      new TouchBarButton({
        label: 'Statisztikak',
        click: () => mainWindow?.webContents.send('touch-bar-action', 'stats'),
      }),
      new TouchBarSpacer({ size: 'flexible' }),
      new TouchBarButton({
        label: 'Frissites',
        click: () => mainWindow?.webContents.send('touch-bar-action', 'refresh'),
      }),
    ],
  });
}

export function createGalleryTouchBar(mainWindow: BrowserWindow | null): TouchBar {
  return new TouchBar({
    items: [
      new TouchBarButton({ label: 'Elozo', click: () => mainWindow?.webContents.send('touch-bar-action', 'gallery-prev') }),
      new TouchBarButton({ label: 'Kovetkezo', click: () => mainWindow?.webContents.send('touch-bar-action', 'gallery-next') }),
      new TouchBarSpacer({ size: 'small' }),
      new TouchBarSlider({
        label: 'Zoom',
        minValue: 50,
        maxValue: 200,
        value: 100,
        change: (v) => mainWindow?.webContents.send('touch-bar-action', 'gallery-zoom', { value: v }),
      }),
      new TouchBarSpacer({ size: 'flexible' }),
      new TouchBarButton({ label: 'Kivalasztas', backgroundColor: '#22c55e', click: () => mainWindow?.webContents.send('touch-bar-action', 'gallery-select') }),
    ],
  });
}

export function createEditorTouchBar(mainWindow: BrowserWindow | null): TouchBar {
  return new TouchBar({
    items: [
      new TouchBarButton({ label: 'Mentes', backgroundColor: '#6366f1', click: () => mainWindow?.webContents.send('touch-bar-action', 'editor-save') }),
      new TouchBarSpacer({ size: 'small' }),
      new TouchBarButton({ label: 'Visszavonas', click: () => mainWindow?.webContents.send('touch-bar-action', 'editor-undo') }),
      new TouchBarButton({ label: 'Ujra', click: () => mainWindow?.webContents.send('touch-bar-action', 'editor-redo') }),
      new TouchBarSpacer({ size: 'flexible' }),
      new TouchBarButton({ label: 'Elonezet', click: () => mainWindow?.webContents.send('touch-bar-action', 'editor-preview') }),
    ],
  });
}

export function createDynamicTouchBar(items: TouchBarItem[], mainWindow: BrowserWindow | null): TouchBar {
  const touchBarItems = items.map((item) => {
    switch (item.type) {
      case 'button':
        return new TouchBarButton({ label: item.label, backgroundColor: item.backgroundColor, click: () => item.id && mainWindow?.webContents.send('touch-bar-action', item.id) });
      case 'label':
        return new TouchBarLabel({ label: item.label, textColor: item.textColor });
      case 'spacer':
        return new TouchBarSpacer({ size: item.size || 'small' });
      case 'segmented':
        return new TouchBarSegmentedControl({ segments: item.segments.map(s => ({ label: s.label })), selectedIndex: item.selectedIndex, mode: item.mode || 'single', change: (idx) => item.id && mainWindow?.webContents.send('touch-bar-action', item.id, { selectedIndex: idx }) });
      case 'slider':
        return new TouchBarSlider({ label: item.label, minValue: item.minValue ?? 0, maxValue: item.maxValue ?? 100, value: item.value ?? 50, change: (v) => item.id && mainWindow?.webContents.send('touch-bar-action', item.id, { value: v }) });
      default:
        return new TouchBarSpacer({ size: 'small' });
    }
  });
  return new TouchBar({ items: touchBarItems });
}

export function setTouchBarContext(context: string, mainWindow: BrowserWindow | null): void {
  if (process.platform !== 'darwin' || !mainWindow) return;
  let touchBar: TouchBar;
  switch (context) {
    case 'gallery': touchBar = createGalleryTouchBar(mainWindow); break;
    case 'editor': touchBar = createEditorTouchBar(mainWindow); break;
    default: touchBar = createDefaultTouchBar(mainWindow); break;
  }
  mainWindow.setTouchBar(touchBar);
  log.info(`Touch Bar context set to: ${context}`);
}
