import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'small' | 'smallBold' | 'link' | 'linkPrimary';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'subtitle' && styles.subtitle,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    lineHeight: 26,
  },
  small: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  linkPrimary: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: '#208AEF',
  },
});
