import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/stores/auth';
import THEME, { COLORS, FONTS, SIZES } from '@/utils/theme';
import Button from '@/components/Button';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [localError, setLocalError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    sendVerificationCode,
    loading,
    error: apiError,
    clearError,
  } = useAuth((state) => ({
    register: state.register,
    sendVerificationCode: state.sendVerificationCode,
    loading: state.loading,
    error: state.error,
    clearError: state.clearError,
  }));

  // 组件卸载时清除API错误
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // 倒计时效果
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // 显示本地验证错误或API错误
  const error = localError || apiError;

  const handleSendCode = async () => {
    // 验证邮箱格式
    if (!email) {
      setLocalError('请输入邮箱');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setLocalError('邮箱格式不正确');
      return;
    }

    setSendingCode(true);
    setLocalError('');

    try {
      const success = await sendVerificationCode(email, 'register');
      if (success) {
        // 发送成功，开始60秒倒计时
        setCountdown(60);
      }
    } catch (error: any) {
      // 根据API文档中定义的错误类型处理
      if (error.response?.status === 400) {
        setLocalError('请求参数有误，请检查邮箱格式');
      } else if (error.response?.status === 409) {
        setLocalError('该邮箱已被注册，请使用其他邮箱');
      } else if (error.response?.status === 410) {
        setLocalError('验证码已过期，请重新获取');
      } else if (error.response?.status === 429) {
        setLocalError('请求过于频繁，请稍后再试');
      } else {
        // 获取后端返回的错误消息
        const errorMessage =
          error.response?.data?.message || '发送验证码失败，请稍后重试';
        console.error('发送验证码失败', error);
        setLocalError(errorMessage);
      }
    } finally {
      setSendingCode(false);
    }
  };

  const handleRegister = async () => {
    // 表单验证
    setLocalError('');
    if (
      !username ||
      !password ||
      !confirmPassword ||
      !email ||
      !verificationCode
    ) {
      setLocalError('请填写所有字段');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('两次输入的密码不一致');
      return;
    }
    if (password.length < 8) {
      setLocalError('密码长度至少为8位');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setLocalError('邮箱格式不正确');
      return;
    }

    // 调用注册功能 - 让API错误通过useAuth的error状态处理
    try {
      const success = await register(
        username,
        password,
        email,
        verificationCode
      );

      // 注册成功时导航到登录页面
      if (success) {
        router.replace('/login');
      }
    } catch (error: any) {
      // 在某些情况下可能需要本地处理特定错误
      if (error.response?.status === 401) {
        setLocalError('验证码错误，请重新输入');
      } else if (error.response?.status === 409) {
        setLocalError('用户名或邮箱已被注册，请更换后重试');
      } else if (error.response?.status === 410) {
        setLocalError('验证码已过期，请重新获取');
      } else {
        // 获取后端返回的错误消息
        const errorMessage =
          error.response?.data?.message || '注册失败，请稍后重试';
        setLocalError(errorMessage);
      }
      // 其他错误通过useAuth的error状态显示
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={styles.backButtonText}>← 返回</Text>
      </TouchableOpacity>

      <Text style={styles.title}>创建账号</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="请输入用户名"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        editable={!loading}
        placeholderTextColor={COLORS.textTertiary}
      />

      <TextInput
        style={styles.input}
        placeholder="请输入邮箱"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading && !sendingCode}
        placeholderTextColor={COLORS.textTertiary}
      />

      <View style={styles.codeContainer}>
        <TextInput
          style={styles.codeInput}
          placeholder="请输入验证码"
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="numeric"
          editable={!loading}
          placeholderTextColor={COLORS.textTertiary}
        />
        <TouchableOpacity
          style={[
            styles.sendCodeButton,
            (countdown > 0 || sendingCode || loading) &&
              styles.sendCodeButtonDisabled,
          ]}
          onPress={handleSendCode}
          disabled={countdown > 0 || sendingCode || loading}
        >
          {sendingCode ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.sendCodeButtonText}>
              {countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="请输入密码（至少8位）"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
        placeholderTextColor={COLORS.textTertiary}
      />

      <TextInput
        style={styles.input}
        placeholder="请再次输入密码"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!loading}
        placeholderTextColor={COLORS.textTertiary}
      />

      <Button
        title={loading ? '注册中...' : '注册'}
        onPress={handleRegister}
        disabled={loading}
        fullWidth
        variant="primary"
        size="large"
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.paddingLarge,
    backgroundColor: COLORS.white,
  } as ViewStyle,
  backButton: {
    marginTop: 40,
    marginBottom: SIZES.marginLarge,
  } as ViewStyle,
  backButtonText: {
    ...FONTS.body,
    color: COLORS.primary,
  } as TextStyle,
  title: {
    ...FONTS.heading2,
    marginBottom: SIZES.marginLarge * 1.5,
    color: COLORS.textPrimary,
  } as TextStyle,
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.radiusMedium,
    paddingHorizontal: SIZES.paddingMedium,
    marginBottom: SIZES.marginMedium,
    fontSize: SIZES.fontBase,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
  } as TextStyle,
  button: {
    marginTop: SIZES.marginMedium,
  } as ViewStyle,
  error: {
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SIZES.marginMedium,
    ...FONTS.caption,
  } as TextStyle,
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.marginMedium,
  } as ViewStyle,
  codeInput: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.radiusMedium,
    paddingHorizontal: SIZES.paddingMedium,
    fontSize: SIZES.fontBase,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
    marginRight: SIZES.marginSmall,
  } as TextStyle,
  sendCodeButton: {
    height: 56,
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    borderRadius: SIZES.radiusMedium,
    paddingHorizontal: SIZES.paddingMedium,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 110,
  } as ViewStyle,
  sendCodeButtonDisabled: {
    backgroundColor: COLORS.divider,
  } as ViewStyle,
  sendCodeButtonText: {
    color: COLORS.white,
    ...FONTS.bodyBold,
  } as TextStyle,
});
