import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Modal,
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
  Smartphone,
  Map,
  X,
  ArrowUp,
} from 'lucide-react-native';
import { useTasksStore } from '@/stores/tasks';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import FaceRecognitionModal from '@/components/FaceRecognitionModal';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { getCurrentLocation, getLocationAddress } from '@/services/location';
import { MapView, Marker, Circle } from 'react-native-amap3d';
import { Platform as RenamePlatform } from 'react-native';
import { AMapSdk } from 'react-native-amap3d';
import Constants from 'expo-constants';

// 初始化高德地图SDK，使用app.json中的环境变量
const amapKey = Constants.expoConfig?.extra?.amap;
AMapSdk.init(
  RenamePlatform.select({
    android: amapKey?.android,
    ios: amapKey?.ios,
  })
);

// --- Style Constants ---
const APP_BACKGROUND = '#F8F8FA';
const CARD_BACKGROUND = '#FFFFFF';
const PRIMARY_BLUE = '#007AFF';
const PRIMARY_TEXT_COLOR = '#1C1C1E';
const SECONDARY_TEXT_COLOR = '#8A8A8E';
const LIGHT_GRAY_BORDER = '#E5E5EA';
const ICON_BLUE = PRIMARY_BLUE;

// Badge Colors
const BADGE_SUCCESS_BG = '#E6F7EA';
const BADGE_SUCCESS_TEXT = '#389E0D';
const BADGE_WARNING_BG = '#FFFBE6';
const BADGE_WARNING_TEXT = '#FA8C16';
const BADGE_ERROR_BG = '#FFF1F0';
const BADGE_ERROR_TEXT = '#FF4D4F';
const BADGE_INFO_BG = '#E0F2FF';
const BADGE_INFO_TEXT = PRIMARY_BLUE;
const BADGE_NEUTRAL_BG = '#F0F0F0'; // Added for consistency
const BADGE_NEUTRAL_TEXT = '#595959'; // Added for consistency

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
const MARGIN_XL = 20; // Added for consistency

const FONT_SIZE_S = 12;
const FONT_SIZE_M = 14;
const FONT_SIZE_L = 16;
const FONT_SIZE_XL = 18; // Adjusted for titles
const FONT_SIZE_XXL = 24; // For main page titles

const FONT_WEIGHT_REGULAR = '400';
const FONT_WEIGHT_MEDIUM = '500';
const FONT_WEIGHT_SEMIBOLD = '600';
const FONT_WEIGHT_BOLD = '700';
// --- End Style Constants ---

