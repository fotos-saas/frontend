export type WizardStep = 'albums' | 'upload' | 'choice' | 'review';
export type MatchingMode = 'ai' | 'manual' | null;

export interface StepDefinition {
  id: WizardStep;
  label: string;
}

export const VISIBLE_STEPS: StepDefinition[] = [
  { id: 'upload', label: 'Feltöltés' },
  { id: 'choice', label: 'Párosítás' },
  { id: 'review', label: 'Ellenőrzés' }
];
