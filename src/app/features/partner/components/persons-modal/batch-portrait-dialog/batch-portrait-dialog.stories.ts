import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { Component, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { BatchPortraitDialogComponent } from './batch-portrait-dialog.component';
import { BatchPortraitActionsService } from './batch-portrait-actions.service';
import { TabloPersonItem } from '../persons-modal.types';

const MOCK_PERSONS: TabloPersonItem[] = [
  { id: 1, name: 'Kiss Anna', type: 'student', hasPhoto: true, email: null, photoThumbUrl: 'https://placehold.co/100', photoUrl: 'https://placehold.co/400', archiveId: 1, hasOverride: false, title: null, photoType: null, note: null },
  { id: 2, name: 'Nagy Béla', type: 'student', hasPhoto: true, email: null, photoThumbUrl: 'https://placehold.co/100', photoUrl: 'https://placehold.co/400', archiveId: 2, hasOverride: false, title: null, photoType: null, note: null },
  { id: 3, name: 'Tóth Csilla', type: 'student', hasPhoto: true, email: null, photoThumbUrl: 'https://placehold.co/100', photoUrl: 'https://placehold.co/400', archiveId: 3, hasOverride: false, title: null, photoType: null, note: null },
];

const meta: Meta<BatchPortraitDialogComponent> = {
  title: 'Partner/PersonsModal/BatchPortraitDialog',
  component: BatchPortraitDialogComponent,
  decorators: [
    moduleMetadata({
      imports: [LucideAngularModule],
      providers: [BatchPortraitActionsService],
    }),
  ],
  argTypes: {
    close: { action: 'close' },
    completed: { action: 'completed' },
  },
};

export default meta;
type Story = StoryObj<BatchPortraitDialogComponent>;

export const Default: Story = {
  args: {
    persons: MOCK_PERSONS,
    projectId: 1,
  },
};

/**
 * A feldolgozás befejezése utáni állapot szimulálása
 * nem lehetséges közvetlenül story-ban mivel async flow-t futtat
 */
export const WithThreePersons: Story = {
  args: {
    persons: MOCK_PERSONS,
    projectId: 1,
  },
};

export const SinglePerson: Story = {
  args: {
    persons: [MOCK_PERSONS[0]],
    projectId: 1,
  },
};
