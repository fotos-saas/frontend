import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { LucideAngularModule, ArrowLeft as LucideArrowLeft, ArrowRight as LucideArrowRight, X } from 'lucide-angular';
import { GuidedTourTooltipComponent } from './guided-tour-tooltip.component';

const meta: Meta<GuidedTourTooltipComponent> = {
  title: 'Shared/UI/GuidedTourTooltip',
  component: GuidedTourTooltipComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        GuidedTourTooltipComponent,
        LucideAngularModule.pick({ ArrowLeft: LucideArrowLeft, ArrowRight: LucideArrowRight, X }),
      ],
    }),
  ],
  argTypes: {
    isFirstStep: {
      control: 'boolean',
      description: 'Első lépés-e',
    },
    isLastStep: {
      control: 'boolean',
      description: 'Utolsó lépés-e',
    },
    stepCounter: {
      control: 'text',
      description: 'Lépés számláló szöveg',
    },
    arrowPosition: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right', 'none'],
      description: 'Nyíl pozíciója',
    },
    progressPercent: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Haladás százalékban',
    },
  },
};

export default meta;
type Story = StoryObj<GuidedTourTooltipComponent>;

/** Első lépés */
export const Default: Story = {
  args: {
    step: {
      title: 'Üdvözöllek!',
      description: 'Ez egy rövid bemutató az oldal funkcióiról. Kattints a Következő gombra a folytatáshoz.',
    },
    isFirstStep: true,
    isLastStep: false,
    stepCounter: '1/5',
    arrowPosition: 'none',
    progressPercent: 20,
  },
};

/** Középső lépés */
export const MiddleStep: Story = {
  args: {
    step: {
      title: 'Projektek kezelése',
      description: 'Itt kezelheted a projektjeidet. Kattints az "Új projekt" gombra egy új projekt létrehozásához.',
    },
    isFirstStep: false,
    isLastStep: false,
    stepCounter: '3/5',
    arrowPosition: 'top',
    progressPercent: 60,
  },
};

/** Utolsó lépés */
export const LastStep: Story = {
  args: {
    step: {
      title: 'Készen állsz!',
      description: 'Most már ismered az alapokat. Kezdj el dolgozni a projektjeiden!',
    },
    isFirstStep: false,
    isLastStep: true,
    stepCounter: '5/5',
    arrowPosition: 'bottom',
    progressPercent: 100,
  },
};

/** Nyíl balra */
export const ArrowLeftStory: Story = {
  name: 'Nyíl balra',
  args: {
    step: {
      title: 'Oldalsáv',
      description: 'Az oldalsáv segítségével gyorsan elérheted a legfontosabb funkciókat.',
    },
    isFirstStep: false,
    isLastStep: false,
    stepCounter: '2/4',
    arrowPosition: 'left',
    progressPercent: 50,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    step: {
      title: 'Sötét mód',
      description: 'A tooltip sötét háttéren is jól látszik.',
    },
    isFirstStep: true,
    isLastStep: false,
    stepCounter: '1/3',
    arrowPosition: 'none',
    progressPercent: 33,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
