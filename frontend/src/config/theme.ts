// theme.ts

// 1. import `extendTheme` function
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// 2. Add your color mode config
const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

// 3. Modern color palette with WCAG AA compliance
const colors = {
  brand: {
    50: '#e6f7ff',
    100: '#bae7ff',
    200: '#91d5ff',
    300: '#69c0ff',
    400: '#40a9ff',
    500: '#1a9fff', // Primary brand color
    600: '#0d8ce6',
    700: '#0066cc',
    800: '#004d99',
    900: '#003366',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  dark: {
    bg: '#0a1629',
    surface: '#0f1b2e',
    surfaceHover: '#1a2742',
    text: '#f0f4f8',
    textSecondary: '#cbd5e0',
  },
  light: {
    bg: '#ffffff',
    surface: '#f7fafc',
    surfaceHover: '#edf2f7',
    text: '#1a202c',
    textSecondary: '#4a5568',
  },
};

// 4. Custom components styles
const components = {
  Button: {
    baseStyle: {
      fontWeight: '600',
      borderRadius: 'lg',
      _focus: {
        boxShadow: '0 0 0 3px rgba(26, 159, 255, 0.3)',
      },
    },
    sizes: {
      md: {
        minH: '44px', // Touch-friendly size
        px: 6,
      },
    },
  },
  Input: {
    baseStyle: {
      field: {
        _focus: {
          borderColor: 'brand.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
        },
      },
    },
  },
  Avatar: {
    baseStyle: {
      border: '2px solid',
      borderColor: 'transparent',
    },
  },
};

// 5. Global styles
const styles = {
  global: (props: { colorMode: string }) => ({
    body: {
      bg: props.colorMode === 'dark' ? colors.dark.bg : colors.light.bg,
      color: props.colorMode === 'dark' ? colors.dark.text : colors.light.text,
      transition: 'background-color 0.2s, color 0.2s',
    },
    '*::placeholder': {
      color: props.colorMode === 'dark' ? colors.dark.textSecondary : colors.light.textSecondary,
    },
    '*, *::before, &::after': {
      borderColor: props.colorMode === 'dark' ? colors.gray[700] : colors.gray[200],
    },
  }),
};

// 6. Extend the theme
const theme = extendTheme({
  config,
  colors,
  components,
  styles,
  fonts: {
    heading: "'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  shadows: {
    outline: '0 0 0 3px rgba(26, 159, 255, 0.3)',
  },
});

export default theme;
