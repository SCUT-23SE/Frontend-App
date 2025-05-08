import React, { useEffect, useState } from 'react';
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
import { useLocalSearchParams } from 'expo-router';
import { Check, X, User } from 'lucide-react-native';
import { Application } from '@/types/applications';
import { applicationsService } from '@/services/applications-service';
import { JoinRequestStatusEnum } from '@/gen/models';

export default function ApplicationsScreen() {
  const { id: groupId } = useLocalSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<{
    id: string;
    action: 'approve' | 'reject';
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<string[]>([]);

  const fetchApplications = async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await applicationsService.getApplications(
        groupId as string
      );
      if (response.success && response.data) {
        setApplications(response.data);
        // 对于每个申请，获取详细信息，包括申请理由
        response.data.forEach((app) => {
          if (app.status === JoinRequestStatusEnum.Pending) {
            fetchApplicationDetail(app.id);
          }
        });
      } else {
        setError(response.error || '获取申请列表失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationDetail = async (applicationId: string) => {
    if (!groupId) return;

    // 避免重复加载
    if (loadingDetails.includes(applicationId)) return;

    setLoadingDetails((prev) => [...prev, applicationId]);

    try {
      const response = await applicationsService.getApplication(
        groupId as string,
        applicationId
      );

      if (response.success && response.data) {
        // 更新applications数组中相应的申请记录
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId
              ? { ...app, reason: response.data?.reason }
              : app
          )
        );
      }
    } catch (error) {
      console.error('获取申请详情失败:', error);
    } finally {
      setLoadingDetails((prev) => prev.filter((id) => id !== applicationId));
    }
  };

  const handleApplication = async (
    applicationId: string,
    action: 'approve' | 'reject'
  ) => {
    if (!groupId) return;
    setProcessing({ id: applicationId, action });
    try {
      const response = await applicationsService.handleApplication(
        groupId as string,
        applicationId,
        action
      );
      if (response.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId
              ? {
                  ...app,
                  status:
                    action === 'approve'
                      ? JoinRequestStatusEnum.Approved
                      : JoinRequestStatusEnum.Rejected,
                }
              : app
          )
        );
        Alert.alert('成功', action === 'approve' ? '已通过申请' : '已拒绝申请');
      } else {
        Alert.alert('错误', response.error || '操作失败');
      }
    } catch (err: any) {
      Alert.alert('错误', err.message || '网络错误，请稍后重试');
    } finally {
      setProcessing(null);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [groupId]);

  const renderApplication = ({ item }: { item: Application }) => (
    <View style={styles.applicationCard}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <User size={24} color="#4A90E2" />
          </View>
          <Text style={styles.userName}>{item.userName}</Text>
        </View>
        <Text style={styles.time}>
          {new Date(item.submitTime * 1000).toLocaleString()}
        </Text>
      </View>

      {item.reason && (
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>申请理由：</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>
      )}

      {item.status === JoinRequestStatusEnum.Pending ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApplication(item.id, 'approve')}
            disabled={!!processing}
          >
            {processing?.id === item.id && processing?.action === 'approve' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={20} color="#fff" />
                <Text style={styles.actionButtonText}>通过</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleApplication(item.id, 'reject')}
            disabled={!!processing}
          >
            {processing?.id === item.id && processing?.action === 'reject' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <X size={20} color="#fff" />
                <Text style={styles.actionButtonText}>拒绝</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === JoinRequestStatusEnum.Approved
                  ? '#4CAF50'
                  : '#F44336',
            },
          ]}
        >
          <Text style={styles.statusText}>
            {item.status === JoinRequestStatusEnum.Approved
              ? '已通过'
              : '已拒绝'}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading && !refreshing && applications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchApplications}
        >
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={applications}
        renderItem={renderApplication}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchApplications}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无入组申请</Text>
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
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  applicationCard: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E9F1FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  reasonContainer: {
    marginTop: 8,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  statusBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
