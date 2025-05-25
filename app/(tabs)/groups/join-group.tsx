import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { groupsService } from '@/services/groups-service';
import { JoinApplicationRequest } from '@/types/groups';
import { useGroupsStore } from '@/stores/groups';
import { faceApi } from '@/request';
import { useAuth } from '@/stores/auth';

// --- Style Constants ---
const APP_BACKGROUND = '#F8F8FA';
const CARD_BACKGROUND = '#FFFFFF';
const PRIMARY_BLUE = '#007AFF';
const PRIMARY_TEXT_COLOR = '#1C1C1E'; // 更深的黑色
const SECONDARY_TEXT_COLOR = '#8A8A8E'; // iOS 次要灰色
const LIGHT_GRAY_BORDER = '#E5E5EA'; // 边框颜色
const INPUT_BACKGROUND = '#FFFFFF'; // 修改为白色背景
const INPUT_PLACEHOLDER_COLOR = '#BCBCBC'; // 输入框占位符颜色
const INPUT_BORDER_COLOR = '#D1D1D6'; // 输入框边框颜色

// 警告颜色
const WARNING_BG = '#FFFBE6'; // 警告背景色
const WARNING_TEXT = '#FA8C16'; // 警告文字颜色
const WARNING_BORDER = '#FFE58F'; // 警告边框颜色
const WARNING_BUTTON_BG = '#FA8C16'; // 警告按钮背景色

const CARD_BORDER_RADIUS = 12;
const INPUT_BORDER_RADIUS = 10; // 调整为更圆润的边角

const PADDING_XS = 4;
const PADDING_S = 8;
const PADDING_M = 12;
const PADDING_L = 16;
const PADDING_XL = 20;

const MARGIN_S = 8;
const MARGIN_M = 12;
const MARGIN_L = 16;
const MARGIN_XL = 24;

const FONT_SIZE_S = 12;
const FONT_SIZE_M = 14;
const FONT_SIZE_L = 16;
const FONT_SIZE_XL = 17;
const FONT_SIZE_XXL = 20;

const FONT_WEIGHT_REGULAR = '400';
const FONT_WEIGHT_MEDIUM = '500';
const FONT_WEIGHT_SEMIBOLD = '600';
const FONT_WEIGHT_BOLD = '700';
// --- End Style Constants ---

