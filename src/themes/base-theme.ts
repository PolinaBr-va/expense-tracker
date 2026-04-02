import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const BaseTheme = definePreset(Aura, {
  borderRadius: {
    sm: '8px',
    md: '14px',
    lg: '20px',
  },
});