// Helper to get styles for verification status
const getVerificationStatusUIData = (
  status: 'idle' | 'verifying' | 'success' | 'failed'
) => {
  switch (status) {
    case 'verifying':
      return {
        backgroundColor: BADGE_WARNING_BG,
        textColor: BADGE_WARNING_TEXT,
        icon: (
          <Loader2
            size={18}
            color={BADGE_WARNING_TEXT}
            style={{ marginRight: PADDING_XS }}
          />
        ),
        text: '验证中...',
      };
    case 'success':
      return {
        backgroundColor: BADGE_SUCCESS_BG,
        textColor: BADGE_SUCCESS_TEXT,
        icon: (
          <CheckCircle2
            size={18}
            color={BADGE_SUCCESS_TEXT}
            style={{ marginRight: PADDING_XS }}
          />
        ),
        text: '已验证',
      };
    case 'failed':
      return {
        backgroundColor: BADGE_ERROR_BG,
        textColor: BADGE_ERROR_TEXT,
        icon: (
          <XCircle
            size={18}
            color={BADGE_ERROR_TEXT}
            style={{ marginRight: PADDING_XS }}
          />
        ),
        text: '重新验证',
      };
    default: // idle
      return {
        backgroundColor: BADGE_INFO_BG,
        textColor: BADGE_INFO_TEXT,
        icon: (
          <AlertCircle // Or a more action-oriented icon like ChevronRight
            size={18}
            color={BADGE_INFO_TEXT}
            style={{ marginRight: PADDING_XS }}
          />
        ),
        text: '开始验证',
      };
  }
};

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
  const statusUI = getVerificationStatusUIData(status);

  return (
    <View style={styles.requirementItem}>
      <View style={styles.requirementIconContainer}>
        <Icon size={24} color={ICON_BLUE} />
      </View>
      <View style={styles.requirementInfo}>
        <Text style={styles.requirementTitle}>{title}</Text>
        <Text style={styles.requirementDescription}>{description}</Text>
        {status === 'failed' && reason && (
          <Text style={styles.failedReasonText}>{reason}</Text>
        )}
      </View>
      <TouchableOpacity
        onPress={onVerify}
        disabled={status === 'verifying' || status === 'success'}
        style={[
          styles.verificationStatusTouchable,
          { backgroundColor: statusUI.backgroundColor },
        ]}
      >
        {statusUI.icon}
        <Text
          style={[styles.verificationStatusText, { color: statusUI.textColor }]}
        >
          {statusUI.text}
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
    verifyNfc,
  } = useTasksStore();

  const taskId = currentTask?.id;
  const [faceModalVisible, setFaceModalVisible] = useState(false);
  // 新增：存储任务位置的地址信息
  const [taskLocationAddress, setTaskLocationAddress] = useState<string>('');
  // 新增：位置地址加载状态
  const [addressLoading, setAddressLoading] = useState(false);
  // 新增：地图模态框状态
  const [mapModalVisible, setMapModalVisible] = useState(false);
  // 新增：当前位置状态
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // 使用 useCallback 包装 onClose 回调
  const handleCloseModal = useCallback(() => {
    setFaceModalVisible(false);
  }, []);

  // 使用 useCallback 包装 onCaptureImage 回调
  const handleCaptureImage = useCallback(
    async (imagesBase64: string[]) => {
      if (!taskId) return false;
      // 确保有5张照片
      if (imagesBase64.length !== 5) {
        console.warn(
          `handleCaptureImage received ${imagesBase64.length} images, expected 5.`
        );
        return false;
      }
      console.log(`准备发送${imagesBase64.length}张照片验证人脸`);
      try {
        // 直接传递图片数组给 verifyFace 方法
        await verifyFace(taskId, imagesBase64);
        const latestFaceStatus =
          useTasksStore.getState().verification.face.status;
        console.log(`人脸验证结果: ${latestFaceStatus}`);
        return latestFaceStatus === 'success';
      } catch (error) {
        console.error('人脸验证处理失败 (handleCaptureImage):', error);
        return false;
      }
    },
    [taskId, verifyFace]
  );

  // 使用 useCallback 包装 onVerificationComplete 回调
  const handleFaceVerificationComplete = useCallback((success: boolean) => {
    setFaceModalVisible(false);
    // 根据需要，可以在这里添加基于最终验证结果的额外逻辑
  }, []);

  // 新增：获取任务位置的地址信息
  const fetchTaskLocationAddress = async () => {
    if (currentTask?.location?.latitude && currentTask?.location?.longitude) {
      setAddressLoading(true);
      try {
        const address = await getLocationAddress(
          currentTask.location.latitude,
          currentTask.location.longitude
        );
        setTaskLocationAddress(address);
      } catch (error) {
        console.error('获取任务位置地址失败:', error);
        // 失败时使用经纬度作为地址
        setTaskLocationAddress(
          `${currentTask.location.latitude.toFixed(
            6
          )},${currentTask.location.longitude.toFixed(6)}`
        );
      } finally {
        setAddressLoading(false);
      }
    }
  };

  // 新增：获取当前位置
  const fetchCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (error) {
      console.error('获取当前位置失败:', error);
      Alert.alert('位置获取失败', '无法获取当前位置，请检查GPS是否开启。');
    }
  };

  // 新增：打开地图模态框
  const handleOpenMapModal = async () => {
    // 确保有当前位置
    if (!currentLocation) {
      await fetchCurrentLocation();
    }
    setMapModalVisible(true);
  };

  // 新增：关闭地图模态框
  const handleCloseMapModal = () => {
    setMapModalVisible(false);
  };

  // 任务加载完成后获取位置地址
  useEffect(() => {
    if (currentTask?.location) {
      fetchTaskLocationAddress();
      // 也获取一下当前位置
      fetchCurrentLocation();
    }
  }, [currentTask]);

  // 处理验证逻辑
  const handleVerifyGps = async () => {
    if (!taskId) return;

    try {
      // 首先检查位置服务是否可用
      const hasLocationServicesEnabled =
        await Location.hasServicesEnabledAsync();

      if (!hasLocationServicesEnabled) {
        Alert.alert('位置服务未启用', '请在系统设置中启用位置服务后重试。', [
          {
            text: '前往设置',
            onPress: () => {
              // 对于Android和iOS打开不同的设置页面
              if (Platform.OS === 'ios') {
                Linking.openURL('App-Prefs:Privacy&path=LOCATION');
              } else {
                Linking.openSettings();
              }
            },
          },
          { text: '取消', style: 'cancel' },
        ]);
        return;
      }

      // 请求位置权限
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          '权限被拒绝',
          '需要位置权限才能继续签到。可以在系统设置中启用位置权限。'
        );
        return;
      }

      // 使用高德地图定位服务获取位置
      const locationData = await getCurrentLocation();

      const location = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      };

      // 保存当前位置以供地图使用
      setCurrentLocation(location);

      // 调用验证方法
      await verifyGps(taskId, location);
    } catch (error: any) {
      console.error('获取位置失败:', error);
      Alert.alert('位置获取失败', '无法获取当前位置，请检查GPS是否开启。');
    }
  };

  const handleVerifyFace = async () => {
    if (!taskId) return;
    // 显示人脸识别模态框
    setFaceModalVisible(true);
  };

  const handleVerifyWifi = async () => {
    if (!taskId) return;

    try {
      // 获取当前网络状态
      const netInfo = await NetInfo.fetch();
      console.log('当前网络状态:', JSON.stringify(netInfo, null, 2));

      // 先检查网络是否可用
      if (!netInfo.isConnected) {
        Alert.alert('网络未连接', '请检查您的网络连接后重试。');
        return;
      }

      // 检查是否连接到 WiFi
      if (netInfo.type !== 'wifi') {
        Alert.alert(
          'WiFi 未连接',
          '请连接到指定的 WiFi 网络后重试。当前网络类型: ' + netInfo.type
        );
        return;
      }

      // 检查是否有WiFi详情
      if (!netInfo.details) {
        Alert.alert(
          'WiFi 信息不完整',
          '无法获取完整的WiFi信息，请确保已授予应用所需权限。'
        );
        return;
      }

      // 获取 WiFi 信息
      const wifiInfo = {
        ssid: netInfo.details.ssid || '',
        bssid: netInfo.details.bssid || '',
      };

      if (!wifiInfo.ssid && !wifiInfo.bssid) {
        Alert.alert(
          'WiFi 信息获取失败',
          '无法获取任何WiFi标识信息（SSID或BSSID）。请确保您的应用具有定位权限，并且您已在设置中启用了WiFi。'
        );
        return;
      }

      console.log('准备验证WiFi信息:', wifiInfo);

      try {
        // 调用验证方法
        await verifyWifi(taskId, wifiInfo);
        console.log('WiFi验证结果:', verification.wifi);
      } catch (verifyError: any) {
        console.error('WiFi验证API错误:', verifyError);
        Alert.alert(
          'WiFi 验证失败',
          `验证过程出错: ${verifyError.message || '未知错误'}`
        );
      }
    } catch (error: any) {
      console.error('WiFi信息获取错误:', error);
      Alert.alert(
        'WiFi 验证失败',
        `无法获取或处理WiFi信息: ${error.message || '未知错误'}`
      );
    }
  };

  const handleVerifyNfc = async () => {
    if (!taskId) return;

    // 添加超时控制 - 修复类型
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      // 检查设备是否支持 NFC
      const isSupported = await NfcManager.isSupported();
      if (!isSupported) {
        Alert.alert('不支持 NFC', '您的设备不支持 NFC 功能。');
        return;
      }

      // 启用 NFC 管理器
      await NfcManager.start();

      // 创建一个超时Promise
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('读取NFC超时，请确保NFC卡片紧贴手机'));
        }, 20000); // 20秒超时
      });

      Alert.alert(
        'NFC 验证',
        '请将 NFC 标签靠近手机背面',
        [{ text: '取消', onPress: () => NfcManager.cancelTechnologyRequest() }],
        { cancelable: false }
      );

      // 尝试多种NFC技术类型
      const tryNfcTech = async () => {
        try {
          // 首先尝试NfcA
          await NfcManager.requestTechnology(NfcTech.NfcA);
          return;
        } catch (techError) {
          console.log('NfcA技术类型不匹配，尝试其他类型');
          await NfcManager.cancelTechnologyRequest();
        }

        try {
          // 尝试IsoDep (常用于IC卡)
          await NfcManager.requestTechnology(NfcTech.IsoDep);
          return;
        } catch (isoDepError) {
          console.log('IsoDep技术类型不匹配，尝试其他类型');
          await NfcManager.cancelTechnologyRequest();
        }

        try {
          // 尝试MifareClassic (常用于门禁卡)
          await NfcManager.requestTechnology(NfcTech.MifareClassic);
          return;
        } catch (mifareError) {
          console.log('MifareClassic技术类型不匹配，尝试其他类型');
          await NfcManager.cancelTechnologyRequest();
        }

        try {
          // 尝试NfcB
          await NfcManager.requestTechnology(NfcTech.NfcB);
          return;
        } catch (nfcBError) {
          console.log('NfcB技术类型不匹配，尝试Ndef');
          await NfcManager.cancelTechnologyRequest();
        }

        try {
          // 尝试Ndef (最通用的格式)
          await NfcManager.requestTechnology(NfcTech.Ndef);
          return;
        } catch (ndefError) {
          console.log('所有NFC技术类型都不匹配');
          throw new Error('无法匹配NFC卡类型，请尝试其他NFC卡');
        }
      };

      // 使用Promise.race来处理超时
      await Promise.race([tryNfcTech(), timeout]);

      // 如果成功到达这里，清除超时
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // 获取 NFC 标签 ID
      const tag = await NfcManager.getTag();
      console.log('读取到NFC标签:', JSON.stringify(tag, null, 2));

      if (!tag) {
        throw new Error('无法读取NFC标签');
      }

      const nfcId = tag.id;
      if (!nfcId) {
        throw new Error('无法获取NFC标签ID');
      }

      console.log('成功读取NFC ID:', nfcId);

      // 清理 NFC 会话
      await NfcManager.cancelTechnologyRequest();

      // 调用验证方法
      await verifyNfc(taskId, nfcId);
    } catch (error: any) {
      console.error('NFC 验证失败:', error);
      Alert.alert(
        'NFC 验证失败',
        `错误: ${error.message || '无法读取NFC标签'}`
      );
    } finally {
      // 清除超时定时器
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // 确保清理 NFC 资源
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (cleanupError) {
        console.log('清理NFC资源时出错，可以忽略:', cleanupError);
      }
    }
  };

  // 检查所有必需的验证是否完成
  const canSubmit = () => {
    if (!currentTask) return false;
    const requiredTypes = currentTask.type;
    const { gps, face, wifi, nfc } = verification;

    if (requiredTypes.gps && gps.status !== 'success') return false;
    if (requiredTypes.face && face.status !== 'success') return false;
    if (requiredTypes.wifi && wifi.status !== 'success') return false;
    if (requiredTypes.nfc && nfc.status !== 'success') return false;

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
        <ActivityIndicator size="large" color={PRIMARY_BLUE} />
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
            <View>
              <VerificationItem
                icon={MapPin}
                title="位置签到"
                description="验证当前位置是否在指定范围内"
                status={verification.gps.status}
                reason={verification.gps.reason}
                onVerify={handleVerifyGps}
              />
              {currentTask.location && (
                <View style={styles.locationHintAndButtonContainer}>
                  <View style={styles.locationHintContainer}>
                    <MapPin
                      size={16}
                      color={SECONDARY_TEXT_COLOR}
                      style={{ marginRight: PADDING_XS }}
                    />
                    {addressLoading ? (
                      <ActivityIndicator size="small" color={PRIMARY_BLUE} />
                    ) : (
                      <Text style={styles.locationHintText} numberOfLines={2}>
                        你需要在
                        {taskLocationAddress
                          ? ` ${taskLocationAddress} `
                          : '指定位置'}
                        附近 {currentTask.location.radius || 100} 米内进行签到
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.inlineShowLocationButton}
                    onPress={handleOpenMapModal}
                  >
                    <Map
                      size={16}
                      color={PRIMARY_BLUE}
                      style={{ marginRight: PADDING_XS / 2 }}
                    />
                    <Text style={styles.inlineShowLocationButtonText}>
                      显示位置
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
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
            <View>
              <VerificationItem
                icon={Wifi}
                title="WiFi验证"
                description="验证是否连接到指定WiFi网络"
                status={verification.wifi.status}
                reason={verification.wifi.reason}
                onVerify={handleVerifyWifi}
              />
              {/* 添加WiFi连接提示 */}
              <View style={styles.locationHintAndButtonContainer}>
                <View style={styles.locationHintContainer}>
                  <Wifi
                    size={16}
                    color={SECONDARY_TEXT_COLOR}
                    style={{ marginRight: PADDING_XS }}
                  />
                  <Text style={styles.locationHintText} numberOfLines={1}>
                    你需要连接{' '}
                    {currentTask?.wifi?.ssid
                      ? `"${currentTask.wifi.ssid}"`
                      : '指定WiFi'}{' '}
                    网络
                  </Text>
                </View>
              </View>
            </View>
          )}
          {currentTask.type.nfc && (
            <VerificationItem
              icon={Smartphone}
              title="NFC验证"
              description="验证NFC标签"
              status={verification.nfc.status}
              reason={verification.nfc.reason}
              onVerify={handleVerifyNfc}
            />
          )}
        </View>

        {/* 显示定位地址信息 */}
        {verification.gps.status === 'success' &&
          verification.gps.data &&
          verification.gps.data.address && (
            <View style={styles.currentLocationInfoContainer}>
              <Text style={styles.currentLocationLabel}>当前位置:</Text>
              <Text style={styles.currentLocationText}>
                {verification.gps.data.address}
              </Text>
            </View>
          )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!canSubmit() || submission.status === 'submitting') &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleFinalSubmit}
          disabled={!canSubmit() || submission.status === 'submitting'}
        >
          <Text style={styles.submitButtonText}>
            {submission.status === 'submitting' ? '提交中...' : '完成签到'}
          </Text>
        </TouchableOpacity>
      </View>

      <FaceRecognitionModal
        visible={faceModalVisible}
        onClose={handleCloseModal}
        onVerificationComplete={handleFaceVerificationComplete}
        onCaptureImage={handleCaptureImage}
      />

      {/* 新增：显示位置地图模态框 */}
      <Modal
        visible={mapModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={handleCloseMapModal}
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>签到位置</Text>
            <TouchableOpacity
              onPress={handleCloseMapModal}
              style={styles.closeButton}
            >
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            {currentTask?.location && (
              <MapView
                style={styles.map}
                initialCameraPosition={{
                  target: {
                    latitude: currentTask.location.latitude,
                    longitude: currentTask.location.longitude,
                  },
                  zoom: 16,
                }}
              >
                {/* 目标位置标记 */}
                <Marker
                  position={{
                    latitude: currentTask.location.latitude,
                    longitude: currentTask.location.longitude,
                  }}
                />

                {/* 目标范围圈 */}
                <Circle
                  strokeWidth={1}
                  strokeColor="rgba(0, 120, 255, 0.8)"
                  fillColor="rgba(0, 120, 255, 0.2)"
                  radius={currentTask.location.radius || 100}
                  center={{
                    latitude: currentTask.location.latitude,
                    longitude: currentTask.location.longitude,
                  }}
                />

                {/* 当前位置标记 - 修改图标 */}
                {currentLocation && (
                  <Marker
                    position={{
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude,
                    }}
                  >
                    {/* 使用红色圆点作为当前位置图标 */}
                    <View
                      style={{
                        backgroundColor: BADGE_ERROR_TEXT,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: '#FFFFFF',
                      }}
                    />
                  </Marker>
                )}
              </MapView>
            )}
          </View>

          <View style={styles.mapLegend}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendMarker, { backgroundColor: '#3498db' }]}
              />
              <Text style={styles.legendText}>签到位置</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendMarker, { backgroundColor: '#e74c3c' }]}
              />
              <Text style={styles.legendText}>当前位置</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendCircle,
                  {
                    borderColor: 'rgba(0, 120, 255, 0.8)',
                    backgroundColor: 'rgba(0, 120, 255, 0.2)',
                  },
                ]}
              />
              <Text style={styles.legendText}>有效签到范围</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_BACKGROUND, // Use APP_BACKGROUND
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: APP_BACKGROUND,
  },
  content: {
    flex: 1,
    paddingHorizontal: PADDING_L, // 16
    paddingTop: PADDING_L, // 16
  },
  title: {
    fontSize: FONT_SIZE_XXL, // 24
    fontWeight: FONT_WEIGHT_BOLD,
    color: PRIMARY_TEXT_COLOR,
    marginBottom: MARGIN_S, // 8
  },
  subtitle: {
    fontSize: FONT_SIZE_L, // 16
    color: SECONDARY_TEXT_COLOR,
    marginBottom: MARGIN_L, // 16 (was 32)
  },
  requirementsList: {
    marginTop: MARGIN_M, // 12 (was 20)
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BACKGROUND, // White card
    padding: PADDING_L, // 16
    borderRadius: CARD_BORDER_RADIUS, // 12
    marginBottom: MARGIN_L, // 16
    shadowColor: 'rgba(0, 0, 0, 0.08)', // Softer shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5, // Android shadow
  },
  requirementIconContainer: {
    // If needed for spacing or background for icon
    marginRight: PADDING_M, // 12
  },
  requirementInfo: {
    flex: 1, // Takes available space
  },
  requirementTitle: {
    fontSize: FONT_SIZE_L, // 16 (was 16)
    fontWeight: FONT_WEIGHT_MEDIUM, // Was 500
    color: PRIMARY_TEXT_COLOR, // Was #333
    marginBottom: PADDING_XS, // 4
  },
  requirementDescription: {
    fontSize: FONT_SIZE_M, // 14
    color: SECONDARY_TEXT_COLOR, // Was #666
  },
  verificationStatusTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PADDING_M, // 12
    paddingVertical: PADDING_S, // 8
    borderRadius: BADGE_PILL_RADIUS, // 16
    marginLeft: PADDING_M, // 12, space from text info
    // backgroundColor is set dynamically
  },
  verificationStatusText: {
    fontSize: FONT_SIZE_S, // 12
    fontWeight: FONT_WEIGHT_MEDIUM, // 500
    // color is set dynamically
    marginLeft: PADDING_XS, // 4, if icon doesn't have its own marginRight
  },
  failedReasonText: {
    // Renamed from errorText for clarity
    fontSize: FONT_SIZE_S, // 12
    color: BADGE_ERROR_TEXT, // Was #F44336
    marginTop: PADDING_XS, // 4
  },
  footer: {
    padding: PADDING_L, // 16 (was 20)
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY_BORDER, // Was #eee
    backgroundColor: CARD_BACKGROUND, // White footer background
  },
  submitButton: {
    // Renamed from button
    backgroundColor: PRIMARY_BLUE, // Was #4A90E2
    borderRadius: CARD_BORDER_RADIUS, // 12 (was 8)
    paddingVertical: PADDING_M, // 12 (was 16) - adjust for better look
    alignItems: 'center',
    // Removed shadow from here, often better flat or on the footer
  },
  submitButtonDisabled: {
    // Renamed from buttonDisabled
    backgroundColor: `${PRIMARY_BLUE}99`, // Lighter blue or use a constant
    // opacity: 0.6, // Alternative
  },
  submitButtonText: {
    // Renamed from buttonText
    color: CARD_BACKGROUND, // Was #fff
    fontSize: FONT_SIZE_L, // 16
    fontWeight: FONT_WEIGHT_SEMIBOLD, // Was 600
  },
  currentLocationInfoContainer: {
    // Renamed from addressContainer
    marginTop: MARGIN_L, // 16 (was 24)
    padding: PADDING_L, // 16
    backgroundColor: BADGE_INFO_BG, // Was #F0F8FF, now consistent light blue
    borderRadius: CARD_BORDER_RADIUS, // 12 (was 8)
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_BLUE, // Was #4A90E2
  },
  currentLocationLabel: {
    // Renamed from addressLabel
    fontSize: FONT_SIZE_M, // 14
    fontWeight: FONT_WEIGHT_MEDIUM, // 500
    color: SECONDARY_TEXT_COLOR, // Was #666
    marginBottom: PADDING_XS, // 4
  },
  currentLocationText: {
    // Renamed from addressText
    fontSize: FONT_SIZE_M, // 15
    color: PRIMARY_TEXT_COLOR, // Was #333
  },
  locationHintAndButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: MARGIN_S, // 在 VerificationItem 下方留出间距
    marginBottom: MARGIN_M, // 如果后面还有其他项，也留些间距
    paddingHorizontal: PADDING_XS, // 轻微的水平内边距，以与卡片内容对齐
  },
  locationHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // 占据左侧大部分空间
    marginRight: PADDING_S, // 与右侧按钮的间距
  },
  locationHintText: {
    fontSize: FONT_SIZE_S, // 12px
    color: SECONDARY_TEXT_COLOR,
    flex: 1, // 允许文本换行
  },
  inlineShowLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: PADDING_XS,
    paddingHorizontal: PADDING_S,
    borderRadius: BADGE_PILL_RADIUS / 1.5, // 较小的圆角
    // backgroundColor: BADGE_INFO_BG, // 可选：给予轻微背景色
  },
  inlineShowLocationButtonText: {
    fontSize: FONT_SIZE_S, // 12px
    color: PRIMARY_BLUE,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: PADDING_L,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY_BORDER,
    backgroundColor: CARD_BACKGROUND,
  },
  mapTitle: {
    fontSize: FONT_SIZE_XL,
    fontWeight: FONT_WEIGHT_BOLD,
    color: PRIMARY_TEXT_COLOR,
  },
  closeButton: {
    padding: PADDING_S,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLegend: {
    backgroundColor: CARD_BACKGROUND,
    padding: PADDING_L,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY_BORDER,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: PADDING_S,
  },
  legendMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: PADDING_M,
  },
  legendCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: PADDING_M,
  },
  legendText: {
    fontSize: FONT_SIZE_M,
    color: PRIMARY_TEXT_COLOR,
  },
});
