import { definePreset } from '@primeuix/themes';
import { BaseTheme } from './base-theme';

export const LightTheme = definePreset(BaseTheme, {
  semantic: {
    primary: {
      50: '#ffffff',
      100: '#bfc9d3',
      200: '#b7cbc3',
      300: '#9ca7e4',
      400: '#7781b0',
      500: '#78a9d7',
      600: '#548cc1',
      700: '#3f576d',
      800: '#28445f',
      900: '#8796a5',
    },
    // text: {
    //   muted: {
    //     color: '#6b7280',
    //   },
    // },
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
  css: (options) => `
    :root {
      --heading-color: #78a9d7;
      --filtered-color: #4b5563;
      --filtered-hover-color: #324660;
      --filtered-not-color: #4b5563;
    }
  `,
});
