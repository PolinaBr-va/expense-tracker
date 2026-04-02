import { definePreset } from '@primeuix/themes';
import { BaseTheme } from './base-theme';

export const DarkTheme = definePreset(BaseTheme, {
  semantic: {
    primary: {
      50: '#324660',
      100: '#374151',
      200: '#4b5563',
      300: '#7781b0',
      400: '#9ca3af',
      500: '#f9f3b6',
      600: '#c5d1e5',
      700: '#2563eb',
      800: '#1d4ed8',
      900: '#648e7b',
    },
    text: {
      muted: {
        color: '#fff',
      },
    },
    chart: {
      paletteBase: [
        '{primary.100}',
        '{primary.200}',
        '{primary.300}',
        '{primary.400}',
        '{primary.500}',
        '{primary.600}',
        '{primary.700}',
        '{primary.800}',
        '{primary.900}',
      ],
    },
  },

  colorScheme: {
    dark: true,
  },
  css: (options) => `
    :root {
      --p-text-muted-color: #fff;
      --heading-color: #fff;
      --filtered-color: #4b5563;
      --filtered-hover-color: #324660;
      --filtered-not-color: #4b5563;
      --p-form-field-focus-border-color: '#7781b0';
      --p-form-field-hover-border-color: '#fff';
      --p-select-border-color: '#fff';
    }
  `,
});
