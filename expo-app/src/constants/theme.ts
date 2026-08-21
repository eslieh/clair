/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#121212',
    background: '#f5f5f4',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    accent: '#208AEF',
    danger: '#EF4444',
    success: '#22C55E',
    border: 'rgba(10, 10, 10, 0.08)',
  },
  dark: {
    text: '#ededed',
    background: '#0a0a0a',
    backgroundElement: '#1a1a1c',
    backgroundSelected: '#26262a',
    textSecondary: '#a1a1aa',
    accent: '#208AEF',
    danger: '#EF4444',
    success: '#22C55E',
    border: 'rgba(255, 255, 255, 0.1)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Matches the web app's default font (Figtree, see web/src/app/layout.js).
// Loaded via @expo-google-fonts/figtree in the root layout.
export const Fonts = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semiBold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
