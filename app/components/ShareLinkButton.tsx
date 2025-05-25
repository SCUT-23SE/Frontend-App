import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Share,
  Platform,
  ViewStyle,
  TextStyle,
  Alert,
  Clipboard,
  View,
} from 'react-native';
import { Share as ShareIcon, Copy } from 'lucide-react-native';
import { generateDeepLinks } from '../utils/linking';

// 样式常量
const PRIMARY_BLUE = '#007AFF';
const CARD_BACKGROUND = '#FFFFFF';
const SECONDARY_TEXT_COLOR = '#8A8A8E';
const PADDING_S = 8;
const PADDING_M = 12;
const FONT_SIZE_M = 14;
const FONT_WEIGHT_MEDIUM = '500';

interface ShareLinkButtonProps {
  /**
   * 分享类型
   */
  type: 'task' | 'group';

  /**
   * 任务ID或组织ID
   */
  id: string | number;

  /**
   * 分享标题
   */
  title?: string;

  /**
   * 分享消息
   */
  message?: string;

  /**
   * 按钮样式
   */
  style?: ViewStyle;

  /**
   * 显示图标
   */
  showIcon?: boolean;

  /**
   * 按钮文字
   */
  label?: string;

  /**
   * 按钮类型：分享或复制
   */
  mode?: 'share' | 'copy' | 'both';
}

/**
 * 分享链接按钮组件
 */
const ShareLinkButton: React.FC<ShareLinkButtonProps> = ({
  type,
  id,
  title = '',
  message = '',
  style,
  showIcon = true,
  label = '分享链接',
  mode = 'share',
}) => {
  const [copied, setCopied] = useState(false);

  // 生成链接
  const generateLink = () => {
    if (type === 'task') {
      return generateDeepLinks.taskDetail(id);
    } else if (type === 'group') {
      return generateDeepLinks.joinGroup(id);
    }
    return '';
  };

  // 获取默认标题
  const getDefaultTitle = () => {
    return type === 'task' ? '查看签到任务详情' : '加入用户组';
  };

  // 获取默认消息
  const getDefaultMessage = () => {
    return type === 'task'
      ? '通过此链接查看签到任务详情，点击打开TeamTick应用'
      : '通过此链接申请加入用户组，点击打开TeamTick应用';
  };

  // 分享链接
  const handleShare = async () => {
    try {
      const deepLink = generateLink();
      const defaultTitle = getDefaultTitle();
      const defaultMessage = getDefaultMessage();

      const result = await Share.share(
        {
          title: title || defaultTitle,
          message: (message || defaultMessage) + '\n' + deepLink,
          url: Platform.OS === 'ios' ? deepLink : undefined,
        },
        {
          dialogTitle: '分享链接',
        }
      );

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      Alert.alert('分享失败', '无法分享此链接');
      console.error('Share error:', error);
    }
  };

  // 复制链接
  const handleCopy = async () => {
    try {
      const deepLink = generateLink();
      await Clipboard.setString(deepLink);

      // 显示复制成功状态
      setCopied(true);
      Alert.alert('成功', '链接已复制到剪贴板');

      // 1.5秒后重置状态
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      Alert.alert('复制失败', '无法复制链接');
      console.error('Copy error:', error);
    }
  };

  // 根据模式处理点击事件
  const handlePress = () => {
    if (mode === 'share') {
      handleShare();
    } else if (mode === 'copy') {
      handleCopy();
    }
  };

  // 渲染分享和复制按钮
  if (mode === 'both') {
    return (
      <View style={[styles.buttonGroup, style]}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <ShareIcon
            size={16}
            color={SECONDARY_TEXT_COLOR}
            style={styles.icon}
          />
          <Text style={styles.shareText}>分享</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
          <Copy size={16} color={SECONDARY_TEXT_COLOR} style={styles.icon} />
          <Text style={styles.shareText}>复制链接</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 渲染单个按钮
  return (
    <TouchableOpacity style={[styles.shareButton, style]} onPress={handlePress}>
      {showIcon &&
        (mode === 'share' ? (
          <ShareIcon
            size={16}
            color={SECONDARY_TEXT_COLOR}
            style={styles.icon}
          />
        ) : (
          <Copy size={16} color={SECONDARY_TEXT_COLOR} style={styles.icon} />
        ))}
      <Text style={styles.shareText}>{copied ? '已复制' : label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PADDING_M - 2,
    paddingHorizontal: PADDING_M,
    backgroundColor: CARD_BACKGROUND,
    borderRadius: PADDING_S,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  } as ViewStyle,
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PADDING_M - 2,
    paddingHorizontal: PADDING_M,
    backgroundColor: CARD_BACKGROUND,
    borderRadius: PADDING_S,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginLeft: PADDING_S,
  } as ViewStyle,
  shareText: {
    fontSize: FONT_SIZE_M,
    color: SECONDARY_TEXT_COLOR,
    fontWeight: FONT_WEIGHT_MEDIUM,
  } as TextStyle,
  icon: {
    marginRight: PADDING_S,
  } as ViewStyle,
});

export default ShareLinkButton;
