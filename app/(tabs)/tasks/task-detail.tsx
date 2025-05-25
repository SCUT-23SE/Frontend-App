import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  MapPin,
  Camera,
  Wifi,
  CircleAlert as AlertCircle,
} from 'lucide-react-native';
import { useTasksStore } from '@/stores/tasks';
import ShareLinkButton from '@/app/components/ShareLinkButton';

// --- Style Constants (copied from index.tsx) ---
const APP_BACKGROUND = '#F8F8FA';
const CARD_BACKGROUND = '#FFFFFF';
const PRIMARY_BLUE = '#007AFF';
const PRIMARY_TEXT_COLOR = '#1C1C1E';
const SECONDARY_TEXT_COLOR = '#8A8A8E';
const LIGHT_GRAY_BORDER = '#E5E5EA';
const ICON_BLUE = PRIMARY_BLUE;

// Badge Colors
const BADGE_SUCCESS_BG = '#E6F7EA';
const BADGE_SUCCESS_TEXT = '#389E0D';
const BADGE_WARNING_BG = '#FFFBE6';
const BADGE_WARNING_TEXT = '#FA8C16';
const BADGE_ERROR_BG = '#FFF1F0';
const BADGE_ERROR_TEXT = '#FF4D4F';
const BADGE_INFO_BG = '#E0F2FF';
const BADGE_INFO_TEXT = PRIMARY_BLUE;
const BADGE_NEUTRAL_BG = '#F0F0F0';
const BADGE_NEUTRAL_TEXT = '#595959';

const CARD_BORDER_RADIUS = 12;
const BADGE_PILL_RADIUS = 16;

const PADDING_XS = 4;
const PADDING_S = 8;
const PADDING_M = 12;
const PADDING_L = 16;
const PADDING_XL = 20;

const MARGIN_S = 8;
const MARGIN_M = 12;
const MARGIN_L = 16;

const FONT_SIZE_S = 12;
const FONT_SIZE_M = 14;
const FONT_SIZE_L = 16;
const FONT_SIZE_XL = 17;

