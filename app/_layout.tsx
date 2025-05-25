import React, { useEffect, ErrorInfo, useState } from 'react';
import { Redirect, Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform, LogBox } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
// 导入我们的位置服务初始化函数
import { initAMapLocation } from '@/services/location';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { handleDeepLink } from './utils/linking';

// 关闭Expo开发模式下的错误弹窗
// 忽略所有黄色警告
LogBox.ignoreAllLogs();

// 全局错误处理函数
const handleGlobalError = (error: Error, isFatal?: boolean) => {
  // 开发模式下，我们可以在控制台查看错误，但不显示弹窗
  if (__DEV__) {
    console.log('[错误已被全局捕获]:', error);
  }

  // 在这里可以添加额外的错误处理逻辑，比如错误日志上报等
  return true; // 返回true表示已处理错误
};

// 设置全局错误处理
// @ts-ignore - ErrorUtils 可能不在类型定义中
if (global.ErrorUtils) {
  // @ts-ignore
  global.ErrorUtils.setGlobalHandler(handleGlobalError);
}

// 预先请求位置权限函数
const requestLocationPermissions = async () => {
  try {
    // 检查位置服务是否开启
    const isLocationServicesEnabled = await Location.hasServicesEnabledAsync();

    if (isLocationServicesEnabled) {
      // 请求前台位置权限
      await Location.requestForegroundPermissionsAsync();

      // 初始化高德地图定位SDK
      await initAMapLocation();
    }
  } catch (error) {
    // 静默处理错误，避免错误弹窗
  }
};

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // 更新状态，下次渲染时显示备用UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 可以在这里记录错误日志
    if (__DEV__) {
      console.log('[组件错误已捕获]:', error);
    }
  }

  render() {
    if (this.state.hasError) {
      // 显示备用UI
      return (
        <View style={styles.errorContainer}>
          <StatusBar style="auto" />
        </View>
      );
    }

    return this.props.children;
  }
}

export default function RootLayout() {
  useFrameworkReady();
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const initializeNotifications = useNotificationStore(
    (state) => state.initialize
  );


  // 应用启动时请求位置权限
  useEffect(() => {
    requestLocationPermissions();
  }, []);

  // 初始化通知系统
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        await initializeNotifications();
      } catch (error) {
        // 静默处理错误
      }
    };

    setupNotifications();
  }, [initializeNotifications]);

  // 处理深度链接
  useEffect(() => {
    try {
      // 处理应用启动时的链接
      const getInitialURL = async () => {
        try {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            handleDeepLink(initialUrl);
          }
        } catch (linkError) {
          // 静默处理错误
        }
      };

      getInitialURL();

      // 添加链接监听器
      let subscription: { remove: () => void } | undefined;
      try {
        subscription = Linking.addEventListener('url', ({ url }) => {
          handleDeepLink(url);
        });
      } catch (listenerError) {
        // 静默处理错误
      }

      return () => {
        if (subscription) {
          subscription.remove();
        }
      };
    } catch (error) {
      // 静默处理错误
    }
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        {!isAuthenticated ? (
          <Redirect href="/login" />
        ) : (
          <Redirect href="/tasks" />
        )}
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            contentStyle: {
              paddingTop: Platform.OS === 'ios' ? 10 : 30,
            },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
