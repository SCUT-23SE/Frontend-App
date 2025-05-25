import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNotificationStore } from '@/stores/notification';

interface NotificationPermissionProps {
  onGranted?: () => void;
}

/**
 * 通知权限请求组件
 * 可以放在设置页面或首次运行时的引导页面
 */
export const NotificationPermission: React.FC<NotificationPermissionProps> = ({
  onGranted,
}) => {
  const { permissionStatus, requestPermission } = useNotificationStore();

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (granted && onGranted) {
      onGranted();
    }
  }, [requestPermission, onGranted]);

  // 如果权限已被授予，不显示任何内容
  if (permissionStatus === 'granted') {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>打卡通知</Text>

      <Text style={styles.description}>
        启用通知，以便接收新任务提醒、任务开始通知和管理员操作通知。
      </Text>

      {permissionStatus === 'requesting' ? (
        <ActivityIndicator
          size="small"
          color="#007AFF"
          style={styles.spinner}
        />
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={handleRequestPermission}
          disabled={permissionStatus === 'requesting'}
        >
          <Text style={styles.buttonText}>
            {permissionStatus === 'denied' ? '重新请求权限' : '启用通知'}
          </Text>
        </TouchableOpacity>
      )}

      {permissionStatus === 'denied' && (
        <Text style={styles.hintText}>
          如果您已经拒绝了通知权限，可能需要在系统设置中手动开启。
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  spinner: {
    marginVertical: 10,
  },
  hintText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
