import { useEffect, useState, Fragment, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  MapPin,
  Camera,
  Wifi,
  CircleCheck as CheckCircle2,
  CircleAlert as AlertCircle,
  AlertTriangle,
  Smartphone,
  Map,
  X,
  CheckCircle,
} from 'lucide-react-native';
import { useAdminTasksStore } from '@/stores/admin-tasks';
import { formatDate } from '@/utils/date';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { getCurrentLocation, getLocationAddress } from '@/services/location';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { MapView, Marker } from 'react-native-amap3d';

// --- Style Constants (Copied from tasks/index.tsx and adjusted) ---
const APP_BACKGROUND = '#F8F8FA';
const CARD_BACKGROUND = '#FFFFFF';
const PRIMARY_BLUE = '#007AFF';
const PRIMARY_TEXT_COLOR = '#1C1C1E';
const SECONDARY_TEXT_COLOR = '#8A8A8E';
const LIGHT_GRAY_BORDER = '#E5E5EA';
const ICON_BLUE = PRIMARY_BLUE;

const BADGE_INFO_BG = '#EBF4FF';
const BADGE_WARNING_BG = '#FFFBE6';
const BADGE_WARNING_TEXT = '#FA8C16';
const BADGE_ERROR_BG = '#FFF1F0';
const BADGE_ERROR_TEXT = '#FF4D4F';

const CARD_BORDER_RADIUS = 12;
const INPUT_BORDER_RADIUS = 8;

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
const FONT_SIZE_XL = 17;

const FONT_WEIGHT_REGULAR = '400';
const FONT_WEIGHT_MEDIUM = '500';
const FONT_WEIGHT_SEMIBOLD = '600';
// --- End Style Constants ---

