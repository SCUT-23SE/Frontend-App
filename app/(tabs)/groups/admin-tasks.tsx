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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  MapPin,
  Camera,
  Wifi,
  CircleCheck as CheckCircle2,
  Clock,
  CreditCard as Edit,
  Copy,
  Trash,
  Plus,
} from 'lucide-react-native';
import { useAdminTasksStore } from '@/stores/admin-tasks';
import type { AdminTaskType } from '@/types/tasks';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return '#4CAF50';
      case 'upcoming':
        return '#FF9800';
      case 'expired':
        return '#F44336';
      default:
        return '#999';
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
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.taskInfo}>
        <View style={styles.infoItem}>
          <Clock size={16} color="#666" />
          <Text style={styles.infoText}>
            {new Date(item.startTime).toLocaleString()} -{' '}
            {new Date(item.endTime).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.taskTypes}>
        {item.type.gps && (
          <View style={styles.typeItem}>
            <MapPin size={16} color="#4A90E2" />
            <Text style={styles.typeText}>位置</Text>
          </View>
        )}
        {item.type.face && (
          <View style={styles.typeItem}>
            <Camera size={16} color="#4A90E2" />
            <Text style={styles.typeText}>人脸</Text>
          </View>
        )}
        {item.type.wifi && (
          <View style={styles.typeItem}>
            <Wifi size={16} color="#4A90E2" />
            <Text style={styles.typeText}>WiFi</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditTask(item)}
        >
          <Edit size={20} color="#4A90E2" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCopyTask(item)}
        >
          <Copy size={20} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteTask(item.id)}
        >
          <Trash size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchTasks(groupId as string)}
        >
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
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
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={handleCreateTask}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
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
  listContainer: {
    padding: 16,
    paddingBottom: 80,
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
    marginBottom: 12,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    padding: 8,
    marginLeft: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
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