const FONT_WEIGHT_REGULAR = '400';
const FONT_WEIGHT_MEDIUM = '500';
const FONT_WEIGHT_SEMIBOLD = '600';
const FONT_WEIGHT_BOLD = '700';
// --- End Style Constants ---

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentTask, currentTaskLoading, currentTaskError, fetchTaskDetail } =
    useTasksStore();

  useEffect(() => {
    if (id) {
      fetchTaskDetail(id as string);
    }
  }, [id]);

  const getStatusStyleInfo = (status: string) => {
    switch (status) {
      case 'ongoing':
        return {
          badgeBackgroundColor: BADGE_INFO_BG,
          badgeTextColor: BADGE_INFO_TEXT,
        };
      case 'upcoming':
        return {
          badgeBackgroundColor: BADGE_INFO_BG,
          badgeTextColor: BADGE_INFO_TEXT,
        };
      case 'expired':
        return {
          badgeBackgroundColor: BADGE_ERROR_BG,
          badgeTextColor: BADGE_ERROR_TEXT,
        };
      default:
        return {
          badgeBackgroundColor: BADGE_NEUTRAL_BG,
          badgeTextColor: BADGE_NEUTRAL_TEXT,
        };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing':
        return '进行中';
      case 'upcoming':
        return '即将开始';
      case 'expired':
        return '已结束';
      default:
        return '';
    }
  };

  if (currentTaskLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY_BLUE} />
      </View>
    );
  }

  if (currentTaskError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{currentTaskError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchTaskDetail(id as string)}
        >
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentTask) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>任务不存在</Text>
      </View>
    );
  }

  // 确保任务类型字段存在，如果不存在则提供默认值
  const taskType = currentTask.type || {
    gps: false,
    face: false,
    wifi: false,
    nfc: false,
  };
  const { badgeBackgroundColor, badgeTextColor } = getStatusStyleInfo(
    currentTask.status
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContentContainer}
    >
      <View style={styles.headerCard}>
        <Text style={styles.title} numberOfLines={2}>
          {currentTask.title}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: badgeBackgroundColor },
          ]}
        >
          <Text style={[styles.statusText, { color: badgeTextColor }]}>
            {getStatusText(currentTask.status)}
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>基本信息</Text>
        <View style={styles.infoItem}>
          <Text style={styles.label}>所属组织：</Text>
          <Text style={styles.value}>{currentTask.group}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>开始时间：</Text>
          <Text style={styles.value}>
            {new Date(currentTask.startTime).toLocaleString()}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>结束时间：</Text>
          <Text style={styles.value}>
            {new Date(currentTask.endTime).toLocaleString()}
          </Text>
        </View>
        {currentTask.description && (
          <View style={styles.infoItem}>
            <Text style={styles.label}>任务说明：</Text>
            <Text style={styles.value}>{currentTask.description}</Text>
          </View>
        )}

        <View style={styles.shareContainer}>
          <ShareLinkButton
            type="task"
            id={currentTask.id}
            label="分享任务"
            mode="both"
            style={styles.shareButton}
          />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>签到要求</Text>
        <View style={styles.requirementsList}>
          {taskType.gps && (
            <View style={styles.requirementItem}>
              <MapPin
                size={18}
                color={ICON_BLUE}
                style={styles.requirementIcon}
              />
              <Text style={styles.requirementText}>位置签到</Text>
            </View>
          )}
          {taskType.face && (
            <View style={styles.requirementItem}>
              <Camera
                size={18}
                color={ICON_BLUE}
                style={styles.requirementIcon}
              />
              <Text style={styles.requirementText}>人脸识别</Text>
            </View>
          )}
          {taskType.wifi && (
            <View style={styles.requirementItem}>
              <Wifi
                size={18}
                color={ICON_BLUE}
                style={styles.requirementIcon}
              />
              <Text style={styles.requirementText}>WiFi验证</Text>
            </View>
          )}
        </View>
      </View>

      {currentTask.status === 'ongoing' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => router.push(`/tasks/check-in?id=${currentTask.id}`)}
          >
            <Text style={styles.checkInButtonText}>开始签到</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exceptionButton}
            onPress={() => router.push(`/tasks/exception?id=${currentTask.id}`)}
          >
            <AlertCircle size={20} color={SECONDARY_TEXT_COLOR} />
            <Text style={styles.exceptionButtonText}>申请异常</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  } as ViewStyle,
  scrollContentContainer: {
    paddingHorizontal: PADDING_M,
    paddingVertical: PADDING_M, // Add vertical padding for scroll view
  } as ViewStyle,
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: PADDING_L,
    backgroundColor: APP_BACKGROUND,
  } as ViewStyle,
  headerCard: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: CARD_BORDER_RADIUS,
    padding: PADDING_L,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align items to start for multi-line title
    marginBottom: MARGIN_M,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 }, // Softer shadow for header
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  } as ViewStyle,
  title: {
    fontSize: FONT_SIZE_XL,
    fontWeight: FONT_WEIGHT_SEMIBOLD,
    color: PRIMARY_TEXT_COLOR,
    flex: 1, // Allow title to take available space
    marginRight: MARGIN_S, // Space between title and badge
  } as TextStyle,
  statusBadge: {
    paddingHorizontal: PADDING_M,
    paddingVertical: PADDING_XS + 1,
    borderRadius: BADGE_PILL_RADIUS,
    minWidth: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  statusText: {
    fontSize: FONT_SIZE_S,
    fontWeight: FONT_WEIGHT_MEDIUM,
  } as TextStyle,
  sectionCard: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: CARD_BORDER_RADIUS,
    padding: PADDING_L,
    marginBottom: MARGIN_M,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  } as ViewStyle,
  sectionTitle: {
    fontSize: FONT_SIZE_L,
    fontWeight: FONT_WEIGHT_SEMIBOLD,
    color: PRIMARY_TEXT_COLOR,
    marginBottom: PADDING_L, // More space after section title
  } as TextStyle,
  infoItem: {
    marginBottom: PADDING_M, // Consistent margin for info items
    flexDirection: 'row', // Align label and value in a row if needed, or keep as block
  } as ViewStyle,
  label: {
    fontSize: FONT_SIZE_M,
    color: SECONDARY_TEXT_COLOR,
    marginBottom: PADDING_XS, // Space between label and value if stacked
    marginRight: PADDING_S, // Space if label is inline
    // flex: 1, // If you want labels to have a fixed proportion
  } as TextStyle,
  value: {
    fontSize: FONT_SIZE_M, // Keep value same size or slightly larger than label
    color: PRIMARY_TEXT_COLOR,
    fontWeight: FONT_WEIGHT_REGULAR,
    flexShrink: 1, // Allow text to wrap
    // flex: 2, // If you want values to have a fixed proportion
  } as TextStyle,
  requirementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: PADDING_S,
  } as ViewStyle,
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BADGE_INFO_BG, // Use a light info background
    paddingHorizontal: PADDING_M,
    paddingVertical: PADDING_S,
    borderRadius: BADGE_PILL_RADIUS, // Pill shape
    marginRight: MARGIN_S,
    marginBottom: MARGIN_S,
  } as ViewStyle,
  requirementIcon: {
    marginRight: PADDING_S,
  } as ViewStyle,
  requirementText: {
    fontSize: FONT_SIZE_S,
    color: BADGE_INFO_TEXT, // Match icon color
    fontWeight: FONT_WEIGHT_MEDIUM,
  } as TextStyle,
  actionsContainer: {
    paddingTop: PADDING_L, // Add padding if it's not inside a card
    // If actions are inside a card, this padding might be on the card itself
    // This assumes actions are outside/after the last card
  } as ViewStyle,
  checkInButton: {
    backgroundColor: PRIMARY_BLUE,
    borderRadius: PADDING_S,
    paddingVertical: PADDING_M, // Generous padding for touch
    paddingHorizontal: PADDING_L,
    alignItems: 'center',
    marginBottom: MARGIN_M,
    shadowColor: PRIMARY_BLUE, // Shadow to match button color
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,
  checkInButtonText: {
    color: CARD_BACKGROUND,
    fontSize: FONT_SIZE_L,
    fontWeight: FONT_WEIGHT_MEDIUM, // Or SEMIBOLD for more emphasis
  } as TextStyle,
  exceptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PADDING_M, // Consistent padding
  } as ViewStyle,
  exceptionButtonText: {
    color: SECONDARY_TEXT_COLOR, // Use secondary color for less emphasis
    fontSize: FONT_SIZE_M,
    marginLeft: PADDING_S,
    fontWeight: FONT_WEIGHT_MEDIUM,
  } as TextStyle,
  errorText: {
    fontSize: FONT_SIZE_M,
    color: BADGE_ERROR_TEXT,
    marginBottom: MARGIN_L,
    textAlign: 'center',
  } as TextStyle,
  retryButton: {
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: PADDING_M - 2,
    paddingHorizontal: PADDING_L,
    borderRadius: PADDING_S,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: MARGIN_S, // Adjusted from MARGIN_L if too much space with error text
  } as ViewStyle,
  retryButtonText: {
    color: CARD_BACKGROUND,
    fontSize: FONT_SIZE_L,
    fontWeight: FONT_WEIGHT_MEDIUM,
  } as TextStyle,
  shareContainer: {
    marginTop: MARGIN_L,
    alignItems: 'flex-start',
  } as ViewStyle,
  shareButton: {
    paddingHorizontal: PADDING_L,
  } as ViewStyle,
});
