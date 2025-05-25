import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import THEME, { COLORS, FONTS, SIZES } from '@/utils/theme';

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  iconContainerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  showChevron = true,
  onPress,
  style,
  titleStyle,
  subtitleStyle,
  iconContainerStyle,
  disabled = false,
}) => {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[styles.container, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {leftIcon && (
        <View style={[styles.iconContainer, iconContainerStyle]}>
          {leftIcon}
        </View>
      )}

      <View style={styles.contentContainer}>
        <Text
          style={[
            styles.title,
            disabled && { color: COLORS.textTertiary },
            titleStyle,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              disabled && { color: COLORS.textTertiary },
              subtitleStyle,
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}

      {showChevron && (
        <ChevronRight
          size={20}
          color={disabled ? COLORS.textTertiary : COLORS.textSecondary}
        />
      )}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.paddingMedium,
    paddingHorizontal: SIZES.paddingMedium,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    marginBottom: SIZES.marginMedium,
    ...SIZES.shadowSmall,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    marginRight: SIZES.marginMedium,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...FONTS.bodyBold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rightIconContainer: {
    marginRight: SIZES.marginSmall,
  },
});

export default ListItem;
