import React from 'react';
import { View } from 'react-native';

// Простая безопасная заглушка: вместо градиента — ровный фон.
// НИКОГДА не падает, даже если colors = undefined.
type AnyProps = { [k: string]: any };

export const LinearGradient: React.FC<AnyProps> = ({ colors, style, children, ...rest }) => {
  const bg = Array.isArray(colors) && colors.length > 0 && typeof colors[0] === 'string'
    ? colors[0]
    : '#0f172a';
  return (
    <View style={[style, { backgroundColor: bg }]} {...rest}>
      {children}
    </View>
  );
};

export default LinearGradient;
