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
  Image,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  Check,
  X,
  User,
  Clock,
  Calendar,
  Info,
  Image as ImageIcon,
  FileText,
} from 'lucide-react-native';
import { useAuditRequestsStore } from '@/stores/audit-requests';
import { AuditRequestStatusEnum } from '@/gen/models';
import { AuditRequestItem } from '@/services/audit-requests-service';

export default function AdminAuditRequestsScreen() {
  const { id: groupId } = useLocalSearchParams();
  const {
    auditRequests,
    loading,
    error,
    filterStatus,
    processing,
    fetchAuditRequests,
    setFilterStatus,
    handleAuditRequest,
  } = useAuditRequestsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [expandedImages, setExpandedImages] = useState<Record<string, boolean>>(
    {}
  );

  // 刷新列表
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAuditRequests(groupId as string);
    setRefreshing(false);
  };

  // 切换图片展开状态
  const toggleImageExpand = (requestId: string) => {
    setExpandedImages((prev) => ({
      ...prev,
      [requestId]: !prev[requestId],
    }));
  };

  // 处理审核申请
  const onHandleAuditRequest = async (
    auditRequestId: string,
    action: 'approve' | 'reject'
  ) => {
    const actionText = action === 'approve' ? '通过' : '拒绝';

    Alert.alert(
      `确认${actionText}申请`,
      `确定要${actionText}该签到异常申请吗？`,
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确定',
          onPress: async () => {
            const success = await handleAuditRequest(auditRequestId, action);
            if (success) {
              Alert.alert('成功', `已${actionText}该异常申请`);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (groupId) {
      fetchAuditRequests(groupId as string);
    }
  }, [groupId, filterStatus]);

  // 渲染筛选选项卡
  const renderFilterTabs = () => (
    <View style={styles.filterTabs}>
      <TouchableOpacity
        style={[
          styles.filterTab,
          filterStatus === 'pending' && styles.activeFilterTab,
        ]}
        onPress={() => setFilterStatus('pending')}
      >
        <Text
          style={[
            styles.filterTabText,
            filterStatus === 'pending' && styles.activeFilterTabText,
          ]}
        >
          待处理
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterTab,
          filterStatus === 'processed' && styles.activeFilterTab,
        ]}
        onPress={() => setFilterStatus('processed')}
      >
        <Text
          style={[
            styles.filterTabText,
            filterStatus === 'processed' && styles.activeFilterTabText,
          ]}
        >
          已处理
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.filterTab,
          filterStatus === 'all' && styles.activeFilterTab,
        ]}
        onPress={() => setFilterStatus('all')}
      >
        <Text
          style={[
            styles.filterTabText,
            filterStatus === 'all' && styles.activeFilterTabText,
          ]}
        >
          全部
        </Text>
      </TouchableOpacity>
    </View>
  );

  // 渲染单个审核申请项
  const renderAuditRequest = ({ item }: { item: AuditRequestItem }) => (
    <View style={styles.requestCard}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <User size={24} color="#4A90E2" />
          </View>
          <Text style={styles.userName}>{item.userName}</Text>
        </View>
        <View style={styles.timeContainer}>
          <Clock size={14} color="#666" />
          <Text style={styles.timeText}>{item.requestTime}</Text>
        </View>
      </View>

      <View style={styles.taskInfo}>
        <Calendar size={16} color="#4A90E2" />
        <Text style={styles.taskName}>{item.taskName}</Text>
      </View>

      <View style={styles.reasonContainer}>
        <View style={styles.reasonHeader}>
          <Info size={16} color="#4A90E2" />
          <Text style={styles.reasonLabel}>异常原因：</Text>
        </View>
        <Text style={styles.reasonText}>{item.reason}</Text>
      </View>

      {item.proofImageUrls && item.proofImageUrls.length > 0 ? (
        <View style={styles.proofContainer}>
          <TouchableOpacity
            style={styles.proofHeader}
            onPress={() => toggleImageExpand(item.id)}
          >
            <ImageIcon size={16} color="#4A90E2" />
            <Text style={styles.proofLabel}>证明材料：</Text>
            <Text style={styles.expandText}>
              {expandedImages[item.id] ? '收起' : '查看'}
            </Text>
          </TouchableOpacity>

          {expandedImages[item.id] && (
            <View style={styles.imagesContainer}>
              {item.proofImageUrls.map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={styles.proofImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}
        </View>
      ) : null}

      {item.status === AuditRequestStatusEnum.Pending ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => onHandleAuditRequest(item.id, 'approve')}
            disabled={processing !== null}
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
            onPress={() => onHandleAuditRequest(item.id, 'reject')}
            disabled={processing !== null}
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
        <View style={styles.processingInfo}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === AuditRequestStatusEnum.Approved
                    ? '#4CAF50'
                    : '#F44336',
              },
            ]}
          >
            <Text style={styles.statusText}>
              {item.status === AuditRequestStatusEnum.Approved
                ? '已通过'
                : '已拒绝'}
            </Text>
          </View>

          {item.adminName && (
            <Text style={styles.processingText}>处理人: {item.adminName}</Text>
          )}

          {item.processTime && (
            <Text style={styles.processingText}>
              处理时间: {item.processTime}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  if (loading && !refreshing && auditRequests.length === 0) {
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
          onPress={() => fetchAuditRequests(groupId as string)}
        >
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderFilterTabs()}

      <FlatList
        data={auditRequests}
        renderItem={renderAuditRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {filterStatus === 'pending'
                  ? '暂无待处理的签到异常申请'
                  : filterStatus === 'processed'
                  ? '暂无已处理的签到异常申请'
                  : '暂无签到异常申请'}
              </Text>
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
    backgroundColor: '#F5F5F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeFilterTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4A90E2',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterTabText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  listContainer: {
    padding: 12,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 6,
  },
  taskName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  reasonContainer: {
    marginBottom: 12,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginLeft: 22,
  },
  proofContainer: {
    marginBottom: 12,
  },
  proofHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  proofLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
    flex: 1,
  },
  expandText: {
    fontSize: 12,
    color: '#4A90E2',
  },
  imagesContainer: {
    marginLeft: 22,
  },
  proofImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  processingInfo: {
    marginTop: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  processingText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
