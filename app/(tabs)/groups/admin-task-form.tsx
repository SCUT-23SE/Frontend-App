import { useEffect, useState } from 'react';
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
} from 'lucide-react-native';
import { useAdminTasksStore } from '@/stores/admin-tasks';
import { formatDate } from '@/utils/date';

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
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
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

  // WiFi配置
  const [wifiConfig, setWifiConfig] = useState({
    ssid: '',
    bssid: '',
  });

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

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      // Android需要分两步：先选日期，再选时间
      if (androidPickerMode === 'date' && selectedDate) {
        // 第一步：选择了日期，保存临时数据并切换到时间选择
        const tempDate = new Date(selectedDate);
        // 保留之前的时间部分
        tempDate.setHours(startTime.getHours());
        tempDate.setMinutes(startTime.getMinutes());
        setTempSelectedDate(tempDate);
        setAndroidPickerMode('time');
        return; // 继续显示picker进行时间选择
      } else if (
        androidPickerMode === 'time' &&
        selectedDate &&
        tempSelectedDate
      ) {
        // 第二步：选择了时间，合并日期和时间数据
        const finalDate = new Date(tempSelectedDate);
        finalDate.setHours(selectedDate.getHours());
        finalDate.setMinutes(selectedDate.getMinutes());

        // 完成选择，更新日期并隐藏选择器
        setStartTime(finalDate);
        if (finalDate > endTime) {
          setEndTime(finalDate);
        }

        // 重置Android选择器状态
        setAndroidPickerMode('date');
        setTempSelectedDate(null);
        setShowStartPicker(false);
        return;
      }

      // 用户取消了选择
      setAndroidPickerMode('date');
      setTempSelectedDate(null);
      setShowStartPicker(false);
      return;
    }

    // iOS处理逻辑不变
    setShowStartPicker(false);
    if (selectedDate) {
      setStartTime(selectedDate);
      if (selectedDate > endTime) {
        setEndTime(selectedDate);
      }
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      // Android需要分两步：先选日期，再选时间
      if (androidPickerMode === 'date' && selectedDate) {
        // 第一步：选择了日期，保存临时数据并切换到时间选择
        const tempDate = new Date(selectedDate);
        // 保留之前的时间部分
        tempDate.setHours(endTime.getHours());
        tempDate.setMinutes(endTime.getMinutes());
        setTempSelectedDate(tempDate);
        setAndroidPickerMode('time');
        return; // 继续显示picker进行时间选择
      } else if (
        androidPickerMode === 'time' &&
        selectedDate &&
        tempSelectedDate
      ) {
        // 第二步：选择了时间，合并日期和时间数据
        const finalDate = new Date(tempSelectedDate);
        finalDate.setHours(selectedDate.getHours());
        finalDate.setMinutes(selectedDate.getMinutes());

        // 验证日期
        if (finalDate < startTime) {
          Alert.alert('错误', '结束时间不能早于开始时间');

          // 重置Android选择器状态
          setAndroidPickerMode('date');
          setTempSelectedDate(null);
          setShowEndPicker(false);
          return;
        }

        // 完成选择，更新日期并隐藏选择器
        setEndTime(finalDate);

        // 重置Android选择器状态
        setAndroidPickerMode('date');
        setTempSelectedDate(null);
        setShowEndPicker(false);
        return;
      }

      // 用户取消了选择
      setAndroidPickerMode('date');
      setTempSelectedDate(null);
      setShowEndPicker(false);
      return;
    }

    // iOS处理逻辑不变
    setShowEndPicker(false);
    if (selectedDate) {
      if (selectedDate < startTime) {
        Alert.alert('错误', '结束时间不能早于开始时间');
        return;
      }
      setEndTime(selectedDate);
    }
  };

  const handleLocationSelect = () => {
    // 这里应该打开地图选择器
    if (!isEditable) return; // 不可编辑时阻止操作
    Alert.alert('提示', '地图选择功能开发中');
  };

  const handleWifiScan = () => {
    // 这里应该扫描当前WiFi
    if (!isEditable) return; // 不可编辑时阻止操作
    Alert.alert('提示', 'WiFi扫描功能开发中');
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
    if (wifiEnabled && (!wifiConfig.ssid || !wifiConfig.bssid)) {
      Alert.alert('错误', '请完善WiFi签到配置');
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
      wifi: wifiEnabled ? wifiConfig : undefined,
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

  if (currentTaskLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
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
        <Text style={styles.errorText}>{currentTaskError}</Text>
        {/* 仅当有有效 ID 时才显示重试按钮 */}
        {idToRetry && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchTaskDetail(idToRetry)}
          >
            <Text style={styles.retryText}>重试</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 不可编辑提示 */}
      {!isEditable && (
        <View style={styles.warningBanner}>
          <AlertTriangle size={18} color="#FFA000" />
          <Text style={styles.warningText}>
            任务已开始或已过开始时间，无法修改。
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本信息</Text>
        <TextInput
          style={[styles.input, !isEditable && styles.inputDisabled]} // 应用禁用样式
          placeholder="请输入任务名称"
          value={title}
          onChangeText={setTitle}
          editable={isEditable} // 控制可编辑性
        />

        <TouchableOpacity
          style={styles.timeInput}
          onPress={() => isEditable && setShowStartPicker(true)} // 仅在可编辑时触发
          disabled={!isEditable} // 禁用 TouchableOpacity
        >
          <Text style={styles.timeInputLabel}>开始时间</Text>
          <Text
            style={[styles.timeInputValue, !isEditable && styles.textDisabled]}
          >
            {startTime.toLocaleString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.timeInput}
          onPress={() => isEditable && setShowEndPicker(true)} // 仅在可编辑时触发
          disabled={!isEditable} // 禁用 TouchableOpacity
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
          ]} // 应用禁用样式
          placeholder="任务说明（选填）"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={isEditable} // 控制可编辑性
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>签到要求</Text>

        <View style={styles.requirementItem}>
          <View style={styles.requirementHeader}>
            <View style={styles.requirementTitle}>
              <MapPin size={20} color="#4A90E2" />
              <Text style={styles.requirementText}>GPS定位签到</Text>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={gpsEnabled ? '#4A90E2' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={setGpsEnabled}
              value={gpsEnabled}
              disabled={!isEditable} // 禁用 Switch
            />
          </View>
          {gpsEnabled && (
            <View style={styles.requirementConfig}>
              <TouchableOpacity
                style={[
                  styles.configButton,
                  !isEditable && styles.buttonDisabled,
                ]}
                onPress={handleLocationSelect}
                disabled={!isEditable}
              >
                <MapPin size={16} color={isEditable ? '#4A90E2' : '#aaa'} />
                <Text
                  style={[
                    styles.configButtonText,
                    !isEditable && styles.textDisabled,
                  ]}
                >
                  选择位置 ({location?.latitude?.toFixed(4) || 0},{' '}
                  {location?.longitude?.toFixed(4) || 0})
                </Text>
              </TouchableOpacity>
              <Text
                style={[styles.configLabel, !isEditable && styles.textDisabled]}
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
                  setLocation({ ...location, radius: parseInt(text, 10) || 0 })
                }
                keyboardType="numeric"
                editable={isEditable}
              />
            </View>
          )}
        </View>

        <View style={styles.requirementItem}>
          <View style={styles.requirementHeader}>
            <View style={styles.requirementTitle}>
              <Camera size={20} color="#4A90E2" />
              <Text style={styles.requirementText}>人脸识别</Text>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={faceEnabled ? '#4A90E2' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={setFaceEnabled}
              value={faceEnabled}
              disabled={!isEditable} // 禁用 Switch
            />
          </View>
          {faceEnabled && (
            <Text
              style={[styles.configHint, !isEditable && styles.textDisabled]}
            >
              签到时需要进行人脸识别
            </Text>
          )}
        </View>

        <View style={styles.requirementItem}>
          <View style={styles.requirementHeader}>
            <View style={styles.requirementTitle}>
              <Wifi size={20} color="#4A90E2" />
              <Text style={styles.requirementText}>WiFi签到</Text>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={wifiEnabled ? '#4A90E2' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={setWifiEnabled}
              value={wifiEnabled}
              disabled={!isEditable} // 禁用 Switch
            />
          </View>
          {wifiEnabled && (
            <View style={styles.requirementConfig}>
              <TouchableOpacity
                style={[
                  styles.configButton,
                  !isEditable && styles.buttonDisabled,
                ]}
                onPress={handleWifiScan}
                disabled={!isEditable}
              >
                <Wifi size={16} color={isEditable ? '#4A90E2' : '#aaa'} />
                <Text
                  style={[
                    styles.configButtonText,
                    !isEditable && styles.textDisabled,
                  ]}
                >
                  扫描当前WiFi
                </Text>
              </TouchableOpacity>
              <Text
                style={[styles.configLabel, !isEditable && styles.textDisabled]}
              >
                SSID:
              </Text>
              <TextInput
                style={[styles.inputSmall, !isEditable && styles.inputDisabled]}
                placeholder="WiFi名称"
                value={wifiConfig.ssid}
                onChangeText={(text) =>
                  setWifiConfig({ ...wifiConfig, ssid: text })
                }
                editable={isEditable}
              />
              <Text
                style={[styles.configLabel, !isEditable && styles.textDisabled]}
              >
                BSSID:
              </Text>
              <TextInput
                style={[styles.inputSmall, !isEditable && styles.inputDisabled]}
                placeholder="BSSID (可选)"
                value={wifiConfig.bssid}
                onChangeText={(text) =>
                  setWifiConfig({ ...wifiConfig, bssid: text })
                }
                editable={isEditable}
              />
            </View>
          )}
        </View>
      </View>

      {operationStatus.error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={20} color="#F44336" />
          <Text style={styles.errorText}>{operationStatus.error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.submitButton,
          !isEditable && styles.submitButtonDisabled,
        ]} // 应用禁用样式
        onPress={handleSubmit}
        disabled={!isEditable || operationStatus.loading} // 禁用按钮
      >
        {operationStatus.loading ? (
          <ActivityIndicator color="#fff" />
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  timeInputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timeInputValue: {
    fontSize: 16,
    color: '#333',
  },
  requirementItem: {
    marginBottom: 20,
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  locationButton: {
    backgroundColor: '#F5F8FF',
    padding: 12,
    borderRadius: 8,
  },
  locationButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 4,
  },
  locationInfo: {
    fontSize: 12,
    color: '#666',
  },
  wifiButton: {
    backgroundColor: '#F5F8FF',
    padding: 12,
    borderRadius: 8,
  },
  wifiButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 4,
  },
  wifiInfo: {
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  inputDisabled: {
    // 新增：禁用输入框样式
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  textDisabled: {
    // 新增：禁用文本样式
    color: '#999',
  },
  buttonDisabled: {
    // 新增：禁用按钮样式
    opacity: 0.5,
    backgroundColor: '#e0e0e0',
  },
  warningBanner: {
    // 新增：警告提示样式
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4', // Light yellow background
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: -5, // Adjust spacing
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFECB3',
  },
  warningText: {
    marginLeft: 8,
    color: '#795548', // Darker yellow/brown text
    fontSize: 14,
  },
  inputSmall: {
    // 可能需要为WiFi SSID/BSSID调整样式
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
    flex: 1, // 使其在行内平分空间
    marginHorizontal: 4,
  },
  configInput: {
    // GPS 半径输入框
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    minWidth: 80, // 给一个最小宽度
    textAlign: 'center',
  },
  configLabel: {
    marginHorizontal: 8,
    color: '#666',
    fontSize: 14,
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginBottom: 12,
  },
  configButtonText: {
    marginLeft: 8,
    color: '#4A90E2',
    fontSize: 14,
  },
  configHint: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  requirementConfig: {
    marginTop: 12,
    paddingLeft: 20, // Indent config options
    flexDirection: 'row', // For GPS Radius input alignment
    alignItems: 'center', // For GPS Radius input alignment
  },
});
