import { useEffect, useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MapPin,
  Users,
  Clock,
  Camera,
  Wifi,
  ChevronDown,
} from 'lucide-react-native';
import { useTasksStore } from '@/stores/tasks';
import type { TaskType } from '@/types/tasks';

// 定义筛选类型
type FilterType = '全部' | '待签到' | '未签到' | '签到异常';

export default function TasksScreen() {
  const router = useRouter();
  const { tasks, loading, error, fetchTasks } = useTasksStore();
  const [filter, setFilter] = useState<FilterType>('待签到');
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  // 筛选任务列表
  const filteredTasks = tasks.filter((task) => {
    if (filter === '全部') return true;

    const status = task.status;
    const checkinStatus = task.myCheckinStatus;

    switch (filter) {
      case '待签到':
        // 任务进行中且未签到的任务
        return (
          status === 'ongoing' &&
          (!checkinStatus || checkinStatus === 'unchecked')
        );
      case '未签到':
        // 已过期且未签到的任务
        return (
          status === 'expired' &&
          (!checkinStatus || checkinStatus === 'unchecked')
        );
      case '签到异常':
        // 包括申请中、申请被拒、处理中的任务
        // 但不包括"即将开始"的任务
        return (
          status !== 'upcoming' && // 排除即将开始的任务
          (checkinStatus === 'pending_audit' ||
            checkinStatus === 'audit_rejected' ||
            checkinStatus === 'pending')
        );
      default:
        return true;
    }
  });

  // 获取任务状态颜色
  const getStatusColor = (status: string, myCheckinStatus?: string) => {
    if (status === 'upcoming') {
      return '#FF9800'; // 即将开始 - Orange
    }

    if (status === 'ongoing') {
      switch (myCheckinStatus) {
        case 'success':
        case 'audit_approved':
          return '#4CAF50'; // 签到成功 - Green
        case 'pending_audit':
          return '#FFC107'; // 正在申请 - Yellow
        case 'audit_rejected':
          return '#F44336'; // 申请不通过 - Red
        case 'pending':
          return '#FF9800'; // 处理中 - Orange
        case 'unchecked':
        case undefined:
        default: // Includes unknown statuses and unchecked
          return '#4CAF50'; // 进行中 (需要签到) - Green
      }
    }

    if (status === 'expired') {
      switch (myCheckinStatus) {
        case 'success':
        case 'audit_approved':
          return '#4CAF50'; // 签到成功 - Green
        case 'pending_audit':
          return '#FFC107'; // 正在申请 - Yellow
        case 'audit_rejected':
          return '#F44336'; // 申请不通过 - Red
        case 'pending':
          return '#FF9800'; // 处理中 - Orange
        case 'unchecked':
        case undefined:
        default: // Includes unknown statuses and unchecked
          return '#F44336'; // 未签到(超时) - Red
      }
    }

    return '#999'; // Default fallback for unknown status combination
  };

  // 获取状态显示文本
  const getStatusText = (status: string, myCheckinStatus?: string) => {
    if (status === 'upcoming') {
      return '即将开始';
    }

    if (status === 'ongoing') {
      switch (myCheckinStatus) {
        case 'success':
          return '签到成功';
        case 'audit_approved':
          return '签到成功(申请通过)';
        case 'pending_audit':
          return '正在申请';
        case 'audit_rejected':
          return '申请不通过';
        case 'pending':
          return '待签到';
        case 'unchecked':
        case undefined:
        default: // Includes unknown statuses and unchecked
          return '进行中'; // Needs check-in
      }
    }

    if (status === 'expired') {
      switch (myCheckinStatus) {
        case 'success':
          return '签到成功';
        case 'audit_approved':
          return '签到成功(申请通过)';
        case 'pending_audit':
          return '正在申请';
        case 'audit_rejected':
          return '申请不通过';
        case 'pending':
          return '处理中';
        case 'unchecked':
        case undefined:
        default: // Includes unknown statuses and unchecked
          return '未签到(超时)';
      }
    }

    return '未知状态'; // Default fallback for unknown status combination
  };

  // 渲染筛选器模态框
  const renderFilterModal = () => (
    <Modal
      transparent={true}
      visible={showFilterModal}
      animationType="fade"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContent}>
          {(['全部', '待签到', '未签到', '签到异常'] as FilterType[]).map(
            (item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterItem,
                  filter === item && styles.filterItemActive,
                ]}
                onPress={() => {
                  setFilter(item);
                  setShowFilterModal(false);
                }}
              >
                <Text
                  style={[
                    styles.filterItemText,
                    filter === item && styles.filterItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </Pressable>
    </Modal>
  );

  const renderTask = ({ item }: { item: TaskType }) => {
    // 确保type字段是对象并有适当的默认值
    const type = item.type || {};

    // 使用myCheckinStatus属性
    const myCheckinStatus = item.myCheckinStatus;

    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => router.push(`/tasks/task-detail?id=${item.id}`)}
      >
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status, myCheckinStatus) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusText(item.status, myCheckinStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.taskInfo}>
          <View style={styles.infoItem}>
            <Users size={16} color="#666" />
            <Text style={styles.infoText}>{item.groupName || item.group}</Text>
          </View>
          <View style={styles.infoItem}>
            <Clock size={16} color="#666" />
            <Text style={styles.infoText}>截止 {item.deadline}</Text>
          </View>
        </View>

        <View style={styles.taskTypes}>
          {type.gps && (
            <View style={styles.typeItem}>
              <MapPin size={16} color="#4A90E2" />
              <Text style={styles.typeText}>位置</Text>
            </View>
          )}
          {type.face && (
            <View style={styles.typeItem}>
              <Camera size={16} color="#4A90E2" />
              <Text style={styles.typeText}>人脸</Text>
            </View>
          )}
          {type.wifi && (
            <View style={styles.typeItem}>
              <Wifi size={16} color="#4A90E2" />
              <Text style={styles.typeText}>WiFi</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTasks}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 筛选器 */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterButtonText}>{filter}</Text>
          <ChevronDown size={16} color="#333" />
        </TouchableOpacity>
      </View>

      {renderFilterModal()}

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTasks} />
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
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E9F0',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    marginTop: 60,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  filterItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  filterItemActive: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
  },
  filterItemText: {
    fontSize: 16,
    color: '#333',
  },
  filterItemTextActive: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  taskInfo: {
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  taskTypes: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  typeText: {
    fontSize: 14,
    color: '#4A90E2',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
