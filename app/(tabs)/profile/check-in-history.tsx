import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MapPin, Camera, Wifi } from 'lucide-react-native';
import { checkInService } from '@/services/tasks-service';
import type { CheckinRecord } from '@/gen/models';
import { formatUnixTimestamp } from '@/utils/date';

// --- Style Constants from tasks/index.tsx ---
const APP_BACKGROUND = '#F8F8FA';
const CARD_BACKGROUND = '#FFFFFF';
const PRIMARY_BLUE = '#007AFF';
const PRIMARY_TEXT_COLOR = '#1C1C1E';
const SECONDARY_TEXT_COLOR = '#8A8A8E';
const LIGHT_GRAY_BORDER = '#E5E5EA';
const ICON_BLUE = PRIMARY_BLUE;

// Badge Colors (Background, Text)
const BADGE_SUCCESS_BG = '#E6F7EA';
const BADGE_SUCCESS_TEXT = '#389E0D';
const BADGE_ERROR_BG = '#FFF1F0';
const BADGE_ERROR_TEXT = '#FF4D4F';
// const BADGE_INFO_BG = '#E0F2FF'; // Not directly used for "success only" history
// const BADGE_INFO_TEXT = PRIMARY_BLUE;

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
// const FONT_SIZE_XL = 17; // Not used in this screen based on current elements

