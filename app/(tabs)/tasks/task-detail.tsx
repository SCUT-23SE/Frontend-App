import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  MapPin,
  Camera,
  Wifi,
  CircleAlert as AlertCircle,
} from 'lucide-react-native';
import { useTasksStore } from '@/stores/tasks';

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
        <ActivityIndicator size="large" color="#4A90E2" />
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
          <Text style={styles.retryText}>重试</Text>
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{currentTask.title}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(currentTask.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {getStatusText(currentTask.status)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>签到要求</Text>
        <View style={styles.requirementsList}>
          {taskType.gps && (
            <View style={styles.requirementItem}>
              <MapPin size={20} color="#4A90E2" />
              <Text style={styles.requirementText}>位置签到</Text>
            </View>
          )}
          {taskType.face && (
            <View style={styles.requirementItem}>
              <Camera size={20} color="#4A90E2" />
              <Text style={styles.requirementText}>人脸识别</Text>
            </View>
          )}
          {taskType.wifi && (
            <View style={styles.requirementItem}>
              <Wifi size={20} color="#4A90E2" />
              <Text style={styles.requirementText}>WiFi验证</Text>
            </View>
          )}
        </View>
      </View>

      {currentTask.status === 'ongoing' && (
        <View style={styles.actions}>
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
            <AlertCircle size={20} color="#666" />
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
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  requirementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 12,
  },
  requirementText: {
    fontSize: 14,
    color: '#4A90E2',
    marginLeft: 8,
  },
  actions: {
    padding: 20,
  },
  checkInButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exceptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  exceptionButtonText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 8,
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
