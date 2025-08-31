import React from 'react';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

function normalizeColors(colors?: any): string[] {
  return Array.isArray(colors) && colors.length > 0 && colors.every((c) => typeof c === 'string')
    ? colors
    : ['#0f172a', '#111827'];
}

/** Совместимо и с named, и с default импортом */
export const LinearGradient = (props: React.ComponentProps<typeof ExpoLinearGradient>) => {
  const { colors, ...rest } = props;
  return <ExpoLinearGradient {...rest} colors={normalizeColors(colors)} />;
};

export default LinearGradient;
