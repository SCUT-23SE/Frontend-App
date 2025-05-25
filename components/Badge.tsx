import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import THEME, { COLORS, FONTS, SIZES } from '@/utils/theme';

interface BadgeProps {
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  size = 'medium',
  style,
  textStyle,
  icon,
}) => {
  // 根据variant确定背景色和文字颜色
  const getVariantStyles = (): {
    backgroundColor: string;
    textColor: string;
  } => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: COLORS.success,
          textColor: COLORS.white,
        };
      case 'warning':
        return {
          backgroundColor: COLORS.warning,
          textColor: COLORS.white,
        };
      case 'error':
        return {
          backgroundColor: COLORS.error,
          textColor: COLORS.white,
        };
      case 'info':
        return {
          backgroundColor: COLORS.info,
          textColor: COLORS.white,
        };
      default:
        return {
          backgroundColor: COLORS.primary,
          textColor: COLORS.white,
        };
    }
  };

  // 根据size确定内边距和字体大小
  const getSizeStyles = (): {
    paddingVertical: number;
    paddingHorizontal: number;
    fontSize: number;
  } => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 2,
          paddingHorizontal: 8,
          fontSize: SIZES.fontTiny,
        };
      default: // medium
        return {
          paddingVertical: 4,
          paddingHorizontal: 12,
          fontSize: SIZES.fontSmall,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyles.backgroundColor,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}

      <Text
        style={[
          styles.text,
          {
            color: variantStyles.textColor,
            fontSize: sizeStyles.fontSize,
          },
          textStyle,
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: SIZES.radiusPill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start', // 默认宽度由内容决定
  },
  text: {
    fontWeight: FONTS.weight.medium,
  },
  icon: {
    marginRight: 4,
  },
});

export default Badge;
