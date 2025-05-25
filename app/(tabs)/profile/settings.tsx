import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  ScrollView,
} from 'react-native';
import { useAuth } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { NotificationPermission } from '@/components/NotificationPermission';

// --- Style Constants (Copied from admin-task-form.tsx) ---
const APP_BACKGROUND = '#F8F8FA';
const CARD_BACKGROUND = '#FFFFFF';
const PRIMARY_BLUE = '#007AFF';
const PRIMARY_TEXT_COLOR = '#1C1C1E';
const SECONDARY_TEXT_COLOR = '#8A8A8E';
const LIGHT_GRAY_BORDER = '#E5E5EA';

const CARD_BORDER_RADIUS = 12;
const INPUT_BORDER_RADIUS = 8;

const PADDING_S = 8;
const PADDING_M = 12;
const PADDING_L = 16;
const PADDING_XL = 20;

const MARGIN_M = 12;
const MARGIN_L = 16;

const FONT_SIZE_M = 14;
const FONT_SIZE_L = 16;

const FONT_WEIGHT_MEDIUM = '500';
const FONT_WEIGHT_SEMIBOLD = '600';
// --- End Style Constants ---

export default function SettingsScreen() {
  const { user } = useAuth();
  const { permissionStatus } = useNotificationStore();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  // 倒计时效果
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    // 验证邮箱格式
    if (!email) {
      setError('请输入邮箱');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('邮箱格式不正确');
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      // 调用API发送验证码
      const success = await useAuth
        .getState()
        .sendVerificationCode(email, 'reset_password');
      if (success) {
        // 发送成功，开始60秒倒计时
        setCountdown(60);
        Alert.alert('成功', '验证码已发送至您的邮箱');
      }
    } catch (error: any) {
      // 根据API文档中定义的错误类型处理
      if (error.response?.status === 400) {
        setError('请求参数有误，请检查邮箱格式');
      } else if (error.response?.status === 404) {
        setError('该邮箱未注册，请先注册账号');
      } else if (error.response?.status === 410) {
        setError('验证码已过期，请重新获取');
      } else if (error.response?.status === 429) {
        setError('请求过于频繁，请稍后再试');
      } else {
        // 获取后端返回的错误消息
        const errorMessage =
          error.response?.data?.message || '发送验证码失败，请稍后重试';
        console.error('发送验证码失败', error);
        setError(errorMessage);
      }
    } finally {
      setSendingCode(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email || !verificationCode || !newPassword || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    if (newPassword.length < 8) {
      setError('新密码长度至少为8位');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('邮箱格式不正确');
      return;
    }

    setLoading(true);
    try {
      // 调用API重置密码
      const success = await useAuth
        .getState()
        .resetPassword(email, verificationCode, newPassword);
      if (success) {
        Alert.alert('成功', '密码重置成功');
        // 在密码重置成功后登出用户
        await useAuth.getState().logout();
        setEmail('');
        setVerificationCode('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
      }
    } catch (apiError: any) {
      // 根据API文档中定义的错误类型处理
      if (apiError.response?.status === 400) {
        setError('请求参数有误，请检查密码是否符合要求');
      } else if (apiError.response?.status === 401) {
        setError('验证码错误，请重新输入');
      } else if (apiError.response?.status === 404) {
        setError('该邮箱未注册，请先注册账号');
      } else if (apiError.response?.status === 410) {
        setError('验证码已过期，请重新获取');
      } else {
        // 获取后端返回的错误消息
        const errorMessage =
          apiError.response?.data?.message || '重置密码失败，请稍后重试';
        console.error('重置密码失败', apiError);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>账号信息</Text>
        <View style={styles.infoItem}>
          <Text style={styles.label}>用户名</Text>
          <Text style={styles.value}>{user?.username || '未登录'}</Text>
        </View>
      </View>

      {/* 通知设置部分 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通知设置</Text>

        {/* 通知权限请求组件 */}
        <NotificationPermission
          onGranted={() => Alert.alert('成功', '通知权限已启用')}
        />

        {/* 如果已经获得通知权限，显示通知设置开关 */}
        {permissionStatus === 'granted' && (
          <View>
            <View style={styles.notificationItem}>
              <Text style={styles.notificationLabel}>任务通知</Text>
              <Text style={styles.notificationDesc}>
                获取新任务和任务开始时的通知
              </Text>
              <Text style={styles.activeText}>已启用</Text>
            </View>

            <View style={styles.notificationItem}>
              <Text style={styles.notificationLabel}>申请审批通知</Text>
              <Text style={styles.notificationDesc}>
                获取入组申请和异常申诉通知
              </Text>
              <Text style={styles.activeText}>已启用</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>重置密码</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="邮箱"
          placeholderTextColor={SECONDARY_TEXT_COLOR}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading && !sendingCode}
        />

        <View style={styles.codeContainer}>
          <TextInput
            style={styles.codeInput}
            placeholder="验证码"
            placeholderTextColor={SECONDARY_TEXT_COLOR}
            keyboardType="numeric"
            value={verificationCode}
            onChangeText={setVerificationCode}
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.codeButton,
              (countdown > 0 || sendingCode || loading) &&
                styles.buttonDisabled,
            ]}
            onPress={handleSendCode}
            disabled={countdown > 0 || sendingCode || loading}
          >
            {sendingCode ? (
              <ActivityIndicator color={CARD_BACKGROUND} />
            ) : (
              <Text style={styles.codeButtonText}>
                {countdown > 0 ? `${countdown}秒` : '获取验证码'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="新密码（至少8位）"
          placeholderTextColor={SECONDARY_TEXT_COLOR}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="确认新密码"
          placeholderTextColor={SECONDARY_TEXT_COLOR}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={CARD_BACKGROUND} />
          ) : (
            <Text style={styles.buttonText}>重置密码</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  },
  section: {
    backgroundColor: CARD_BACKGROUND,
    paddingHorizontal: PADDING_L,
    paddingVertical: PADDING_XL,
    marginTop: MARGIN_M,
    marginHorizontal: MARGIN_M,
    borderRadius: CARD_BORDER_RADIUS,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: FONT_SIZE_L,
    fontWeight: FONT_WEIGHT_SEMIBOLD,
    color: PRIMARY_TEXT_COLOR,
    marginBottom: PADDING_L,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: PADDING_M,
  },
  label: {
    fontSize: FONT_SIZE_M,
    color: SECONDARY_TEXT_COLOR,
  },
  value: {
    fontSize: FONT_SIZE_M,
    color: PRIMARY_TEXT_COLOR,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },
  input: {
    borderWidth: 1,
    borderColor: LIGHT_GRAY_BORDER,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingVertical: PADDING_M,
    paddingHorizontal: PADDING_M,
    fontSize: FONT_SIZE_M,
    backgroundColor: APP_BACKGROUND,
    marginBottom: MARGIN_L,
    color: PRIMARY_TEXT_COLOR,
  },
  button: {
    backgroundColor: PRIMARY_BLUE,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingVertical: PADDING_L - PADDING_S / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: MARGIN_M,
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: CARD_BACKGROUND,
    fontSize: FONT_SIZE_L,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },
  lastInfoItem: {
    borderBottomWidth: 0,
  },

  notificationItem: {
    paddingVertical: PADDING_L,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY_BORDER,
  },

  notificationLabel: {
    fontSize: FONT_SIZE_L,
    fontWeight: FONT_WEIGHT_MEDIUM,
    color: PRIMARY_TEXT_COLOR,
    marginBottom: PADDING_S,
  },

  notificationDesc: {
    fontSize: FONT_SIZE_M,
    color: SECONDARY_TEXT_COLOR,
    marginBottom: PADDING_S,
  },

  activeText: {
    fontSize: FONT_SIZE_M,
    color: PRIMARY_BLUE,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },

  errorText: {
    color: 'red',
    marginBottom: PADDING_L,
    fontSize: FONT_SIZE_M,
  },

  codeContainer: {
    flexDirection: 'row',
    marginBottom: MARGIN_L,
  },

  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: LIGHT_GRAY_BORDER,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingVertical: PADDING_M,
    paddingHorizontal: PADDING_M,
    fontSize: FONT_SIZE_M,
    backgroundColor: APP_BACKGROUND,
    color: PRIMARY_TEXT_COLOR,
    marginRight: PADDING_M,
  },

  codeButton: {
    backgroundColor: PRIMARY_BLUE,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingHorizontal: PADDING_L,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },

  codeButtonText: {
    color: CARD_BACKGROUND,
    fontSize: FONT_SIZE_M,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },
});
