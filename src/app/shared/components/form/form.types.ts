export type PsFieldSize = 'sm' | 'md' | 'lg' | 'full';
export type PsFieldState = 'default' | 'error' | 'success';
export type PsInputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'time' | 'url';

export interface PsSelectOption {
  id: string | number;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  group?: string;
}

export interface PsRadioOption {
  value: string | number;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

export const PS_FIELD_SIZES: Record<PsFieldSize, string> = {
  sm: '240px',
  md: '360px',
  lg: '480px',
  full: '100%',
};

export const PS_FIELD_HEIGHT = '42px';

/** Backward compat alias — régi SearchableSelect SelectOption-je */
export type SelectOption = PsSelectOption;