export default function JoinGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [groupId, setGroupId] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFaceData, setHasFaceData] = useState<boolean | null>(null);
  const [checkingFace, setCheckingFace] = useState(false);
  const { fetchGroups } = useGroupsStore();
  const { user } = useAuth();

  // 处理深度链接参数
  useEffect(() => {
    if (params.groupId) {
      setGroupId(String(params.groupId));
    }
  }, [params]);

  // 检查用户是否设置了人脸信息
  useEffect(() => {
    checkUserFace();
  }, []);

  const checkUserFace = async () => {
    if (!user) return;

    setCheckingFace(true);
    try {
      const userId = parseInt(user.id);
      const response = await faceApi.usersMeFaceGet(userId);
      setHasFaceData(true);
    } catch (error: any) {
      if (
        error.isAxiosError &&
        error.response &&
        error.response.status === 404
      ) {
        setHasFaceData(false);
      } else {
        console.error('检查人脸数据失败:', error);
        setHasFaceData(false);
      }
    } finally {
      setCheckingFace(false);
    }
  };

  const handleSubmit = async () => {
    if (!groupId.trim()) {
      Alert.alert('提示', '请输入用户组ID');
      return;
    }

    // 检查用户是否设置了人脸
    if (hasFaceData === false) {
      Alert.alert(
        '无法提交',
        '您尚未设置人脸信息，需要先设置人脸信息才能申请加入用户组',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '去设置',
            onPress: () => {
              router.push('/profile/face-management');
            },
          },
        ]
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // 准备请求数据
      const requestData: JoinApplicationRequest = {
        groupId: groupId.trim(),
        reason: reason.trim(),
      };

      // 调用加入用户组的API
      const response = await groupsService.submitApplication(requestData);

      if (response.success) {
        Alert.alert('成功', '已提交加入申请，请等待管理员审核', [
          {
            text: '确定',
            onPress: () => {
              fetchGroups(); // 刷新用户组列表
              router.back(); // 返回到上一页
            },
          },
        ]);
      } else {
        Alert.alert('失败', response.error || '申请加入用户组失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '申请加入用户组时发生错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>加入用户组</Text>
          <Text style={styles.subtitle}>请输入用户组ID和申请理由</Text>

          {hasFaceData === false && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                您尚未设置人脸信息，需要先设置人脸信息才能申请加入用户组
              </Text>
              <TouchableOpacity
                style={styles.warningButton}
                onPress={() => router.push('/profile/face-management')}
              >
                <Text style={styles.warningButtonText}>去设置人脸</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>用户组ID *</Text>
            <TextInput
              style={styles.input}
              value={groupId}
              onChangeText={setGroupId}
              placeholder="请输入用户组ID"
              placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
              keyboardType="number-pad"
              maxLength={50}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>申请理由</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="请输入申请理由（可选）"
              placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
              multiline
              numberOfLines={4}
              maxLength={255}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!groupId.trim() ||
                isSubmitting ||
                hasFaceData === false ||
                checkingFace) &&
                styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={
              !groupId.trim() ||
              isSubmitting ||
              hasFaceData === false ||
              checkingFace
            }
          >
            {isSubmitting || checkingFace ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>提交申请</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  } as ViewStyle,
  scrollContainer: {
    flexGrow: 1,
    padding: PADDING_L,
  } as ViewStyle,
  formContainer: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: CARD_BORDER_RADIUS,
    padding: PADDING_XL,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  } as ViewStyle,
  title: {
    fontSize: FONT_SIZE_XXL,
    fontWeight: FONT_WEIGHT_SEMIBOLD,
    color: PRIMARY_TEXT_COLOR,
    marginBottom: MARGIN_S,
  } as TextStyle,
  subtitle: {
    fontSize: FONT_SIZE_M,
    color: SECONDARY_TEXT_COLOR,
    marginBottom: MARGIN_XL,
  } as TextStyle,
  inputContainer: {
    marginBottom: MARGIN_L,
  } as ViewStyle,
  label: {
    fontSize: FONT_SIZE_M,
    fontWeight: FONT_WEIGHT_MEDIUM,
    color: PRIMARY_TEXT_COLOR,
    marginBottom: MARGIN_S,
  } as TextStyle,
  input: {
    backgroundColor: INPUT_BACKGROUND,
    borderWidth: 1,
    borderColor: INPUT_BORDER_COLOR,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingHorizontal: PADDING_M,
    paddingVertical: PADDING_L,
    fontSize: FONT_SIZE_M,
    color: PRIMARY_TEXT_COLOR,
    shadowColor: 'rgba(0, 0, 0, 0.03)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  } as TextStyle,
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: PADDING_L,
  } as TextStyle,
  submitButton: {
    backgroundColor: PRIMARY_BLUE,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingVertical: PADDING_L,
    alignItems: 'center',
    marginTop: MARGIN_L,
  } as ViewStyle,
  disabledButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.5)',
  } as ViewStyle,
  submitButtonText: {
    color: CARD_BACKGROUND,
    fontSize: FONT_SIZE_L,
    fontWeight: FONT_WEIGHT_MEDIUM,
  } as TextStyle,
  warningContainer: {
    backgroundColor: WARNING_BG,
    borderWidth: 1,
    borderColor: WARNING_BORDER,
    borderRadius: INPUT_BORDER_RADIUS,
    padding: PADDING_M,
    marginBottom: MARGIN_XL,
  } as ViewStyle,
  warningText: {
    color: WARNING_TEXT,
    fontSize: FONT_SIZE_M,
    marginBottom: MARGIN_S,
  } as TextStyle,
  warningButton: {
    backgroundColor: WARNING_BUTTON_BG,
    borderRadius: PADDING_S - 2,
    paddingVertical: PADDING_S,
    alignItems: 'center',
  } as ViewStyle,
  warningButtonText: {
    color: CARD_BACKGROUND,
    fontSize: FONT_SIZE_M,
    fontWeight: FONT_WEIGHT_MEDIUM,
  } as TextStyle,
});
