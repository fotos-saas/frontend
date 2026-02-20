/**
 * Modul részletes oldal típusok
 *
 * Marketing tartalom interface-ek a modul detail page-hez.
 */

export interface ModuleBenefit {
  icon: string;
  title: string;
  description: string;
}

export interface ModuleStep {
  step: number;
  title: string;
  description: string;
}

export interface ModuleFeature {
  text: string;
}

export interface ModuleScreenshot {
  src: string | null;
  alt: string;
  caption: string;
}

export interface ModuleUseCase {
  icon: string;
  persona: string;
  description: string;
}

export interface ModuleFaqItem {
  question: string;
  answer: string;
}

export interface ModuleDetailContent {
  moduleKey: string;
  badge: string | null;
  heroGradient: string;
  benefits: ModuleBenefit[];
  steps: ModuleStep[];
  features: ModuleFeature[];
  screenshots: ModuleScreenshot[];
  useCases: ModuleUseCase[];
  faq: ModuleFaqItem[];
  relatedModuleKeys: string[];
}
