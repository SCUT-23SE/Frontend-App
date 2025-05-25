import { Dimensions, TextStyle } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // 主色调
  primary: '#007AFF', // 蓝色主色调
  primaryLight: '#E3F2FD',
  primaryDark: '#0055B3',

  // 辅助色/状态色
  success: '#34C759', // 绿色，成功/完成状态
  warning: '#FF9500', // 橙色，警告/待处理状态
  error: '#FF3B30', // 红色，错误/紧急状态
  info: '#5AC8FA', // 浅蓝色，信息状态

  // 中性色
  white: '#FFFFFF',
  background: '#F2F6FF', // 页面背景色，非常浅的蓝灰色
  card: '#FFFFFF', // 卡片背景色
  divider: '#E9ECF2', // 分割线颜色

  // 文字颜色
  textPrimary: '#222222', // 主要文字
  textSecondary: '#6E7882', // 次要文字
  textTertiary: '#A1A8B0', // 辅助文字
  textLight: '#FFFFFF', // 浅色文字（用于深色背景）

  // 交互元素
  buttonPrimary: '#007AFF',
  buttonSecondary: '#E9ECF2',
  buttonDisabled: '#CCCCCC',
};

export const SIZES = {
  // 基础尺寸
  base: 8,

  // 内边距
  paddingSmall: 8,
  paddingMedium: 16,
  paddingLarge: 24,

  // 外边距
  marginSmall: 8,
  marginMedium: 16,
  marginLarge: 24,

  // 圆角
  radiusSmall: 8,
  radiusMedium: 12,
  radiusLarge: 16,
  radiusPill: 24,

  // 阴影
  shadowSmall: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  shadowMedium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  shadowLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },

  // 文字大小
  fontTiny: 10,
  fontSmall: 12,
  fontMedium: 14,
  fontBase: 16,
  fontLarge: 18,
  fontXLarge: 22,
  fontXXLarge: 28,

  // 屏幕尺寸
  width,
  height,
};

export const FONTS: {
  weight: {
    regular: string;
    medium: string;
    semiBold: string;
    bold: string;
  };
  heading1: TextStyle;
  heading2: TextStyle;
  heading3: TextStyle;
  body: TextStyle;
  bodyBold: TextStyle;
  caption: TextStyle;
  small: TextStyle;
} = {
  weight: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },

  // 定义不同层级标题和文本的组合样式
  heading1: {
    fontSize: SIZES.fontXXLarge,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  heading2: {
    fontSize: SIZES.fontXLarge,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  heading3: {
    fontSize: SIZES.fontLarge,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  body: {
    fontSize: SIZES.fontBase,
    fontWeight: '400',
    color: COLORS.textPrimary,
  },
  bodyBold: {
    fontSize: SIZES.fontBase,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  caption: {
    fontSize: SIZES.fontMedium,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  small: {
    fontSize: SIZES.fontSmall,
    fontWeight: '400',
    color: COLORS.textTertiary,
  },
};

// 组件样式
export const COMPONENT_STYLES = {
  // 卡片样式
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusMedium,
    padding: SIZES.paddingMedium,
    ...SIZES.shadowMedium,
  },

  // 按钮样式
  buttonPrimary: {
    backgroundColor: COLORS.buttonPrimary,
    borderRadius: SIZES.radiusMedium,
    paddingVertical: SIZES.paddingMedium,
    paddingHorizontal: SIZES.paddingLarge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: COLORS.buttonSecondary,
    borderRadius: SIZES.radiusMedium,
    paddingVertical: SIZES.paddingMedium,
    paddingHorizontal: SIZES.paddingLarge,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 标签样式
  badge: {
    paddingHorizontal: SIZES.paddingMedium,
    paddingVertical: 6,
    borderRadius: SIZES.radiusPill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 列表项样式
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.paddingMedium,
    paddingHorizontal: SIZES.paddingMedium,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    marginBottom: SIZES.marginMedium,
    ...SIZES.shadowSmall,
  },

  // 图标容器样式
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
  },
};

// 导出主题
const THEME = {
  COLORS,
  SIZES,
  FONTS,
  COMPONENT_STYLES,
};

export default THEME;
