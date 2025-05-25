import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import THEME, { COLORS, FONTS, SIZES } from '@/utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  // 根据variant确定背景色和文字颜色
  const getVariantStyles = (): {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    textColor: string;
  } => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: COLORS.primary,
          borderColor: COLORS.primary,
          borderWidth: 0,
          textColor: COLORS.white,
        };
      case 'secondary':
        return {
          backgroundColor: COLORS.primaryLight,
          borderColor: COLORS.primaryLight,
          borderWidth: 0,
          textColor: COLORS.primary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: COLORS.primary,
          borderWidth: 1,
          textColor: COLORS.primary,
        };
      case 'danger':
        return {
          backgroundColor: COLORS.error,
          borderColor: COLORS.error,
          borderWidth: 0,
          textColor: COLORS.white,
        };
      default:
        return {
          backgroundColor: COLORS.primary,
          borderColor: COLORS.primary,
          borderWidth: 0,
          textColor: COLORS.white,
        };
    }
  };

  // 根据size确定padding和字体大小
  const getSizeStyles = (): {
    paddingVertical: number;
    paddingHorizontal: number;
    fontSize: number;
  } => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 12,
          fontSize: SIZES.fontSmall,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 24,
          fontSize: SIZES.fontLarge,
        };
      default: // medium
        return {
          paddingVertical: 12,
          paddingHorizontal: 20,
          fontSize: SIZES.fontBase,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: disabled
            ? COLORS.buttonDisabled
            : variantStyles.backgroundColor,
          borderColor: disabled
            ? COLORS.buttonDisabled
            : variantStyles.borderColor,
          borderWidth: variantStyles.borderWidth,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          opacity: disabled ? 0.7 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.contentContainer}>
        {leftIcon && !loading && (
          <View style={styles.iconLeft}>{leftIcon}</View>
        )}

        {loading ? (
          <ActivityIndicator
            size={size === 'small' ? 'small' : 'small'}
            color={variantStyles.textColor}
          />
        ) : (
          <Text
            style={[
              styles.text,
              {
                color: disabled ? COLORS.textTertiary : variantStyles.textColor,
                fontSize: sizeStyles.fontSize,
                marginLeft: leftIcon ? 8 : 0,
                marginRight: rightIcon ? 8 : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}

        {rightIcon && !loading && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: SIZES.radiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...SIZES.shadowSmall,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: FONTS.weight.semiBold,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
});

export default Button;
