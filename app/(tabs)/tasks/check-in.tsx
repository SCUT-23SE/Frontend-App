import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  MapPin,
  Camera,
  Wifi,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react-native';
import { useTasksStore } from '@/stores/tasks';

// 辅助函数：渲染验证项
const VerificationItem = ({
  icon: Icon,
  title,
  description,
  status,
  onVerify,
  reason,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  status: 'idle' | 'verifying' | 'success' | 'failed';
  onVerify: () => void;
  reason?: string;
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return <Loader2 size={20} color="#FF9800" />; // 使用 Loader2 表示验证中
      case 'success':
        return <CheckCircle2 size={20} color="#4CAF50" />;
      case 'failed':
        return <XCircle size={20} color="#F44336" />;
      default: // idle
        return <AlertCircle size={20} color="#999" />;
    }
  };

  return (
    <View style={styles.requirementItem}>
      <Icon size={24} color="#4A90E2" />
      <View style={styles.requirementInfo}>
        <Text style={styles.requirementTitle}>{title}</Text>
        <Text style={styles.requirementDescription}>{description}</Text>
        {status === 'failed' && reason && (
          <Text style={styles.errorText}>{reason}</Text>
        )}
      </View>
      <TouchableOpacity
        onPress={onVerify}
        disabled={status === 'verifying' || status === 'success'}
        style={styles.verifyButton}
      >
        <View style={styles.statusIconContainer}>{getStatusIcon()}</View>
        <Text style={styles.verifyButtonText}>
          {status === 'idle' && '开始验证'}
          {status === 'verifying' && '验证中...'}
          {status === 'success' && '验证成功'}
          {status === 'failed' && '重新验证'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function CheckInScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const {
    currentTask,
    currentTaskLoading,
    verification,
    submission,
    verifyGps,
    verifyFace,
    verifyWifi,
    submitFinalCheckIn,
    resetSubmissionState,
  } = useTasksStore();

  const taskId = currentTask?.id;

  // 处理验证逻辑
  const handleVerifyGps = async () => {
    if (!taskId) return;
    // TODO: 实际获取 GPS 位置信息
    const mockLocation = { latitude: 31.2304, longitude: 121.4737 };
    await verifyGps(taskId, mockLocation);
  };

  const handleVerifyFace = async () => {
    if (!taskId) return;
    // TODO: 实际获取人脸数据
    const mockFaceData = 'mock-face-data-' + Date.now();
    await verifyFace(taskId, mockFaceData);
  };

  const handleVerifyWifi = async () => {
    if (!taskId) return;
    // TODO: 实际获取 WiFi 信息
    const mockWifiInfo = { ssid: 'Lab_WiFi', bssid: '00:11:22:33:44:55' };
    await verifyWifi(taskId, mockWifiInfo);
  };

  // 检查所有必需的验证是否完成
  const canSubmit = () => {
    if (!currentTask) return false;
    const requiredTypes = currentTask.type;
    const { gps, face, wifi } = verification;

    if (requiredTypes.gps && gps.status !== 'success') return false;
    if (requiredTypes.face && face.status !== 'success') return false;
    if (requiredTypes.wifi && wifi.status !== 'success') return false;

    return true;
  };

  // 处理最终提交
  const handleFinalSubmit = async () => {
    if (!taskId) return;
    await submitFinalCheckIn(
      taskId,
      currentTask?.group ? Number(currentTask.group) : undefined
    );
    // 提交后导航到结果页或显示反馈
  };

  // 监听提交状态变化
  useEffect(() => {
    if (submission.status === 'success') {
      Alert.alert('签到成功', submission.message, [
        {
          text: '确定',
          onPress: () => {
            router.back();
            resetSubmissionState();
          },
        },
      ]);
    } else if (submission.status === 'failed') {
      Alert.alert('签到失败', submission.error, [
        { text: '确定', onPress: resetSubmissionState },
      ]);
    }
  }, [
    submission.status,
    submission.message,
    submission.error,
    router,
    resetSubmissionState,
  ]);

  if (currentTaskLoading || !currentTask) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>开始签到</Text>
        <Text style={styles.subtitle}>{currentTask.title}</Text>

        <View style={styles.requirementsList}>
          {currentTask.type.gps && (
            <VerificationItem
              icon={MapPin}
              title="位置签到"
              description="验证当前位置是否在指定范围内"
              status={verification.gps.status}
              reason={verification.gps.reason}
              onVerify={handleVerifyGps}
            />
          )}
          {currentTask.type.face && (
            <VerificationItem
              icon={Camera}
              title="人脸识别"
              description="进行人脸识别验证"
              status={verification.face.status}
              reason={verification.face.reason}
              onVerify={handleVerifyFace}
            />
          )}
          {currentTask.type.wifi && (
            <VerificationItem
              icon={Wifi}
              title="WiFi验证"
              description="验证是否连接到指定WiFi网络"
              status={verification.wifi.status}
              reason={verification.wifi.reason}
              onVerify={handleVerifyWifi}
            />
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            (!canSubmit() || submission.status === 'submitting') &&
              styles.buttonDisabled,
          ]}
          onPress={handleFinalSubmit}
          disabled={!canSubmit() || submission.status === 'submitting'}
        >
          <Text style={styles.buttonText}>
            {submission.status === 'submitting' ? '提交中...' : '完成签到'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  requirementsList: {
    marginTop: 20,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F8FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  requirementInfo: {
    marginLeft: 16,
    flex: 1,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  requirementDescription: {
    fontSize: 14,
    color: '#666',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E7F0FD', // 轻微背景色
    marginLeft: 10,
  },
  verifyButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6, // 图标和文字间距
  },
  statusIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: '#a0c7f0', // 禁用时颜色变浅
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
