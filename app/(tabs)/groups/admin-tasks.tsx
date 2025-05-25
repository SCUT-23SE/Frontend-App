import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  MapPin,
  Camera,
  Wifi,
  CircleCheck,
  Clock,
  Edit,
  Copy,
  Trash,
  Plus,
} from 'lucide-react-native';
import { useAdminTasksStore } from '@/stores/admin-tasks';
import type { AdminTaskType } from '@/types/tasks';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import THEME, { FONTS, SIZES } from '@/utils/theme';

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

export default function AdminTasksScreen() {
  const { id: groupId } = useLocalSearchParams();
  const router = useRouter();
  const {
    tasks,
    loading,
    error,
    operationStatus,
    fetchTasks,
    deleteTask,
    resetOperationStatus,
  } = useAdminTasksStore();

  useEffect(() => {
    if (groupId) {
      fetchTasks(groupId as string);
    }
    return () => {
      resetOperationStatus();
    };
  }, [groupId]);

  const handleCreateTask = () => {
    router.push(`/groups/admin-task-form?groupId=${groupId}`);
  };

  const handleEditTask = (task: AdminTaskType) => {
    router.push(`/groups/admin-task-form?groupId=${groupId}&taskId=${task.id}`);
  };

  const handleCopyTask = (task: AdminTaskType) => {
    router.push(
      `/groups/admin-task-form?groupId=${groupId}&copyFrom=${task.id}`
    );
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert('确认删除', '确定要删除这个签到任务吗？此操作不可撤销。', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          const success = await deleteTask(taskId);
          if (success) {
            Alert.alert('成功', '任务已删除');
          }
        },
      },
    ]);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'success';
      case 'upcoming':
        return 'warning';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing':
        return '进行中';
      case 'upcoming':
        return '未开始';
      case 'expired':
        return '已结束';
      default:
        return '';
    }
  };

  const renderTask = ({ item }: { item: AdminTaskType }) => (
    <Card style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Badge
          text={getStatusText(item.status)}
          variant={getStatusVariant(item.status) as any}
          size="small"
        />
      </View>

      <View style={styles.taskInfo}>
        <View style={styles.infoItem}>
          <Clock size={16} color={SECONDARY_TEXT_COLOR} />
          <Text style={styles.infoText}>
            {new Date(item.startTime).toLocaleString()} -{' '}
            {new Date(item.endTime).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.taskTypes}>
        {item.type.gps && (
          <View style={styles.typeItem}>
            <MapPin size={16} color={ICON_BLUE} />
            <Text style={styles.typeText}>位置</Text>
          </View>
        )}
        {item.type.face && (
          <View style={styles.typeItem}>
            <Camera size={16} color={ICON_BLUE} />
            <Text style={styles.typeText}>人脸</Text>
          </View>
        )}
        {item.type.wifi && (
          <View style={styles.typeItem}>
            <Wifi size={16} color={ICON_BLUE} />
            <Text style={styles.typeText}>WiFi</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditTask(item)}
        >
          <Edit size={20} color={ICON_BLUE} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCopyTask(item)}
        >
          <Copy size={20} color={BADGE_SUCCESS_TEXT} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteTask(item.id)}
        >
          <Trash size={20} color={BADGE_ERROR_TEXT} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="重试"
          onPress={() => fetchTasks(groupId as string)}
          variant="primary"
          size="medium"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => fetchTasks(groupId as string)}
            colors={[PRIMARY_BLUE]}
            tintColor={PRIMARY_BLUE}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无签到任务</Text>
              <Text style={styles.emptySubText}>点击右下角按钮创建新任务</Text>
            </View>
          ) : null
        }
      />

      {operationStatus.loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={handleCreateTask}>
        <Plus size={24} color={CARD_BACKGROUND} />
      </TouchableOpacity>
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
  listContainer: {
    padding: PADDING_M,
    paddingBottom: 80,
  } as ViewStyle,
  taskCard: {
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: MARGIN_M,
  } as ViewStyle,
  taskTitle: {
    fontSize: FONT_SIZE_L,
    fontWeight: FONT_WEIGHT_SEMIBOLD,
    color: PRIMARY_TEXT_COLOR,
    flex: 1,
    marginRight: MARGIN_S,
  } as TextStyle,
  taskInfo: {
    marginBottom: MARGIN_M,
  } as ViewStyle,
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: PADDING_XS,
  } as ViewStyle,
  infoText: {
    fontSize: FONT_SIZE_M,
    color: SECONDARY_TEXT_COLOR,
    marginLeft: MARGIN_S,
  } as TextStyle,
  taskTypes: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY_BORDER,
    paddingTop: PADDING_M,
    marginBottom: MARGIN_M,
  } as ViewStyle,
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: MARGIN_M,
  } as ViewStyle,
  typeText: {
    fontSize: FONT_SIZE_S,
    color: ICON_BLUE,
    marginLeft: PADDING_XS,
  } as TextStyle,
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY_BORDER,
    paddingTop: PADDING_M,
  } as ViewStyle,
  actionButton: {
    padding: PADDING_S,
    marginLeft: PADDING_L,
  } as ViewStyle,
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PADDING_L,
  } as ViewStyle,
  emptyText: {
    fontSize: FONT_SIZE_M,
    color: SECONDARY_TEXT_COLOR,
    marginBottom: MARGIN_S,
  } as TextStyle,
  emptySubText: {
    fontSize: FONT_SIZE_S,
    color: SECONDARY_TEXT_COLOR,
  } as TextStyle,
  fab: {
    position: 'absolute',
    right: MARGIN_L,
    bottom: MARGIN_L,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5,
  } as ViewStyle,
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  errorText: {
    fontSize: FONT_SIZE_M,
    color: BADGE_ERROR_TEXT,
    marginBottom: MARGIN_M,
    textAlign: 'center',
  } as TextStyle,
});