export default function TaskFormScreen() {
  const { groupId, taskId, copyFrom } = useLocalSearchParams();
  const router = useRouter();
  const {
    currentTask,
    currentTaskLoading,
    currentTaskError,
    operationStatus,
    fetchTaskDetail,
    createTask,
    updateTask,
    resetOperationStatus,
  } = useAdminTasksStore();

  // 表单状态
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setSeconds(now.getSeconds() + 60);
    return now;
  });
  const [endTime, setEndTime] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now;
  });
  const [description, setDescription] = useState('');

  // 验证方式状态
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [faceEnabled, setFaceEnabled] = useState(false);
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [nfcEnabled, setNfcEnabled] = useState(false);

  // GPS配置
  const [location, setLocation] = useState({
    latitude: 31.2304,
    longitude: 121.4737,
    radius: 100,
  });

  // 位置地址信息
  const [locationAddress, setLocationAddress] = useState<string>('');

  // WiFi配置
  const [wifiConfig, setWifiConfig] = useState({
    ssid: '',
    bssid: '',
  });

  // NFC配置
  const [nfcTagId, setNfcTagId] = useState<string>('');
  const [nfcScanning, setNfcScanning] = useState(false);

  // 日期时间选择器状态
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  // 添加Android平台下的DateTimePicker模式状态
  const [androidPickerMode, setAndroidPickerMode] = useState<'date' | 'time'>(
    'date'
  );
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | 'datetime'>(
    'datetime'
  );
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(null);

  // 新增：控制表单是否可编辑的状态
  const [isEditable, setIsEditable] = useState(true);
  // 新增：位置获取状态
  const [locationLoading, setLocationLoading] = useState(false);
  // 新增：WiFi扫描状态
  const [wifiLoading, setWifiLoading] = useState(false);

  // 新增：地图选点相关状态
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempLocation, setTempLocation] = useState({
    latitude: 31.2304,
    longitude: 121.4737,
  });
  const [mapDragging, setMapDragging] = useState(false);

  // 新增：修复安卓时间选择器重复弹出的标志位
  const [justCompletedStartTimeSelection, setJustCompletedStartTimeSelection] =
    useState(false);
  const [justCompletedEndTimeSelection, setJustCompletedEndTimeSelection] =
    useState(false);

  // 在组件顶部添加地图引用
  const mapRef = useRef<any>(null);

  // 加载任务数据
  useEffect(() => {
    // 确定要获取详情的 ID
    const idToFetch =
      typeof taskId === 'string'
        ? taskId
        : typeof copyFrom === 'string'
        ? copyFrom
        : null;
    if (idToFetch) {
      fetchTaskDetail(idToFetch);
    }
    return () => {
      resetOperationStatus();
    };
  }, [taskId, copyFrom]); // Keep dependencies as they trigger the effect correctly

  // 新增：进入表单时立即获取当前位置
  useEffect(() => {
    // 仅在新建任务时自动获取位置（没有taskId和copyFrom时）
    if (!taskId && !copyFrom) {
      // 如果是新建任务，自动获取当前位置
      getCurrentLocationAndAddress();
    }
  }, []);

  // 填充表单数据 & 检查是否可编辑 (仅在编辑模式下)
  useEffect(() => {
    if (currentTask) {
      setTitle(copyFrom ? `${currentTask.title} (复制)` : currentTask.title);
      const taskStartTime = new Date(currentTask.startTime);
      setStartTime(taskStartTime);
      setEndTime(new Date(currentTask.endTime));
      setDescription(currentTask.description || '');

      setGpsEnabled(currentTask.type.gps);
      setFaceEnabled(currentTask.type.face);
      setWifiEnabled(currentTask.type.wifi);
      setNfcEnabled(currentTask.type.nfc);

      if (currentTask.location) {
        setLocation({
          latitude: currentTask.location.latitude || 0,
          longitude: currentTask.location.longitude || 0,
          radius: currentTask.location.radius || 100,
        });

        // 尝试获取地址信息
        if (currentTask.location.latitude && currentTask.location.longitude) {
          getLocationAddress(
            currentTask.location.latitude,
            currentTask.location.longitude
          )
            .then((address) => {
              if (address) {
                setLocationAddress(address);
              }
            })
            .catch((err) => console.error('获取地址信息失败:', err));
        }
      }

      if (currentTask.wifi) {
        setWifiConfig(currentTask.wifi);
      }

      // 如果是编辑任务 (taskId存在) 且任务已开始，则设为不可编辑
      if (taskId && taskStartTime.getTime() <= Date.now()) {
        setIsEditable(false);
      } else {
        setIsEditable(true); // 否则确保可编辑 (用于复制或新任务)
      }
    }
  }, [currentTask, copyFrom, taskId]);

  const handleStartTimeChange = (
    event: any, // DateTimePickerEvent
    selectedDate?: Date
  ) => {
    const { type } = event; // event.type can be 'set' or 'dismissed'

    if (Platform.OS === 'android') {
      if (type === 'dismissed') {
        setShowStartPicker(false);
        // If user dismissed during time selection, reset to date mode.
        if (androidPickerMode === 'time') {
          setAndroidPickerMode('date');
          setTempSelectedDate(null);
        }
        // Do not reset justCompletedStartTimeSelection if it was true,
        // as this dismissal might be part of programmatic hiding after completion.
        return;
      }

      if (type === 'set') {
        if (!selectedDate) {
          // Should not happen if type is 'set', but as a safeguard
          setShowStartPicker(false);
          setAndroidPickerMode('date');
          setTempSelectedDate(null);
          setJustCompletedStartTimeSelection(false);
          return;
        }

        if (androidPickerMode === 'date') {
          // Currently in date selection phase
          if (justCompletedStartTimeSelection) {
            // This is a "ghost" set event after a full date-time cycle.
            // Consume the flag and do nothing else.
            setJustCompletedStartTimeSelection(false);
            // setShowStartPicker(false); // Picker should already be hidden or hiding.
            return;
          } else {
            // Genuine date selection, proceed to time selection
            const tempDate = new Date(selectedDate);
            tempDate.setHours(startTime.getHours());
            tempDate.setMinutes(startTime.getMinutes());

            setShowStartPicker(false); // Hide date picker first
            setTempSelectedDate(tempDate);

            setTimeout(() => {
              setAndroidPickerMode('time'); // Switch to time mode
              setShowStartPicker(true); // Show time picker
            }, 50); // Small delay
            return;
          }
        } else if (androidPickerMode === 'time') {
          // Currently in time selection phase
          if (tempSelectedDate) {
            const finalDate = new Date(tempSelectedDate);
            finalDate.setHours(selectedDate.getHours());
            finalDate.setMinutes(selectedDate.getMinutes());

            setStartTime(finalDate);
            if (finalDate > endTime) {
              setEndTime(finalDate);
            }
            setShowStartPicker(false); // Hide time picker

            setTimeout(() => {
              setAndroidPickerMode('date'); // Reset mode for next time
              setTempSelectedDate(null);
              setJustCompletedStartTimeSelection(true); // Mark completion
            }, 50);
            return;
          } else {
            // Error state: time mode but no tempSelectedDate. Reset.
            setShowStartPicker(false);
            setAndroidPickerMode('date');
            setTempSelectedDate(null);
            setJustCompletedStartTimeSelection(false);
            return;
          }
        }
      }
      // Fallback for other event types or unexpected states (though 'set' and 'dismissed' cover most)
      setShowStartPicker(false);
      setAndroidPickerMode('date');
      setTempSelectedDate(null);
      // If justCompletedStartTimeSelection was true and we land here, something is unusual.
      // Reset it to prevent it from getting stuck.
      if (justCompletedStartTimeSelection) {
        setJustCompletedStartTimeSelection(false);
      }
      return;
    } else {
      // iOS logic remains unchanged
      setShowStartPicker(false);
      if (selectedDate) {
        setStartTime(selectedDate);
        if (selectedDate > endTime) {
          setEndTime(selectedDate);
        }
      }
    }
  };

  const handleEndTimeChange = (
    event: any, // DateTimePickerEvent
    selectedDate?: Date
  ) => {
    const { type } = event;

    if (Platform.OS === 'android') {
      if (type === 'dismissed') {
        setShowEndPicker(false);
        if (androidPickerMode === 'time') {
          setAndroidPickerMode('date');
          setTempSelectedDate(null);
        }
        // Do not reset justCompletedEndTimeSelection if it was true
        return;
      }

      if (type === 'set') {
        if (!selectedDate) {
          setShowEndPicker(false);
          setAndroidPickerMode('date');
          setTempSelectedDate(null);
          setJustCompletedEndTimeSelection(false);
          return;
        }

        if (androidPickerMode === 'date') {
          if (justCompletedEndTimeSelection) {
            setJustCompletedEndTimeSelection(false);
            // setShowEndPicker(false);
            return;
          } else {
            const tempDate = new Date(selectedDate);
            tempDate.setHours(endTime.getHours());
            tempDate.setMinutes(endTime.getMinutes());
            setShowEndPicker(false);
            setTempSelectedDate(tempDate);
            setTimeout(() => {
              setAndroidPickerMode('time');
              setShowEndPicker(true);
            }, 50);
            return;
          }
        } else if (androidPickerMode === 'time') {
          if (tempSelectedDate) {
            const finalDate = new Date(tempSelectedDate);
            finalDate.setHours(selectedDate.getHours());
            finalDate.setMinutes(selectedDate.getMinutes());

            if (finalDate < startTime) {
              Alert.alert('错误', '结束时间不能早于开始时间');
              setShowEndPicker(false); // Hide picker
              // Reset android picker state carefully
              setTimeout(() => {
                setAndroidPickerMode('date');
                setTempSelectedDate(null);
                // Do not set justCompletedEndTimeSelection to true here after an error
                setJustCompletedEndTimeSelection(false);
              }, 50);
              return;
            }

            setEndTime(finalDate);
            setShowEndPicker(false);
            setTimeout(() => {
              setAndroidPickerMode('date');
              setTempSelectedDate(null);
              setJustCompletedEndTimeSelection(true); // Mark completion
            }, 50);
            return;
          } else {
            setShowEndPicker(false);
            setAndroidPickerMode('date');
            setTempSelectedDate(null);
            setJustCompletedEndTimeSelection(false);
            return;
          }
        }
      }
      setShowEndPicker(false);
      setAndroidPickerMode('date');
      setTempSelectedDate(null);
      if (justCompletedEndTimeSelection) {
        setJustCompletedEndTimeSelection(false);
      }
      return;
    } else {
      // iOS
      setShowEndPicker(false);
      if (selectedDate) {
        if (selectedDate < startTime) {
          Alert.alert('错误', '结束时间不能早于开始时间');
          return;
        }
        setEndTime(selectedDate);
      }
    }
  };

  // 新增：获取当前位置和地址的统一函数
  const getCurrentLocationAndAddress = async () => {
    if (!isEditable) return; // 不可编辑时阻止操作

    setLocationLoading(true);
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
        setLocationLoading(false);
        return;
      }

      // 请求位置权限
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          '权限被拒绝',
          '需要位置权限才能获取当前位置。可以在系统设置中启用位置权限。'
        );
        setLocationLoading(false);
        return;
      }

      // 使用高德地图定位服务获取位置
      const locationData = await getCurrentLocation();

      // 更新位置数据，保持原有的半径值
      setLocation({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        radius: location.radius, // 保持原有的半径值
      });

      // 设置地址信息
      if (locationData.address) {
        setLocationAddress(locationData.address);
      }

      return true; // 成功获取位置
    } catch (error) {
      console.error('获取位置失败:', error);
      return false; // 获取位置失败
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationSelect = async () => {
    const success = await getCurrentLocationAndAddress();
    if (success) {
      Alert.alert('成功', '已获取当前位置作为签到点');
    } else {
      // 为用户提供手动输入坐标的选项
      Alert.alert(
        '位置获取失败',
        '无法自动获取当前位置。您可以选择手动输入坐标。',
        [
          {
            text: '手动输入坐标',
            onPress: () => {
              Alert.prompt(
                '输入坐标',
                '请输入纬度和经度，用逗号分隔 (例如: 31.2304, 121.4737)',
                [
                  {
                    text: '取消',
                    style: 'cancel',
                  },
                  {
                    text: '确定',
                    onPress: (coordinates) => {
                      if (coordinates) {
                        try {
                          const [latStr, lngStr] = coordinates.split(',');
                          const lat = parseFloat(latStr.trim());
                          const lng = parseFloat(lngStr.trim());

                          if (!isNaN(lat) && !isNaN(lng)) {
                            setLocation({
                              latitude: lat,
                              longitude: lng,
                              radius: location.radius,
                            });
                            // 清空地址信息，因为手动输入坐标无法获取地址
                            setLocationAddress('');

                            // 尝试根据手动输入的坐标获取地址
                            getLocationAddress(lat, lng)
                              .then((address) => {
                                if (address) {
                                  setLocationAddress(address);
                                }
                              })
                              .catch((err) =>
                                console.error('获取地址信息失败:', err)
                              );

                            Alert.alert('成功', '已手动设置位置坐标');
                          } else {
                            Alert.alert('格式错误', '请输入有效的坐标格式');
                          }
                        } catch (e) {
                          Alert.alert('格式错误', '请输入有效的坐标格式');
                        }
                      }
                    },
                  },
                ],
                'plain-text',
                `${location.latitude}, ${location.longitude}`
              );
            },
          },
          {
            text: '前往设置',
            onPress: () => Linking.openSettings(),
          },
          { text: '取消', style: 'cancel' },
        ]
      );
    }
  };

  const handleWifiScan = async () => {
    if (!isEditable) return; // 不可编辑时阻止操作

    setWifiLoading(true);
    try {
      // 获取当前网络状态
      const netInfo = await NetInfo.fetch();
      console.log('WiFi扫描 - 网络状态:', JSON.stringify(netInfo, null, 2));

      // 检查网络是否连接
      if (!netInfo.isConnected) {
        Alert.alert('网络未连接', '请确保设备已连接到网络。');
        return;
      }

      // 检查是否连接到WiFi
      if (netInfo.type !== 'wifi') {
        Alert.alert(
          'WiFi未连接',
          '请连接到要用于签到的WiFi网络后重试。当前网络类型: ' + netInfo.type
        );
        return;
      }

      // 检查WiFi详情是否可用
      if (!netInfo.details) {
        Alert.alert(
          'WiFi信息不完整',
          '无法获取WiFi详细信息，请确保已授予应用所需权限。'
        );
        return;
      }

      // 获取WiFi信息
      const ssid = netInfo.details.ssid || '';
      const bssid = netInfo.details.bssid || '';

      console.log('扫描到的WiFi信息:', { ssid, bssid });

      if (!ssid && !bssid) {
        Alert.alert(
          'WiFi信息获取失败',
          '无法获取WiFi名称和BSSID。在Android 9+设备上，可能需要位置权限才能获取完整WiFi信息。',
          [
            {
              text: '手动输入',
              onPress: () => {
                // 提供手动输入表单
                Alert.prompt(
                  '手动输入WiFi信息',
                  '请输入WiFi名称（SSID）',
                  [
                    { text: '取消', style: 'cancel' },
                    {
                      text: '确定',
                      onPress: (inputSsid) => {
                        if (inputSsid) {
                          // 设置手动输入的SSID，保留原有的BSSID
                          setWifiConfig({
                            ssid: inputSsid,
                            bssid: wifiConfig.bssid,
                          });
                        }
                      },
                    },
                  ],
                  'plain-text',
                  wifiConfig.ssid
                );
              },
            },
            {
              text: '前往设置',
              onPress: () => Linking.openSettings(),
            },
            { text: '取消', style: 'cancel' },
          ]
        );
        return;
      }

      // 更新WiFi配置 - 确保值不为空
      const updatedConfig = {
        ssid: ssid || wifiConfig.ssid || '',
        bssid: bssid || wifiConfig.bssid || '',
      };

      setWifiConfig(updatedConfig);

      // 显示成功信息，并明确显示获取到的值
      Alert.alert(
        'WiFi信息获取成功',
        `SSID: ${updatedConfig.ssid || '(未获取到)'}\nBSSID: ${
          updatedConfig.bssid || '(未获取到)'
        }`,
        [
          {
            text: '确定',
            onPress: () => {
              // 如果没有获取到完整信息，提示用户可能需要手动补充
              if (!updatedConfig.ssid || !updatedConfig.bssid) {
                setTimeout(() => {
                  Alert.alert(
                    '注意',
                    '部分WiFi信息未获取到，您可以在表单中手动补充缺失的信息。',
                    [{ text: '知道了' }]
                  );
                }, 500);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('WiFi扫描错误:', error);
      Alert.alert(
        'WiFi扫描失败',
        '获取WiFi信息时发生错误，您可以尝试手动输入WiFi信息。'
      );
    } finally {
      setWifiLoading(false);
    }
  };

  const handleScanNfc = async () => {
    if (!isEditable) return; // 不可编辑时阻止操作

    try {
      // 检查设备是否支持 NFC
      const isSupported = await NfcManager.isSupported();
      if (!isSupported) {
        Alert.alert('不支持 NFC', '您的设备不支持 NFC 功能。');
        return;
      }

      // 启用 NFC 管理器
      await NfcManager.start();
      setNfcScanning(true);

      Alert.alert(
        'NFC 扫描',
        '请将 NFC 标签靠近手机背面',
        [{ text: '取消', onPress: () => NfcManager.cancelTechnologyRequest() }],
        { cancelable: false }
      );

      // 请求 NFC 会话
      await NfcManager.requestTechnology(NfcTech.NfcA);

      // 获取 NFC 标签 ID
      const tag = await NfcManager.getTag();
      if (!tag) {
        throw new Error('无法读取NFC标签');
      }
      const tagId = tag.id;

      // 保存NFC标签ID
      setNfcTagId(tagId || ''); // 确保tagId不为undefined
      Alert.alert('成功', `已获取NFC标签ID: ${tagId || '未知'}`);
    } catch (error) {
      console.error('NFC 扫描失败:', error);
      Alert.alert('NFC 扫描失败', '无法读取 NFC 标签。');
    } finally {
      // 确保清理 NFC 资源
      NfcManager.cancelTechnologyRequest().catch(() => {});
      setNfcScanning(false);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('错误', '请输入任务名称');
      return false;
    }

    // 验证开始时间是否大于当前时间
    const now = new Date();
    if (startTime <= now) {
      Alert.alert('错误', '开始时间必须大于当前时间');
      return false;
    }

    if (startTime >= endTime) {
      Alert.alert('错误', '结束时间必须晚于开始时间');
      return false;
    }
    if (
      gpsEnabled &&
      (!location?.latitude || !location?.longitude || !location?.radius)
    ) {
      Alert.alert('错误', '请完善GPS签到配置');
      return false;
    }

    // 改进WiFi验证逻辑，确保至少有一个有效的标识符
    if (wifiEnabled) {
      if (!wifiConfig.ssid.trim() && !wifiConfig.bssid.trim()) {
        Alert.alert('错误', '请至少提供WiFi的SSID或BSSID其中之一');
        return false;
      }
    }

    // 如果启用了NFC验证但没有设置标签ID
    if (nfcEnabled && !nfcTagId) {
      Alert.alert('错误', '请扫描NFC标签以获取标签ID');
      return false;
    }

    // 如果是编辑模式且不可编辑，阻止提交 (虽然按钮已禁用，双重保险)
    if (taskId && !isEditable) {
      Alert.alert('提示', '任务已开始，无法修改');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    // 如果不可编辑，直接返回
    if (!isEditable) {
      Alert.alert('提示', '任务已开始，无法修改');
      return;
    }
    if (!validateForm()) return;

    // 修改这部分逻辑，确保WiFi配置在保存前是有效的
    const wifiConfigToSave = wifiEnabled
      ? {
          ssid: wifiConfig.ssid.trim(),
          bssid: wifiConfig.bssid.trim(),
        }
      : undefined;

    const taskData = {
      title,
      groupId: groupId as string,
      startTime: formatDate(startTime),
      endTime: formatDate(endTime),
      description: description || ' ', // 确保description字段不为空，如果用户未输入则提供一个空格
      type: {
        gps: gpsEnabled,
        face: faceEnabled,
        wifi: wifiEnabled,
        nfc: nfcEnabled,
      },
      location: gpsEnabled ? location : undefined,
      wifi: wifiConfigToSave, // 使用经过处理的WiFi配置
      nfcTagId: nfcEnabled ? nfcTagId : undefined, // 添加NFC标签ID
    };

    const success = taskId
      ? await updateTask(taskId as string, taskData)
      : await createTask(taskData);

    if (success) {
      Alert.alert('成功', taskId ? '任务已更新' : '任务已创建', [
        { text: '确定', onPress: () => router.back() },
      ]);
    }
  };

  // 添加打开地图选点弹窗的函数
  const handleOpenMapPicker = async () => {
    if (!isEditable) return;

    try {
      setLocationLoading(true);

      // 获取当前位置作为地图初始位置
      try {
        // 请求位置权限
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          Alert.alert('权限被拒绝', '需要位置权限才能获取当前位置');
          // 继续使用已有的location
          setTempLocation({
            latitude: location.latitude,
            longitude: location.longitude,
          });
        } else {
          // 尝试获取当前位置
          try {
            // 使用高德地图定位服务获取位置
            const locationData = await getCurrentLocation();

            console.log('地图初始化 - 获取到的当前位置:', {
              latitude: locationData.latitude,
              longitude: locationData.longitude,
            });

            // 更新临时位置为当前位置
            setTempLocation({
              latitude: locationData.latitude,
              longitude: locationData.longitude,
            });
          } catch (error) {
            console.error('获取当前位置失败:', error);
            // 获取失败时使用已设置的位置
            setTempLocation({
              latitude: location.latitude,
              longitude: location.longitude,
            });
          }
        }
      } catch (error) {
        console.error('位置权限请求失败:', error);
        // 获取失败时使用已设置的位置
        setTempLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      }

      // 显示地图弹窗
      setShowMapModal(true);
    } finally {
      setLocationLoading(false);
    }
  };

  // 修改地图选点确认函数，直接使用tempLocation
  const handleConfirmMapLocation = async () => {
    try {
      setLocationLoading(true);

      // 此时直接使用tempLocation，它应该已经在onCameraMove/onCameraIdle事件中更新
      console.log('选点确认 - 当前tempLocation:', {
        latitude: tempLocation.latitude,
        longitude: tempLocation.longitude,
      });

      // 确保坐标有效
      if (isNaN(tempLocation.latitude) || isNaN(tempLocation.longitude)) {
        throw new Error('无效的坐标值');
      }

      // 更新位置信息，保留原有的半径值
      const updatedLocation = {
        ...location,
        latitude: tempLocation.latitude,
        longitude: tempLocation.longitude,
      };

      console.log('选点确认 - 更新后位置:', {
        latitude: updatedLocation.latitude,
        longitude: updatedLocation.longitude,
        radius: updatedLocation.radius,
      });

      setLocation(updatedLocation);

      // 清空旧的地址信息，等待新地址获取
      setLocationAddress('');

      // 尝试获取地址信息
      try {
        const address = await getLocationAddress(
          tempLocation.latitude,
          tempLocation.longitude
        );

        if (address) {
          setLocationAddress(address);
          console.log('获取到地址:', address);
        }
      } catch (addressError) {
        console.error('获取地址信息失败:', addressError);
        // 设置一个简单的坐标字符串作为地址
        const fallbackAddress = `${tempLocation.latitude.toFixed(
          6
        )},${tempLocation.longitude.toFixed(6)}`;
        setLocationAddress(fallbackAddress);
        console.log('使用坐标作为地址:', fallbackAddress);
      }

      // 显示成功提示，包含坐标信息
      Alert.alert(
        '成功',
        `已选择位置坐标：\n纬度: ${tempLocation.latitude.toFixed(
          6
        )}\n经度: ${tempLocation.longitude.toFixed(6)}`
      );
    } catch (error) {
      console.error('确认位置失败:', error);
      Alert.alert('错误', '确认位置时出现错误，请重试');
    } finally {
      // 关闭地图弹窗
      setShowMapModal(false);
      setLocationLoading(false);
    }
  };

  if (currentTaskLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY_BLUE} />
      </View>
    );
  }

  if (currentTaskError && (taskId || copyFrom)) {
    // 确定重试时要获取的 ID
    const idToRetry =
      typeof taskId === 'string'
        ? taskId
        : typeof copyFrom === 'string'
        ? copyFrom
        : null;
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTextDisplay}>{currentTaskError}</Text>
        {/* 仅当有有效 ID 时才显示重试按钮 */}
        {idToRetry && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchTaskDetail(idToRetry)}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* 不可编辑提示 */}
      {!isEditable && (
        <View style={styles.warningBanner}>
          <AlertTriangle size={18} color={BADGE_WARNING_TEXT} />
          <Text style={styles.warningBannerText}>
            任务已开始或已过开始时间，无法修改。
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本信息</Text>
        <TextInput
          style={[styles.input, !isEditable && styles.inputDisabled]}
          placeholder="请输入任务名称"
          placeholderTextColor={SECONDARY_TEXT_COLOR}
          value={title}
          onChangeText={setTitle}
          editable={isEditable}
        />

        <TouchableOpacity
          style={[
            styles.timeInputContainer,
            !isEditable && styles.inputDisabled,
          ]}
          onPress={() => isEditable && setShowStartPicker(true)}
          disabled={!isEditable}
        >
          <Text style={styles.timeInputLabel}>开始时间</Text>
          <Text
            style={[styles.timeInputValue, !isEditable && styles.textDisabled]}
          >
            {startTime.toLocaleString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.timeInputContainer,
            !isEditable && styles.inputDisabled,
          ]}
          onPress={() => isEditable && setShowEndPicker(true)}
          disabled={!isEditable}
        >
          <Text style={styles.timeInputLabel}>结束时间</Text>
          <Text
            style={[styles.timeInputValue, !isEditable && styles.textDisabled]}
          >
            {endTime.toLocaleString()}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={[
            styles.input,
            styles.textArea,
            !isEditable && styles.inputDisabled,
          ]}
          placeholder="任务说明（选填）"
          placeholderTextColor={SECONDARY_TEXT_COLOR}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={isEditable}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>签到要求</Text>

        {/* GPS 定位签到 */}
        <View style={styles.requirementItem}>
          <View style={styles.requirementHeader}>
            <View style={styles.requirementTitleContainer}>
              <MapPin
                size={20}
                color={ICON_BLUE}
                style={styles.requirementIcon}
              />
              <Text style={styles.requirementTitleText}>GPS定位签到</Text>
            </View>
            <Switch
              trackColor={{ false: '#E9E9EA', true: PRIMARY_BLUE_TINT }}
              thumbColor={gpsEnabled ? PRIMARY_BLUE : '#f4f3f4'}
              ios_backgroundColor="#E9E9EA"
              onValueChange={setGpsEnabled}
              value={gpsEnabled}
              disabled={!isEditable}
            />
          </View>
          {gpsEnabled && (
            <View style={styles.requirementConfigContainer}>
              <TouchableOpacity
                style={[
                  styles.configButton,
                  !isEditable && styles.buttonDisabled,
                  locationLoading && styles.buttonDisabled,
                ]}
                onPress={handleLocationSelect}
                disabled={!isEditable || locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color={PRIMARY_BLUE} />
                ) : (
                  <MapPin
                    size={18}
                    color={isEditable ? PRIMARY_BLUE : SECONDARY_TEXT_COLOR}
                  />
                )}
                <Text
                  style={[
                    styles.configButtonText,
                    !isEditable && styles.textDisabled,
                    locationLoading && styles.textDisabled,
                  ]}
                >
                  {locationLoading
                    ? '获取位置中...'
                    : `定位当前位置 (${
                        location?.latitude?.toFixed(4) || '--'
                      }, ${location?.longitude?.toFixed(4) || '--'})`}
                </Text>
              </TouchableOpacity>

              {/* 添加地图选点按钮 */}
              <TouchableOpacity
                style={[
                  styles.configButton,
                  styles.mapPickerButton,
                  !isEditable && styles.buttonDisabled,
                ]}
                onPress={handleOpenMapPicker}
                disabled={!isEditable}
              >
                <Map
                  size={18}
                  color={isEditable ? PRIMARY_BLUE : SECONDARY_TEXT_COLOR}
                />
                <Text
                  style={[
                    styles.configButtonText,
                    !isEditable && styles.textDisabled,
                  ]}
                >
                  在地图上选点
                </Text>
              </TouchableOpacity>

              {locationAddress ? (
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxLabel}>位置地址：</Text>
                  <Text style={styles.infoBoxText}>{locationAddress}</Text>
                </View>
              ) : null}

              <View style={styles.configRow}>
                <Text
                  style={[
                    styles.configLabel,
                    !isEditable && styles.textDisabled,
                  ]}
                >
                  半径 (米):
                </Text>
                <TextInput
                  style={[
                    styles.configInput,
                    !isEditable && styles.inputDisabled,
                  ]}
                  value={String(location.radius)}
                  onChangeText={(text) =>
                    setLocation({
                      ...location,
                      radius: parseInt(text, 10) || 0,
                    })
                  }
                  keyboardType="numeric"
                  editable={isEditable}
                  placeholderTextColor={SECONDARY_TEXT_COLOR}
                />
              </View>
            </View>
          )}
        </View>

        {/* 人脸识别 */}
        <View style={styles.requirementItem}>
          <View style={styles.requirementHeader}>
            <View style={styles.requirementTitleContainer}>
              <Camera
                size={20}
                color={ICON_BLUE}
                style={styles.requirementIcon}
              />
              <Text style={styles.requirementTitleText}>人脸识别</Text>
            </View>
            <Switch
              trackColor={{ false: '#E9E9EA', true: PRIMARY_BLUE_TINT }}
              thumbColor={faceEnabled ? PRIMARY_BLUE : '#f4f3f4'}
              ios_backgroundColor="#E9E9EA"
              onValueChange={setFaceEnabled}
              value={faceEnabled}
              disabled={!isEditable}
            />
          </View>
          {faceEnabled && (
            <View style={styles.requirementConfigContainer}>
              <Text
                style={[
                  styles.configHintText,
                  !isEditable && styles.textDisabled,
                ]}
              >
                签到时需要进行人脸识别验证
              </Text>
            </View>
          )}
        </View>

        {/* WiFi签到 */}
        <View style={styles.requirementItem}>
          <View style={styles.requirementHeader}>
            <View style={styles.requirementTitleContainer}>
              <Wifi
                size={20}
                color={ICON_BLUE}
                style={styles.requirementIcon}
              />
              <Text style={styles.requirementTitleText}>WiFi签到</Text>
            </View>
            <Switch
              trackColor={{ false: '#E9E9EA', true: PRIMARY_BLUE_TINT }}
              thumbColor={wifiEnabled ? PRIMARY_BLUE : '#f4f3f4'}
              ios_backgroundColor="#E9E9EA"
              onValueChange={setWifiEnabled}
              value={wifiEnabled}
              disabled={!isEditable}
            />
          </View>
          {wifiEnabled && (
            <View style={styles.requirementConfigContainer}>
              <TouchableOpacity
                style={[
                  styles.configButton,
                  !isEditable && styles.buttonDisabled,
                  wifiLoading && styles.buttonDisabled,
                ]}
                onPress={handleWifiScan}
                disabled={!isEditable || wifiLoading}
              >
                {wifiLoading ? (
                  <ActivityIndicator size="small" color={PRIMARY_BLUE} />
                ) : (
                  <Wifi
                    size={18}
                    color={isEditable ? PRIMARY_BLUE : SECONDARY_TEXT_COLOR}
                  />
                )}
                <Text
                  style={[
                    styles.configButtonText,
                    !isEditable && styles.textDisabled,
                    wifiLoading && styles.textDisabled,
                  ]}
                >
                  {wifiLoading ? '扫描中...' : '扫描当前WiFi'}
                </Text>
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    !isEditable && styles.textDisabled,
                  ]}
                >
                  SSID (WiFi名称):
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    !isEditable && styles.inputDisabled,
                  ]}
                  placeholder="例如：SCUT-Student"
                  placeholderTextColor={SECONDARY_TEXT_COLOR}
                  value={wifiConfig.ssid}
                  onChangeText={(text) =>
                    setWifiConfig({ ...wifiConfig, ssid: text })
                  }
                  editable={isEditable}
                />

                <Text
                  style={[
                    styles.inputLabel,
                    !isEditable && styles.textDisabled,
                  ]}
                >
                  BSSID (MAC地址):
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    !isEditable && styles.inputDisabled,
                  ]}
                  placeholder="例如：AA:BB:CC:DD:EE:FF"
                  placeholderTextColor={SECONDARY_TEXT_COLOR}
                  value={wifiConfig.bssid}
                  onChangeText={(text) =>
                    setWifiConfig({ ...wifiConfig, bssid: text })
                  }
                  editable={isEditable}
                />
                <Text style={styles.inputHintText}>
                  至少提供SSID或BSSID。建议同时提供以提高准确性。
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* NFC签到 */}
        <View style={styles.requirementItem}>
          <View style={styles.requirementHeader}>
            <View style={styles.requirementTitleContainer}>
              <Smartphone
                size={20}
                color={ICON_BLUE}
                style={styles.requirementIcon}
              />
              <Text style={styles.requirementTitleText}>NFC签到</Text>
            </View>
            <Switch
              trackColor={{ false: '#E9E9EA', true: PRIMARY_BLUE_TINT }}
              thumbColor={nfcEnabled ? PRIMARY_BLUE : '#f4f3f4'}
              ios_backgroundColor="#E9E9EA"
              onValueChange={setNfcEnabled}
              value={nfcEnabled}
              disabled={!isEditable}
            />
          </View>
          {nfcEnabled && (
            <View style={styles.requirementConfigContainer}>
              <TouchableOpacity
                style={[
                  styles.configButton,
                  !isEditable && styles.buttonDisabled,
                  nfcScanning && styles.buttonDisabled,
                ]}
                onPress={handleScanNfc}
                disabled={!isEditable || nfcScanning}
              >
                {nfcScanning ? (
                  <ActivityIndicator size="small" color={PRIMARY_BLUE} />
                ) : (
                  <Smartphone
                    size={18}
                    color={isEditable ? PRIMARY_BLUE : SECONDARY_TEXT_COLOR}
                  />
                )}
                <Text
                  style={[
                    styles.configButtonText,
                    !isEditable && styles.textDisabled,
                    nfcScanning && styles.textDisabled,
                  ]}
                >
                  {nfcScanning ? '扫描中...' : '扫描NFC标签'}
                </Text>
              </TouchableOpacity>

              {nfcTagId ? (
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxLabel}>NFC标签ID:</Text>
                  <Text style={styles.nfcIdValueText}>{nfcTagId}</Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.configHintText,
                    !isEditable && styles.textDisabled,
                  ]}
                >
                  请扫描NFC标签以获取ID
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {operationStatus.error && (
        <View style={styles.errorBanner}>
          <AlertCircle size={20} color={BADGE_ERROR_TEXT} />
          <Text style={styles.errorBannerText}>{operationStatus.error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!isEditable || operationStatus.loading) &&
            styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!isEditable || operationStatus.loading}
      >
        {operationStatus.loading ? (
          <ActivityIndicator color={CARD_BACKGROUND} />
        ) : (
          <Text style={styles.submitButtonText}>
            {taskId ? '更新任务' : '创建任务'}
          </Text>
        )}
      </TouchableOpacity>

      {/* 仅在显示时才渲染DateTimePicker，渲染后立即处理结果 */}
      {showStartPicker && (
        <DateTimePicker
          testID="startTimePicker"
          value={
            Platform.OS === 'android' &&
            androidPickerMode === 'time' &&
            tempSelectedDate
              ? tempSelectedDate
              : startTime
          }
          mode={Platform.OS === 'android' ? androidPickerMode : 'datetime'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartTimeChange}
          minimumDate={new Date()}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          testID="endTimePicker"
          value={
            Platform.OS === 'android' &&
            androidPickerMode === 'time' &&
            tempSelectedDate
              ? tempSelectedDate
              : endTime
          }
          mode={Platform.OS === 'android' ? androidPickerMode : 'datetime'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndTimeChange}
          minimumDate={startTime}
        />
      )}

      {/* 地图选点弹窗 */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <Text style={styles.mapModalTitle}>选择位置</Text>
            <TouchableOpacity
              style={styles.mapCloseButton}
              onPress={() => setShowMapModal(false)}
            >
              <X size={24} color={PRIMARY_TEXT_COLOR} />
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialCameraPosition={{
                target: tempLocation,
                zoom: 16,
              }}
              onCameraMove={(event) => {
                setMapDragging(true);

                // 使用类型断言处理nativeEvent
                const nativeEvent = event.nativeEvent as any;

                if (nativeEvent) {
                  console.log('地图移动事件');

                  // 尝试不同的属性路径获取中心点
                  let target;

                  // 方式1: 直接从nativeEvent获取target
                  if (nativeEvent.target) {
                    target = nativeEvent.target;
                  }
                  // 方式2: 从camera.target获取
                  else if (nativeEvent.camera && nativeEvent.camera.target) {
                    target = nativeEvent.camera.target;
                  }
                  // 方式3: 从position或center获取
                  else if (nativeEvent.position) {
                    target = nativeEvent.position;
                  } else if (nativeEvent.center) {
                    target = nativeEvent.center;
                  }

                  // 如果找到有效的目标位置，更新tempLocation
                  if (
                    target &&
                    typeof target.latitude === 'number' &&
                    typeof target.longitude === 'number'
                  ) {
                    console.log('地图移动 - 获取到新坐标:', {
                      latitude: target.latitude,
                      longitude: target.longitude,
                    });

                    setTempLocation({
                      latitude: target.latitude,
                      longitude: target.longitude,
                    });
                  } else {
                    // 使用更安全的日志输出
                    console.log('地图移动 - 无法获取坐标，检查事件结构');

                    // 尝试打印一些调试信息
                    if (nativeEvent) {
                      const keys = Object.keys(nativeEvent);
                      console.log('事件对象可用属性:', keys);
                    }
                  }
                }
              }}
              onCameraIdle={(event) => {
                // 使用类型断言处理nativeEvent
                const nativeEvent = event.nativeEvent as any;

                if (nativeEvent) {
                  console.log('地图停止事件');

                  let target;

                  if (nativeEvent.target) {
                    target = nativeEvent.target;
                  } else if (nativeEvent.camera && nativeEvent.camera.target) {
                    target = nativeEvent.camera.target;
                  } else if (nativeEvent.position) {
                    target = nativeEvent.position;
                  } else if (nativeEvent.center) {
                    target = nativeEvent.center;
                  }

                  if (
                    target &&
                    typeof target.latitude === 'number' &&
                    typeof target.longitude === 'number'
                  ) {
                    console.log('地图停止 - 最终坐标:', {
                      latitude: target.latitude,
                      longitude: target.longitude,
                    });

                    setTempLocation({
                      latitude: target.latitude,
                      longitude: target.longitude,
                    });
                  } else {
                    console.log('地图停止 - 无法获取坐标');

                    // 尝试打印一些调试信息
                    if (nativeEvent) {
                      const keys = Object.keys(nativeEvent);
                      console.log('事件对象可用属性:', keys);
                    }
                  }
                }

                setMapDragging(false);
              }}
            >
              {/* 不再使用标记点，因为我们已经有中心点标记 */}
            </MapView>

            {/* 中心点标记 */}
            <View style={styles.mapCenterMarker} pointerEvents="none">
              <MapPin
                size={36}
                color={mapDragging ? '#2196F3' : '#007AFF'}
                style={{ marginBottom: 36 }}
              />
            </View>

            {/* 当前选择的坐标信息 */}
            <View style={styles.mapCoordinateInfo}>
              <Text style={styles.mapCoordinateText}>
                纬度: {tempLocation.latitude.toFixed(6)}
              </Text>
              <Text style={styles.mapCoordinateText}>
                经度: {tempLocation.longitude.toFixed(6)}
              </Text>
            </View>

            {/* 地图操作说明 */}
            <View style={styles.mapInstructions}>
              <Text style={styles.mapInstructionsText}>
                拖动地图或双指缩放以调整位置
              </Text>
            </View>
          </View>

          <View style={styles.mapModalFooter}>
            <TouchableOpacity
              style={styles.mapCancelButton}
              onPress={() => setShowMapModal(false)}
            >
              <Text style={styles.mapCancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapConfirmButton}
              onPress={handleConfirmMapLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Fragment>
                  <CheckCircle size={20} color="#FFFFFF" />
                  <Text style={styles.mapConfirmButtonText}>确认位置</Text>
                </Fragment>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const PRIMARY_BLUE_TINT = '#aed4ff'; // Helper for Switch trackColor

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: PADDING_L,
    backgroundColor: APP_BACKGROUND,
  },
  section: {
    backgroundColor: CARD_BACKGROUND,
    paddingHorizontal: PADDING_L,
    paddingVertical: PADDING_XL,
    marginTop: MARGIN_M,
    marginHorizontal: MARGIN_M, // Added for consistency
    borderRadius: CARD_BORDER_RADIUS,
    // Apply shadow similar to taskCard
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 }, // Subtle shadow
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3, // For Android
  },
  sectionTitle: {
    fontSize: FONT_SIZE_L, // Slightly smaller than XL for section titles
    fontWeight: FONT_WEIGHT_SEMIBOLD,
    color: PRIMARY_TEXT_COLOR,
    marginBottom: PADDING_L,
  },
  input: {
    borderWidth: 1,
    borderColor: LIGHT_GRAY_BORDER,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingVertical: PADDING_M,
    paddingHorizontal: PADDING_M,
    fontSize: FONT_SIZE_M,
    backgroundColor: APP_BACKGROUND, // Light background for input
    marginBottom: MARGIN_L,
    color: PRIMARY_TEXT_COLOR,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top', // Ensure placeholder is at top for multiline
  },
  timeInputContainer: {
    // Renamed from timeInput for clarity
    borderWidth: 1,
    borderColor: LIGHT_GRAY_BORDER,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingVertical: PADDING_M,
    paddingHorizontal: PADDING_M,
    marginBottom: MARGIN_L,
    backgroundColor: APP_BACKGROUND,
    justifyContent: 'center', // Vertically center content
  },
  timeInputLabel: {
    fontSize: FONT_SIZE_S, // Smaller label
    color: SECONDARY_TEXT_COLOR,
    marginBottom: PADDING_XS,
  },
  timeInputValue: {
    fontSize: FONT_SIZE_M,
    color: PRIMARY_TEXT_COLOR,
  },
  requirementItem: {
    marginBottom: MARGIN_L,
    backgroundColor: CARD_BACKGROUND, // Should be transparent or match section bg
    borderRadius: CARD_BORDER_RADIUS, // Consistent rounding
    // Removed overflow: 'hidden' unless specifically needed for clipping children
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: PADDING_M,
    // paddingHorizontal: PADDING_M, // Use padding from section or specific config container
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY_BORDER,
  },
  requirementTitleContainer: {
    // New style for icon + text
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementIcon: {
    marginRight: MARGIN_S,
  },
  requirementTitleText: {
    // Renamed from requirementText
    fontSize: FONT_SIZE_M, // Consistent with input fields
    color: PRIMARY_TEXT_COLOR,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },
  requirementConfigContainer: {
    // Renamed from requirementConfig
    paddingTop: PADDING_M, // Add padding only to the top if header has bottom border
    // paddingHorizontal: PADDING_M, // Keep padding consistent
    // backgroundColor: '#F9FBFF', // Consider removing if section bg is sufficient
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: PADDING_M - 2, // 10
    paddingHorizontal: PADDING_L, // 16
    backgroundColor: BADGE_INFO_BG, // Use a light blue for informational buttons
    borderRadius: INPUT_BORDER_RADIUS, // Consistent with inputs
    marginBottom: MARGIN_M,
    alignSelf: 'flex-start', // Align button to the start
  },
  configButtonText: {
    marginLeft: MARGIN_S,
    color: ICON_BLUE, // Text color matches icon
    fontSize: FONT_SIZE_M,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },
  configRow: {
    // For items like Radius input
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: MARGIN_M,
  },
  configLabel: {
    marginRight: MARGIN_S,
    color: SECONDARY_TEXT_COLOR,
    fontSize: FONT_SIZE_M,
  },
  configInput: {
    // For Radius
    borderWidth: 1,
    borderColor: LIGHT_GRAY_BORDER,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingHorizontal: PADDING_M,
    paddingVertical: PADDING_S, // Slightly less vertical padding for smaller inputs
    fontSize: FONT_SIZE_M,
    backgroundColor: APP_BACKGROUND,
    minWidth: 80, // Keep minWidth
    textAlign: 'center',
    color: PRIMARY_TEXT_COLOR,
  },
  configHintText: {
    // Renamed from configHint
    fontSize: FONT_SIZE_S,
    color: SECONDARY_TEXT_COLOR,
    marginTop: MARGIN_S,
  },
  inputGroup: {
    // Container for SSID/BSSID inputs
    width: '100%',
    marginTop: MARGIN_S, // Add some space after the scan button
  },
  inputLabel: {
    fontSize: FONT_SIZE_M,
    color: PRIMARY_TEXT_COLOR,
    marginBottom: MARGIN_S,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },
  inputField: {
    // For SSID/BSSID
    borderWidth: 1,
    borderColor: LIGHT_GRAY_BORDER,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingHorizontal: PADDING_M,
    paddingVertical: PADDING_M,
    fontSize: FONT_SIZE_M,
    backgroundColor: APP_BACKGROUND,
    marginBottom: MARGIN_M,
    width: '100%',
    color: PRIMARY_TEXT_COLOR,
  },
  inputHintText: {
    // Renamed from wifiHintText
    fontSize: FONT_SIZE_S,
    color: SECONDARY_TEXT_COLOR,
    marginTop: -MARGIN_S, // Adjust to be closer to the input field
    marginBottom: MARGIN_M, // Add some space after the hint
    // fontStyle: 'italic', // Removed italic for consistency
  },
  infoBox: {
    // General purpose info box (for address, NFC ID)
    backgroundColor: APP_BACKGROUND, // Light background
    padding: PADDING_M,
    borderRadius: INPUT_BORDER_RADIUS,
    marginVertical: MARGIN_M,
    borderLeftWidth: 3, // Accent border
    borderLeftColor: PRIMARY_BLUE,
  },
  infoBoxLabel: {
    fontSize: FONT_SIZE_S,
    fontWeight: FONT_WEIGHT_MEDIUM,
    color: SECONDARY_TEXT_COLOR,
    marginBottom: PADDING_XS,
  },
  infoBoxText: {
    fontSize: FONT_SIZE_M,
    color: PRIMARY_TEXT_COLOR,
    lineHeight: FONT_SIZE_M + PADDING_S, // Improved line height
  },
  nfcIdValueText: {
    // Specific style for NFC ID if needed (e.g., monospace)
    fontSize: FONT_SIZE_M,
    color: PRIMARY_TEXT_COLOR,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // Monospace for IDs
  },
  // Banners (Warning and Error)
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BADGE_WARNING_BG,
    paddingVertical: PADDING_M,
    paddingHorizontal: PADDING_L,
    marginHorizontal: MARGIN_M,
    marginTop: MARGIN_L,
    borderRadius: INPUT_BORDER_RADIUS, // Consistent rounding
    borderLeftWidth: 4, // Accent border
    borderLeftColor: BADGE_WARNING_TEXT,
  },
  warningBannerText: {
    // Renamed from warningText
    marginLeft: MARGIN_S,
    color: BADGE_WARNING_TEXT, // Use the darker warning text color
    fontSize: FONT_SIZE_M,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },
  errorBanner: {
    // Renamed from errorContainer
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BADGE_ERROR_BG,
    paddingVertical: PADDING_M,
    paddingHorizontal: PADDING_L,
    marginHorizontal: MARGIN_M,
    marginTop: MARGIN_L,
    borderRadius: INPUT_BORDER_RADIUS,
    borderLeftWidth: 4,
    borderLeftColor: BADGE_ERROR_TEXT,
  },
  errorBannerText: {
    // Renamed from errorText (which was for submission error)
    marginLeft: MARGIN_S,
    color: BADGE_ERROR_TEXT,
    fontSize: FONT_SIZE_M,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },
  errorTextDisplay: {
    // For displaying currentTaskError in centerContainer
    fontSize: FONT_SIZE_M,
    color: BADGE_ERROR_TEXT,
    marginBottom: MARGIN_L,
    textAlign: 'center',
  },
  // Buttons (Submit, Retry)
  submitButton: {
    backgroundColor: PRIMARY_BLUE,
    marginHorizontal: MARGIN_M,
    marginTop: MARGIN_L,
    marginBottom: PADDING_XL, // Ensure space at the bottom
    paddingVertical: PADDING_L - PADDING_XS, // Make it slightly shorter
    borderRadius: INPUT_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center', // Center content
    minHeight: 48, // Ensure a good tap target height
  },
  submitButtonText: {
    color: CARD_BACKGROUND, // White text
    fontSize: FONT_SIZE_L,
    fontWeight: FONT_WEIGHT_MEDIUM, // Medium weight for button text
  },
  retryButton: {
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: PADDING_M,
    paddingHorizontal: PADDING_XL,
    borderRadius: INPUT_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: MARGIN_L,
  },
  retryButtonText: {
    color: CARD_BACKGROUND,
    fontSize: FONT_SIZE_M,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },
  // States (Disabled)
  inputDisabled: {
    backgroundColor: '#E9E9EA', // Lighter gray for disabled
    color: '#B0B0B0', // Darker gray text for disabled
    opacity: 0.7, // Slight opacity
  },
  textDisabled: {
    color: '#B0B0B0',
  },
  buttonDisabled: {
    // For config buttons when disabled
    backgroundColor: '#E9E9EA', // Disabled background
    opacity: 0.6,
  },
  submitButtonDisabled: {
    backgroundColor: PRIMARY_BLUE, // Keep color but change opacity
    opacity: 0.5,
  },
  mapPickerButton: {
    marginTop: MARGIN_M,
    backgroundColor: BADGE_INFO_BG,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: PADDING_M,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY_BORDER,
  },
  mapModalTitle: {
    fontSize: FONT_SIZE_L,
    fontWeight: FONT_WEIGHT_SEMIBOLD,
    color: PRIMARY_TEXT_COLOR,
  },
  mapCloseButton: {
    padding: PADDING_S,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapCenterMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    // 调整中心点标记位置，使图钉底部对准中心点
    transform: [{ translateX: -18 }, { translateY: -36 }],
    // 添加阴影效果
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  mapCoordinateInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: PADDING_M,
    borderRadius: INPUT_BORDER_RADIUS,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  },
  mapCoordinateText: {
    fontSize: FONT_SIZE_M,
    color: PRIMARY_TEXT_COLOR,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  mapModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: PADDING_M,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY_BORDER,
  },
  mapCancelButton: {
    padding: PADDING_M,
  },
  mapCancelButtonText: {
    fontSize: FONT_SIZE_M,
    fontWeight: FONT_WEIGHT_MEDIUM,
    color: PRIMARY_TEXT_COLOR,
  },
  mapConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: PADDING_M,
    paddingHorizontal: PADDING_L,
    borderRadius: INPUT_BORDER_RADIUS,
  },
  mapConfirmButtonText: {
    fontSize: FONT_SIZE_M,
    fontWeight: FONT_WEIGHT_MEDIUM,
    color: CARD_BACKGROUND,
    marginLeft: MARGIN_S,
  },
  mapInstructions: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: PADDING_M,
    borderRadius: INPUT_BORDER_RADIUS,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  },
  mapInstructionsText: {
    fontSize: FONT_SIZE_S,
    color: PRIMARY_TEXT_COLOR,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },
});