const FONT_WEIGHT_REGULAR = '400';
const FONT_WEIGHT_MEDIUM = '500';
const FONT_WEIGHT_SEMIBOLD = '600';
// const FONT_WEIGHT_BOLD = '700'; // Not used
// --- End Style Constants ---

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

  // 初始加载
  useEffect(() => {
    fetchHistory();
  }, []);

  // 当页面重新获得焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
      return () => {
        // 在页面失去焦点时可以清理的相关操作
      };
    }, [])
  );

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
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: BADGE_SUCCESS_BG }, // Use constant
          ]}
        >
          <Text style={[styles.statusText, { color: BADGE_SUCCESS_TEXT }]}>
            签到成功
          </Text>
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

      {(item.checkinMethods?.gps ||
        item.checkinMethods?.face ||
        item.checkinMethods?.wifi) && (
        <View style={styles.requirementsList}>
          {item.checkinMethods.gps && (
            <View style={styles.requirementItem}>
              <MapPin size={16} color={ICON_BLUE} style={styles.iconStyle} />
              <Text style={styles.requirementText}>位置</Text>
            </View>
          )}
          {item.checkinMethods.face && (
            <View style={styles.requirementItem}>
              <Camera size={16} color={ICON_BLUE} style={styles.iconStyle} />
              <Text style={styles.requirementText}>人脸</Text>
            </View>
          )}
          {item.checkinMethods.wifi && (
            <View style={styles.requirementItem}>
              <Wifi size={16} color={ICON_BLUE} style={styles.iconStyle} />
              <Text style={styles.requirementText}>WiFi</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchHistory}>
          <Text style={styles.retryButtonText}>重试</Text>
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchHistory}
            colors={[PRIMARY_BLUE]} // Use constant
            tintColor={PRIMARY_BLUE} // Use constant
          />
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
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_BACKGROUND, // Use constant
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: PADDING_L, // Use constant
    backgroundColor: APP_BACKGROUND, // Use constant
  },
  listContainer: {
    padding: PADDING_L, // Use constant
  },
  recordCard: {
    backgroundColor: CARD_BACKGROUND, // Use constant
    borderRadius: CARD_BORDER_RADIUS, // Use constant
    padding: PADDING_L, // Use constant (was 16, PADDING_L is 16)
    marginBottom: MARGIN_L, // Use constant (was 12, MARGIN_L is 16)
    shadowColor: 'rgba(0, 0, 0, 0.1)', // Keep similar shadow or match index.tsx
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6, // Match index.tsx elevation
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Changed from flex-start to center for better badge alignment
    marginBottom: MARGIN_M, // Use constant (was 12)
  },
  taskTitle: {
    fontSize: FONT_SIZE_L, // Use constant (was 18)
    fontWeight: FONT_WEIGHT_SEMIBOLD, // Use constant (was '600')
    color: PRIMARY_TEXT_COLOR, // Use constant (was '#333')
    flex: 1,
    // marginBottom: 2, // Removed, handled by recordHeader marginBottom
    paddingRight: MARGIN_S, // Use constant for spacing (was 8)
  },
  statusBadge: {
    paddingHorizontal: PADDING_M, // Use constant (was 8)
    paddingVertical: PADDING_XS + 1, // Use constant (was 4)
    borderRadius: BADGE_PILL_RADIUS, // Use constant (was 4, for pill shape)
    // marginLeft: MARGIN_S, // Use constant (was 8), now handled by taskTitle paddingRight
    // backgroundColor is set inline
  },
  statusText: {
    fontSize: FONT_SIZE_S, // Use constant (was 12)
    fontWeight: FONT_WEIGHT_MEDIUM, // Use constant (was '500')
    // color is set inline
  },
  infoBlock: {
    marginBottom: MARGIN_M, // Use constant (was 12)
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center', // Added for better alignment if icons were present
    marginBottom: MARGIN_S, // Use constant (was 6)
  },
  label: {
    fontSize: FONT_SIZE_M, // Use constant (was 14)
    color: SECONDARY_TEXT_COLOR, // Use constant (was '#666')
    marginRight: PADDING_XS, // Added spacing
  },
  value: {
    fontSize: FONT_SIZE_M, // Use constant (was 14)
    color: PRIMARY_TEXT_COLOR, // Use constant (was '#333')
    fontWeight: FONT_WEIGHT_REGULAR, // Use constant (was '500')
    flex: 1,
    // marginLeft: 4, // Removed, handled by label marginRight
  },
  requirementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY_BORDER, // Use constant (was '#f0f0f0')
    paddingTop: MARGIN_M, // Use constant (was 12)
    alignItems: 'center',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#F5F8FF', // Removed background for cleaner look like index.tsx types
    paddingHorizontal: PADDING_S, // Reduced padding (was 12)
    paddingVertical: PADDING_XS, // Reduced padding (was 6)
    borderRadius: BADGE_PILL_RADIUS, // Use constant for consistency if needed (was 16)
    marginRight: MARGIN_M, // Use constant (was 10)
    marginBottom: PADDING_S, // Use constant (was 6)
    // Optional: Add a light border if no background feels too plain
    // borderWidth: 1,
    // borderColor: LIGHT_GRAY_BORDER,
  },
  iconStyle: {
    // Added for icons in requirementsList
    marginRight: PADDING_XS,
  },
  requirementText: {
    fontSize: FONT_SIZE_S, // Use constant (was 13)
    color: ICON_BLUE, // Use constant (was '#4A90E2')
    // marginLeft: 4, // Removed, iconStyle marginRight handles spacing
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PADDING_XL * 2, // Use constant (was 32)
    minHeight: 200, // Match index.tsx
  },
  emptyText: {
    fontSize: FONT_SIZE_M, // Use constant (was 16)
    color: SECONDARY_TEXT_COLOR, // Use constant (was '#999')
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Keep as is or use a constant if defined elsewhere
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FONT_SIZE_M, // Use constant (was 16)
    color: BADGE_ERROR_TEXT, // Use constant (was '#F44336')
    marginBottom: MARGIN_L, // Use constant (was 16)
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: PRIMARY_BLUE, // Use constant
    paddingVertical: PADDING_M - 2,
    paddingHorizontal: PADDING_L,
    borderRadius: PADDING_S,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: MARGIN_L,
  },
  retryButtonText: {
    color: CARD_BACKGROUND, // Use constant
    fontSize: FONT_SIZE_L, // Use constant (was 14)
    fontWeight: FONT_WEIGHT_MEDIUM, // Use constant (was '500')
  },
});
