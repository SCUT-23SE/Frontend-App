import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/stores/auth';
import Button from '@/components/Button';
import THEME, { COLORS, FONTS, SIZES } from '@/utils/theme';
import { login as requestLogin, logout as requestLogout } from '@/request';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    login,
    loading,
    error: apiError,
    clearError,
  } = useAuth((state) => ({
    login: state.login,
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

  // 输入更改时清除错误
  useEffect(() => {
    if (localError || apiError) {
      setLocalError('');
      clearError();
    }
  }, [username, password, clearError, apiError]);

  // 显示本地验证错误或API错误
  const error = localError || apiError;

  const validateForm = () => {
    // 清除之前的错误
    setLocalError('');

    // 验证用户名不为空
    if (!username.trim()) {
      setLocalError('请输入用户名');
      return false;
    }

    // 验证密码不为空且长度合适
    if (!password) {
      setLocalError('请输入密码');
      return false;
    }

    if (password.length < 6) {
      setLocalError('密码长度不能少于6位');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    // 表单验证
    if (!validateForm()) {
      return;
    }

    // 开始登录，显示加载状态
    clearError();
    setLocalError('');

    // 使用try-catch确保错误不会传播到顶层
    try {
      // 尝试登录
      let response;
      try {
        response = await requestLogin(username, password);
      } catch (loginError: any) {
        // 处理API返回的错误
        let errorMessage = '登录失败，请稍后重试';

        if (loginError.response) {
          const { status, data } = loginError.response;

          // 使用API返回的错误消息（如果存在）
          if (data && data.message) {
            errorMessage = data.message;
          } else {
            // 根据状态码提供友好提示
            switch (status) {
              case 401:
                errorMessage = '用户名或密码错误';
                break;
              case 400:
                errorMessage = '请求参数错误，请检查输入';
                break;
              case 404:
                errorMessage = '用户不存在';
                break;
              case 429:
                errorMessage = '登录尝试次数过多，请稍后再试';
                break;
              case 500:
              case 502:
              case 503:
                errorMessage = '服务器暂时不可用，请稍后再试';
                break;
              default:
                errorMessage = `登录失败`;
            }
          }
        } else if (loginError.request) {
          // 网络错误
          errorMessage = '网络连接失败，请检查网络设置';
        }

        // 设置本地错误状态
        setLocalError(errorMessage);

        // 退出函数，不要抛出错误
        return;
      }

      // 如果登录成功，尝试设置用户状态
      if (response && typeof response === 'object') {
        try {
          const success = await login(username, password);
          if (success) {
            router.replace('/tasks');
          }
        } catch (stateError) {
          // 即使设置状态失败，也不抛出错误
          setLocalError('登录成功但设置用户状态失败，请重试');
        }
      }
    } catch (error) {
      // 防御性编程：捕获所有可能的未处理错误
      setLocalError('登录过程中发生错误，请稍后重试');

      // 静默处理错误，不输出到控制台
      // console.error('登录错误:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={styles.logo}>TeamTick</Text>
        <Text style={styles.subtitle}>智能考勤系统</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>用户名</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入用户名"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!loading}
            placeholderTextColor={COLORS.textTertiary}
          />

          <Text style={styles.inputLabel}>密码</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="请输入密码"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
              placeholderTextColor={COLORS.textTertiary}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={togglePasswordVisibility}
            >
              {showPassword ? (
                <EyeOff size={20} color={COLORS.textSecondary} />
              ) : (
                <Eye size={20} color={COLORS.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          <Button
            title={loading ? '登录中...' : '登录'}
            onPress={handleLogin}
            disabled={loading}
            fullWidth
            variant="primary"
            size="large"
            style={styles.loginButton}
          />

          <Link href="/register" asChild>
            <TouchableOpacity style={styles.linkButton} disabled={loading}>
              <Text style={styles.linkText}>还没有账号？立即注册</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  } as ViewStyle,
  scrollContent: {
    flexGrow: 1,
    padding: SIZES.paddingLarge,
  } as ViewStyle,
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: SIZES.marginLarge,
  } as ViewStyle,
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radiusMedium,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SIZES.shadowMedium,
  } as ViewStyle,
  logoImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  logo: {
    ...FONTS.heading1,
    textAlign: 'center',
    marginBottom: SIZES.marginSmall,
    color: COLORS.primary,
  } as TextStyle,
  subtitle: {
    ...FONTS.heading3,
    textAlign: 'center',
    marginBottom: SIZES.marginLarge * 2,
    color: COLORS.textSecondary,
  } as TextStyle,
  formContainer: {
    width: '100%',
  } as ViewStyle,
  inputLabel: {
    ...FONTS.bodyBold,
    marginBottom: SIZES.marginSmall,
    color: COLORS.textPrimary,
  } as TextStyle,
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.radiusMedium,
    paddingHorizontal: SIZES.paddingMedium,
    marginBottom: SIZES.marginLarge,
    fontSize: SIZES.fontBase,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
  } as TextStyle,
  errorContainer: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusSmall,
    padding: SIZES.paddingMedium,
    marginBottom: SIZES.marginLarge,
    borderWidth: 1,
    borderColor: COLORS.error,
  } as ViewStyle,
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.radiusMedium,
    marginBottom: SIZES.marginLarge,
    backgroundColor: COLORS.white,
    height: 56,
  } as ViewStyle,
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: SIZES.paddingMedium,
    fontSize: SIZES.fontBase,
    color: COLORS.textPrimary,
  } as TextStyle,
  eyeButton: {
    padding: SIZES.paddingMedium,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  loginButton: {
    marginTop: SIZES.marginMedium,
  } as ViewStyle,
  linkButton: {
    marginTop: SIZES.marginLarge,
    alignItems: 'center',
  } as ViewStyle,
  linkText: {
    color: COLORS.primary,
    ...FONTS.caption,
  } as TextStyle,
  error: {
    color: COLORS.error,
    textAlign: 'center',
    ...FONTS.caption,
  } as TextStyle,
});
