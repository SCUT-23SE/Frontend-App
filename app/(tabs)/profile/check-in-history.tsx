import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MapPin, Camera, Wifi } from 'lucide-react-native';
import { checkInService } from '@/services/tasks-service';
import type { CheckinRecord } from '@/gen/models';
import { formatUnixTimestamp } from '@/utils/date';

export default function CheckInHistoryScreen() {
  const [history, setHistory] = useState<CheckinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await checkInService.getHistory();
      if (response.success && response.data) {
        setHistory(response.data);
      } else {
        setError(response.error || '获取签到历史失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const renderRecord = ({ item }: { item: CheckinRecord }) => (
    <TouchableOpacity
      style={styles.recordCard}
      onPress={() =>
        router.push(`/profile/check-in-detail?id=${item.recordId}`)
      }
    >
      <View style={styles.recordHeader}>
        <Text style={styles.taskTitle} numberOfLines={1} ellipsizeMode="tail">
          {item.taskName}
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>签到成功</Text>
        </View>
      </View>

      <View style={styles.infoBlock}>
        <View style={styles.infoItem}>
          <Text style={styles.label}>所属组织：</Text>
          <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
            {item.groupName}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>签到时间：</Text>
          <Text style={styles.value}>
            {item.signedTime ? formatUnixTimestamp(item.signedTime) : '未知'}
          </Text>
        </View>
      </View>

      <View style={styles.requirementsList}>
        {item.checkinMethods.gps && (
          <View style={styles.requirementItem}>
            <MapPin size={18} color="#4A90E2" />
            <Text style={styles.requirementText}>位置</Text>
          </View>
        )}
        {item.checkinMethods.face && (
          <View style={styles.requirementItem}>
            <Camera size={18} color="#4A90E2" />
            <Text style={styles.requirementText}>人脸</Text>
          </View>
        )}
        {item.checkinMethods.wifi && (
          <View style={styles.requirementItem}>
            <Wifi size={18} color="#4A90E2" />
            <Text style={styles.requirementText}>WiFi</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchHistory}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        renderItem={renderRecord}
        keyExtractor={(item) => item.recordId.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchHistory} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无签到记录</Text>
            </View>
          ) : null
        }
      />

      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      )}
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
  },
  recordCard: {
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
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginBottom: 2,
    paddingRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
    backgroundColor: '#4CAF50',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  infoBlock: {
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    marginLeft: 4,
  },
  requirementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 13,
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
