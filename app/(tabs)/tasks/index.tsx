import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Modal,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import {
  MapPin,
  Users,
  Clock,
  Camera,
  Wifi,
  ChevronDown,
} from 'lucide-react-native';
import { useTasksStore } from '@/stores/tasks';
import { checkInService } from '@/services/tasks-service';
import type { TaskType } from '@/types/tasks';
// import THEME, { COLORS, FONTS, SIZES } from '@/utils/theme'; // Removed
// import Button from '@/components/Button'; // Removed

// 定义筛选类型
type FilterType = '全部' | '待签到' | '未签到' | '签到异常';

const FILTER_OPTIONS: FilterType[] = ['待签到', '未签到', '签到异常', '全部'];

// --- Style Constants ---
const APP_BACKGROUND = '#F8F8FA';
const CARD_BACKGROUND = '#FFFFFF';
const PRIMARY_BLUE = '#007AFF';
const PRIMARY_TEXT_COLOR = '#1C1C1E'; // Darker, more like iOS system black
const SECONDARY_TEXT_COLOR = '#8A8A8E'; // iOS secondary gray
const LIGHT_GRAY_BORDER = '#E5E5EA'; // Lighter border
const ICON_BLUE = PRIMARY_BLUE;

// Badge Colors (Background, Text)
const BADGE_SUCCESS_BG = '#E6F7EA'; // Light Green
const BADGE_SUCCESS_TEXT = '#389E0D'; // Dark Green
const BADGE_WARNING_BG = '#FFFBE6'; // Light Orange/Yellow
const BADGE_WARNING_TEXT = '#FA8C16'; // Dark Orange/Yellow
const BADGE_ERROR_BG = '#FFF1F0'; // Light Red
const BADGE_ERROR_TEXT = '#FF4D4F'; // Dark Red
const BADGE_INFO_BG = '#E0F2FF'; // Light Blue
const BADGE_INFO_TEXT = PRIMARY_BLUE; // Blue
const BADGE_NEUTRAL_BG = '#F0F0F0'; // Light Gray
const BADGE_NEUTRAL_TEXT = '#595959'; // Dark Gray

const CARD_BORDER_RADIUS = 12;
const BADGE_PILL_RADIUS = 16; // For pill shape badges

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

// Alpha值，用于徽章背景色，'4D' 对应约 30% 不透明度 -- No longer needed due to explicit badge colors
// const BADGE_BACKGROUND_ALPHA = '4D';

