import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MapPin, Camera, Wifi } from 'lucide-react-native';
import { checkInService } from '@/services/tasks-service';
import type { CheckinRecord } from '@/gen/models';
import { formatUnixTimestamp } from '@/utils/date';

// 扩展CheckinRecord类型，添加详情页需要的字段
interface CheckInDetailDisplay extends CheckinRecord {
  status: string; // 签到状态
  requiredTime?: number; // 应签到时间
  checkInTime?: number; // 实际签到时间
  type: {
    gps: boolean;
    face: boolean;
    wifi: boolean;
    nfc?: boolean;
  };
  exception?: {
    reason: string;
    status: 'approved' | 'rejected' | 'pending';
    feedback?: string;
  };
}

export default function CheckInDetailScreen() {
  const { id } = useLocalSearchParams();
  const [detail, setDetail] = useState<CheckInDetailDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await checkInService.getDetail(id as string);
      if (response.success && response.data) {
        // 将API返回的数据转换为所需的详情显示格式
        const record = response.data;
        const detailDisplay: CheckInDetailDisplay = {
          ...record,
          status: 'success', // 所有记录都是成功记录
          checkInTime: record.signedTime,
          type: {
            gps: record.checkinMethods?.gps || false,
            face: record.checkinMethods?.face || false,
            wifi: record.checkinMethods?.wifi || false,
            nfc: record.checkinMethods?.nfc || false,
          },
          // 移除failureReason，因为所有记录都是成功的
        };
        setDetail(detailDisplay);
      } else {
        setError(response.error || '获取记录详情失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
    } else {
      setError('缺少记录ID');
      setLoading(false);
    }
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '签到成功';
      case 'failed':
        return '签到失败';
      case 'pending':
        return '待审核';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || '记录不存在'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDetail}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.taskTitle} numberOfLines={2} ellipsizeMode="tail">
          {detail.taskName}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(detail.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(detail.status)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本信息</Text>
        <View style={styles.infoItem}>
          <Text style={styles.label}>所属组织</Text>
          <Text style={styles.value}>{detail.groupName}</Text>
        </View>
        {detail.requiredTime && (
          <View style={styles.infoItem}>
            <Text style={styles.label}>应签到时间</Text>
            <Text style={styles.value}>
              {formatUnixTimestamp(detail.requiredTime)}
            </Text>
          </View>
        )}
        {detail.signedTime && (
          <View style={styles.infoItem}>
            <Text style={styles.label}>实际签到时间</Text>
            <Text style={styles.value}>
              {formatUnixTimestamp(detail.signedTime)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>签到要求</Text>
        <View style={styles.requirements}>
          {detail.type.gps && (
            <View style={styles.requirementItem}>
              <MapPin size={20} color="#4A90E2" />
              <Text style={styles.requirementText}>位置签到</Text>
            </View>
          )}
          {detail.type.face && (
            <View style={styles.requirementItem}>
              <Camera size={20} color="#4A90E2" />
              <Text style={styles.requirementText}>人脸识别</Text>
            </View>
          )}
          {detail.type.wifi && (
            <View style={styles.requirementItem}>
              <Wifi size={20} color="#4A90E2" />
              <Text style={styles.requirementText}>WiFi验证</Text>
            </View>
          )}
        </View>
      </View>

      {detail.exception && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>异常申请</Text>
          <View style={styles.exceptionInfo}>
            <Text style={styles.exceptionReason}>
              {detail.exception.reason}
            </Text>
            <View
              style={[
                styles.exceptionStatus,
                {
                  backgroundColor:
                    detail.exception.status === 'approved'
                      ? '#4CAF50'
                      : detail.exception.status === 'rejected'
                      ? '#F44336'
                      : '#FF9800',
                },
              ]}
            >
              <Text style={styles.exceptionStatusText}>
                {detail.exception.status === 'approved'
                  ? '已通过'
                  : detail.exception.status === 'rejected'
                  ? '已拒绝'
                  : '审核中'}
              </Text>
            </View>
            {detail.exception.feedback && (
              <Text style={styles.feedback}>
                审核意见：{detail.exception.feedback}
              </Text>
            )}
          </View>
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
  taskTitle: {
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
    backgroundColor: '#4CAF50',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 8,
  },
  requirements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F0FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  requirementText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  failureReason: {
    fontSize: 14,
    color: '#F44336',
    lineHeight: 20,
  },
  exceptionInfo: {
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 8,
  },
  exceptionReason: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  exceptionStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 12,
  },
  exceptionStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  feedback: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
