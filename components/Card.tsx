import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import THEME, { COLORS, SIZES } from '@/utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: 'small' | 'medium' | 'large';
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 'medium',
  noPadding = false,
}) => {
  // 根据传入的elevation参数选择阴影程度
  const getShadowStyle = () => {
    switch (elevation) {
      case 'small':
        return SIZES.shadowSmall;
      case 'large':
        return SIZES.shadowLarge;
      default: // medium
        return SIZES.shadowMedium;
    }
  };

  return (
    <View
      style={[
        styles.card,
        getShadowStyle(),
        noPadding ? { padding: 0 } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    padding: SIZES.paddingMedium,
    marginBottom: SIZES.marginMedium,
  },
});

export default Card;