export default function TasksScreen() {
  const router = useRouter();
  const { tasks, loading, error, fetchTasks } = useTasksStore();
  const [filter, setFilter] = useState<FilterType>('待签到');

  // 初始加载
  useEffect(() => {
    fetchTasks();
  }, []);

  // 当页面重新获得焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      return () => {
        // 在页面失去焦点时可以清理的相关操作
      };
    }, [fetchTasks])
  );

  // 添加跳转到签到历史前先刷新数据的函数
  const navigateToCheckinDetail = async (taskId: string) => {
    try {
      // 检查是否要跳转到签到详情页面
      if (taskId) {
        // 先跳转
        router.replace(`/(tabs)/profile/check-in-detail?id=${taskId}`);
      }
    } catch (err) {
      console.error('导航到签到详情失败', err);
    }
  };

  // 筛选任务列表
  const filteredTasks = tasks.filter((task) => {
    if (filter === '全部') return true;

    const status = task.status;
    const checkinStatus = task.myCheckinStatus;

    switch (filter) {
      case '待签到':
        return (
          (status === 'ongoing' &&
            (!checkinStatus || checkinStatus === 'unchecked')) ||
          status == 'upcoming'
        );
      case '未签到':
        return (
          status === 'expired' &&
          (!checkinStatus || checkinStatus === 'unchecked')
        );
      case '签到异常':
        return (
          status !== 'upcoming' &&
          (checkinStatus === 'pending_audit' ||
            checkinStatus === 'audit_rejected' ||
            checkinStatus === 'pending')
        );
      default:
        return true;
    }
  });

  // 获取任务状态的样式信息（背景色和文字颜色）
  const getStatusStyleInfo = (status: string, myCheckinStatus?: string) => {
    let badgeBackgroundColor: string;
    let badgeTextColor: string;

    if (status === 'upcoming') {
      badgeBackgroundColor = BADGE_INFO_BG;
      badgeTextColor = BADGE_INFO_TEXT;
    } else if (status === 'ongoing') {
      switch (myCheckinStatus) {
        case 'success':
        case 'audit_approved':
          badgeBackgroundColor = BADGE_SUCCESS_BG;
          badgeTextColor = BADGE_SUCCESS_TEXT;
          break;
        case 'pending_audit':
        case 'pending':
          badgeBackgroundColor = BADGE_WARNING_BG;
          badgeTextColor = BADGE_WARNING_TEXT;
          break;
        case 'audit_rejected':
          badgeBackgroundColor = BADGE_ERROR_BG;
          badgeTextColor = BADGE_ERROR_TEXT;
          break;
        case 'unchecked':
        case undefined:
        default:
          badgeBackgroundColor = BADGE_INFO_BG; //進行中
          badgeTextColor = BADGE_INFO_TEXT;
          break;
      }
    } else if (status === 'expired') {
      switch (myCheckinStatus) {
        case 'success':
        case 'audit_approved': // Should ideally not happen if expired, but handle
          badgeBackgroundColor = BADGE_SUCCESS_BG;
          badgeTextColor = BADGE_SUCCESS_TEXT;
          break;
        case 'pending_audit': // Still in audit but task expired
        case 'pending': // Was pending but task expired
          badgeBackgroundColor = BADGE_WARNING_BG; // Or error, depending on business rule for "expired & pending"
          badgeTextColor = BADGE_WARNING_TEXT;
          break;
        case 'audit_rejected': // Rejected and task expired
          badgeBackgroundColor = BADGE_ERROR_BG;
          badgeTextColor = BADGE_ERROR_TEXT;
          break;
        case 'unchecked': // Expired and never checked in
        case undefined:
        default:
          badgeBackgroundColor = BADGE_ERROR_BG;
          badgeTextColor = BADGE_ERROR_TEXT;
          break;
      }
    } else {
      badgeBackgroundColor = BADGE_NEUTRAL_BG;
      badgeTextColor = BADGE_NEUTRAL_TEXT;
    }

    return {
      badgeBackgroundColor,
      badgeTextColor,
    };
  };

  // 获取状态显示文本 (No changes to logic, only style related function above)
  const getStatusText = (status: string, myCheckinStatus?: string) => {
    if (status === 'upcoming') {
      return '即将开始';
    }
    if (status === 'ongoing') {
      switch (myCheckinStatus) {
        case 'success':
          return '签到成功';
        case 'audit_approved':
          return '审核成功';
        case 'pending_audit':
          return '审核中';
        case 'audit_rejected':
          return '审核不通过';
        case 'pending':
          return '待签到';
        case 'unchecked':
        case undefined:
        default:
          return '进行中';
      }
    }

    if (status === 'expired') {
      switch (myCheckinStatus) {
        case 'success':
          return '签到成功';
        case 'audit_approved':
          return '审核通过';
        case 'pending_audit':
          return '审核中';
        case 'audit_rejected':
          return '审核不通过';
        case 'pending':
          return '处理中';
        case 'unchecked':
        case undefined:
        default:
          return '未签到(超时)';
      }
    }

    return '未知状态';
  };

  const renderTask = ({ item }: { item: TaskType }) => {
    const type = item.type || {};
    const myCheckinStatus = item.myCheckinStatus;
    const { badgeBackgroundColor, badgeTextColor } = getStatusStyleInfo(
      item.status,
      myCheckinStatus
    );

    // 判断是否为已签到状态
    const isCheckedIn =
      myCheckinStatus === 'success' || myCheckinStatus === 'audit_approved';

    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => {
          // 如果任务已签到，跳转到该任务的签到详情页面，否则跳转到任务详情页
          if (isCheckedIn) {
            // 使用新的导航函数
            navigateToCheckinDetail(item.id);
          } else {
            router.push(`/tasks/task-detail?id=${item.id}`);
          }
        }}
      >
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: badgeBackgroundColor },
            ]}
          >
            <Text style={[styles.statusText, { color: badgeTextColor }]}>
              {getStatusText(item.status, myCheckinStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.taskInfo}>
          <View style={styles.infoItem}>
            <Users size={18} color={ICON_BLUE} style={styles.infoIcon} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.groupName || item.group}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Clock size={18} color={ICON_BLUE} style={styles.infoIcon} />
            <Text style={styles.infoText}>截止 {item.deadline}</Text>
          </View>
        </View>

        {(type.gps || type.face || type.wifi) && (
          <View style={styles.taskTypes}>
            {type.gps && (
              <View style={styles.typeItem}>
                <MapPin size={16} color={ICON_BLUE} style={styles.typeIcon} />
                <Text style={styles.typeText}>位置</Text>
              </View>
            )}
            {type.face && (
              <View style={styles.typeItem}>
                <Camera size={16} color={ICON_BLUE} style={styles.typeIcon} />
                <Text style={styles.typeText}>人脸</Text>
              </View>
            )}
            {type.wifi && (
              <View style={styles.typeItem}>
                <Wifi size={16} color={ICON_BLUE} style={styles.typeIcon} />
                <Text style={styles.typeText}>WiFi</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        {/* <Button
          title="重试"
          onPress={fetchTasks}
          variant="primary"
          size="medium"
        /> */}
        <TouchableOpacity onPress={fetchTasks} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 筛选器 */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === item && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(item)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === item && styles.filterButtonTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterListContent}
        />
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchTasks}
            colors={[PRIMARY_BLUE]} // Use constant
            tintColor={PRIMARY_BLUE} // Use constant
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无待处理任务</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  } as ViewStyle,
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: PADDING_L,
    backgroundColor: APP_BACKGROUND,
  } as ViewStyle,
  filterContainer: {
    backgroundColor: CARD_BACKGROUND, // 与头部一致的白色背景
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY_BORDER, // 添加底部边框替代阴影
    marginHorizontal: 0, // 移除水平边距使其与边缘对齐
    marginVertical: 0, // 移除垂直边距
    marginTop: 0, // 确保与头部无间隙
    paddingVertical: PADDING_M, // 增加垂直内边距
    borderRadius: 0, // 移除圆角
    flexDirection: 'row', // 确保水平布局
  } as ViewStyle,
  filterListContent: {
    paddingHorizontal: PADDING_XL, // 增加水平内边距
    alignItems: 'center',
  },
  filterButton: {
    paddingVertical: PADDING_M, // 增加垂直内边距
    paddingHorizontal: PADDING_L, // 增加水平内边距
    marginRight: PADDING_L, // 增加按钮之间的间距
    backgroundColor: 'transparent', // 未选中按钮透明
    borderRadius: 8, // 圆角
  } as ViewStyle,
  filterButtonActive: {
    backgroundColor: PRIMARY_BLUE, // Blue background for active button
    // borderRadius is inherited from filterButton or can be re-specified if different
  } as ViewStyle,
  filterButtonText: {
    fontSize: FONT_SIZE_M,
    color: PRIMARY_TEXT_COLOR, // Dark text for unselected
    fontWeight: FONT_WEIGHT_MEDIUM,
  } as TextStyle,
  filterButtonTextActive: {
    color: CARD_BACKGROUND, // White text for selected
    fontWeight: FONT_WEIGHT_MEDIUM,
  } as TextStyle,
  listContainer: {
    paddingHorizontal: PADDING_L, // 增加水平内边距
    paddingBottom: PADDING_L,
    paddingTop: PADDING_L, // 增加顶部内边距，与筛选框分开
  } as ViewStyle,
  taskCard: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: CARD_BORDER_RADIUS,
    padding: PADDING_XL, // 增加内边距
    marginBottom: MARGIN_L, // 增加卡片之间的间距
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  } as ViewStyle,
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: MARGIN_M,
  } as ViewStyle,
  taskTitle: {
    fontSize: FONT_SIZE_L, // Consistent large font for titles
    fontWeight: FONT_WEIGHT_SEMIBOLD,
    color: PRIMARY_TEXT_COLOR,
    flex: 1,
    marginRight: MARGIN_S,
  } as TextStyle,
  statusBadge: {
    paddingHorizontal: PADDING_M,
    paddingVertical: PADDING_XS + 1, // Fine-tune for height
    borderRadius: BADGE_PILL_RADIUS, // Fully pill-shaped
    minWidth: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  statusText: {
    fontSize: FONT_SIZE_S,
    fontWeight: FONT_WEIGHT_MEDIUM, // Make badge text slightly bolder
  } as TextStyle,
  taskInfo: {
    marginBottom: MARGIN_M,
  } as ViewStyle,
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MARGIN_S,
  } as ViewStyle,
  infoIcon: {
    marginRight: MARGIN_S, // Space between icon and text
  } as ViewStyle, // For Lucide icons, pass style directly
  infoText: {
    fontSize: FONT_SIZE_M, // Prominent info text
    fontWeight: FONT_WEIGHT_REGULAR, // Regular for info, can be FONT_WEIGHT_MEDIUM if more emphasis needed
    color: SECONDARY_TEXT_COLOR, // Use secondary for less emphasis than title, but clearer than light gray
    flexShrink: 1,
  } as TextStyle,
  taskTypes: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY_BORDER, // Use lighter border
    paddingTop: MARGIN_M,
    flexWrap: 'wrap',
  } as ViewStyle,
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: MARGIN_M,
    marginBottom: PADDING_XS,
  } as ViewStyle,
  typeIcon: {
    marginRight: PADDING_XS, // Space between icon and text
  } as ViewStyle, // For Lucide icons
  typeText: {
    fontSize: FONT_SIZE_S,
    color: ICON_BLUE, // Blue text to match icon
    marginLeft: PADDING_XS,
  } as TextStyle,
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PADDING_XL * 2,
    minHeight: 200,
  } as ViewStyle,
  emptyText: {
    fontSize: FONT_SIZE_M,
    color: SECONDARY_TEXT_COLOR,
  } as TextStyle,
  errorText: {
    fontSize: FONT_SIZE_M,
    color: BADGE_ERROR_TEXT, // Use error text color
    marginBottom: MARGIN_M,
    textAlign: 'center',
  } as TextStyle,
  // Removed iconWrapper and typeIconWrapper as their backgrounds are removed.
  // Icons are styled directly or via a generic icon style if needed.
  retryButton: {
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: PADDING_M - 2, // 10
    paddingHorizontal: PADDING_L, // 16
    borderRadius: PADDING_S, // 8
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: MARGIN_L,
  } as ViewStyle,
  retryButtonText: {
    color: CARD_BACKGROUND, // White text
    fontSize: FONT_SIZE_L, // 16
    fontWeight: FONT_WEIGHT_MEDIUM,
  } as TextStyle,
});
