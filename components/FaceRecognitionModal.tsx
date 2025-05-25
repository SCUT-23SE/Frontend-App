import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Alert,
  AppState,
} from 'react-native';
import { CameraView, Camera, CameraType } from 'expo-camera';
import { ActivityIndicator } from 'react-native';
import { XCircle, CheckCircle2 } from 'lucide-react-native';

// 人脸识别相关的常量配置
const CAPTURE_INTERVAL = 800; // 拍摄间隔(毫秒): 每0.4秒拍摄一次
const VERIFY_INTERVAL = 4000; // 校验间隔(毫秒): 每2秒校验一次
const TIMEOUT_DURATION = 60000; // 超时时间(毫秒): 30秒后超时
const MAX_IMAGES_PER_REQUEST = 5; // 每次请求最多发送的图片数量
const COUNTDOWN_INTERVAL = 1000; // 倒计时更新间隔(毫秒): 每1秒更新一次

interface FaceRecognitionModalProps {
  visible: boolean; // 模态框是否可见
  onClose: () => void; // 关闭模态框的回调
  onVerificationComplete: (success: boolean) => void; // 验证完成的回调 (成功或失败)
  onCaptureImage: (imageBase64: string[]) => Promise<boolean>; // 捕获图像并发送验证的回调，返回验证是否成功
}

export default function FaceRecognitionModal({
  visible,
  onClose,
  onVerificationComplete,
  onCaptureImage,
}: FaceRecognitionModalProps) {
  // 状态变量
  const [hasPermission, setHasPermission] = useState<boolean | null>(null); // 相机权限状态
  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'processing' | 'success' | 'failed' | 'timeout' | 'adjusting'
  >('idle'); // 验证状态
  const [guidanceMessage, setGuidanceMessage] =
    useState<string>('请将面部对准取景框，并缓慢张嘴'); // 修改初始引导信息，提示用户张嘴
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    Math.floor(TIMEOUT_DURATION / 1000)
  ); // 剩余秒数状态

  const [isCapturing, setIsCapturing] = useState(false); // 是否正在执行拍照定时器
  const [isVerifying, setIsVerifying] = useState(false); // 是否正在执行验证定时器
  const [isCountingDown, setIsCountingDown] = useState(false); // 是否正在倒计时

  // Ref 引用
  const cameraRef = useRef<CameraView>(null); // 相机组件的引用
  const captureTimerRef = useRef<ReturnType<typeof setInterval> | null>(null); // 拍照定时器ID
  const verifyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null); // 验证定时器ID
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null); // 倒计时定时器ID
  const overallTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // 整体超时定时器ID

  const imageBufferRef = useRef<string[]>([]); // 存储拍摄的Base64图像数据缓冲区
  const isProcessingVerifyRef = useRef(false); // 是否正在处理单次验证API调用（防止并发）
  // initialVerificationDoneRef 不再需要，因为我们一进来就开始拍摄和验证
  const attemptCountRef = useRef(0); // 尝试验证的次数
  const startTimeRef = useRef<number>(0); // 识别流程开始时间戳
  const appStateRef = useRef(AppState.currentState); // 应用当前状态 (active, background, inactive)
  const isModalActiveRef = useRef(false); // 标记模态框会话是否处于活动状态，用于异步操作控制

  // 清除所有定时器
  const clearAllTimers = useCallback(() => {
    setIsCapturing(false); // 停止触发拍照定时器的useEffect
    setIsVerifying(false); // 停止触发验证定时器的useEffect
    setIsCountingDown(false); // 停止倒计时定时器

    if (captureTimerRef.current) {
      clearInterval(captureTimerRef.current);
      captureTimerRef.current = null;
    }
    if (verifyTimerRef.current) {
      clearInterval(verifyTimerRef.current);
      verifyTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (overallTimeoutRef.current) {
      clearTimeout(overallTimeoutRef.current);
      overallTimeoutRef.current = null;
    }
  }, []);

  // 更新引导信息函数
  const updateGuidanceMessage = useCallback(
    (seconds: number) => {
      if (verificationStatus === 'success') {
        return; // 如果已成功，不更新引导信息
      }

      if (seconds <= 0) {
        setGuidanceMessage('识别超时，请重新尝试');
      } else if (seconds <= 5) {
        setGuidanceMessage(
          `请明显地张嘴再闭上，完成活体验证 (剩余${seconds}秒)`
        );
      } else {
        setGuidanceMessage(`请正对镜头，缓慢张大嘴巴再闭合 (剩余${seconds}秒)`);
      }
    },
    [verificationStatus]
  );

  // 拍照函数
  const captureImage = useCallback(async () => {
    if (!isModalActiveRef.current || !cameraRef.current) {
      return;
    }
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0, // 图像质量
        base64: true, // 返回Base64编码的图像数据
      });
      if (photo && photo.base64 && isModalActiveRef.current) {
        imageBufferRef.current.push(photo.base64); // 添加照片到缓冲区

        // 只有当缓冲区达到5张照片时才触发验证
        if (imageBufferRef.current.length >= MAX_IMAGES_PER_REQUEST) {
          triggerVerification();
        }
      }
    } catch (error) {
      // console.error('拍照失败:', error);
    }
  }, []); // 依赖项通常为空或包含稳定的引用

  // 触发验证的辅助函数
  const triggerVerification = useCallback(() => {
    if (
      !isModalActiveRef.current ||
      imageBufferRef.current.length < MAX_IMAGES_PER_REQUEST
    ) {
      console.log(
        `缓冲区照片数不足: ${imageBufferRef.current.length}/${MAX_IMAGES_PER_REQUEST}`
      );
      return; // 如果没有足够的5张照片，直接返回
    }

    // 确保只取5张图片
    const imagesToSend = imageBufferRef.current.slice(
      0,
      MAX_IMAGES_PER_REQUEST
    );
    // 立即清空缓冲区，允许新的照片进入
    imageBufferRef.current = [];

    // 确保有5张照片才发送
    if (imagesToSend.length === MAX_IMAGES_PER_REQUEST) {
      console.log(`准备发送验证请求，照片数量: ${imagesToSend.length}`);
      // 无需等待验证完成，允许并发请求
      sendVerificationRequest(imagesToSend);
    } else {
      console.warn(`照片数量异常: ${imagesToSend.length}，不发送验证请求`);
    }
  }, []);

  // 发送验证请求的辅助函数
  const sendVerificationRequest = useCallback(
    async (images: string[]) => {
      // 再次检查照片数量
      if (images.length !== MAX_IMAGES_PER_REQUEST) {
        console.warn(
          `验证请求照片数量不正确: ${images.length}，应为${MAX_IMAGES_PER_REQUEST}`
        );
        return;
      }

      if (!isModalActiveRef.current) {
        console.log('模态框已关闭，取消发送验证请求');
        return;
      }

      // 移除并发限制，允许多个请求同时进行
      // isProcessingVerifyRef.current 仅用于UI显示加载状态
      isProcessingVerifyRef.current = true;
      attemptCountRef.current += 1;

      try {
        console.log(`开始发送${images.length}张照片进行验证...`);

        if (!isModalActiveRef.current) {
          console.log('模态框已关闭，中止验证过程');
          return; // 如果组件已不再活跃，则不处理
        }

        // 发送图像数据进行验证
        const success = await onCaptureImage(images);
        console.log(`验证请求完成，结果: ${success ? '成功' : '失败'}`);

        // 再次检查组件是否活跃
        if (!isModalActiveRef.current) {
          console.log('模态框已关闭，不处理验证结果');
          return; // 如果组件已不再活跃，则不处理
        }

        if (success) {
          clearAllTimers();
          setVerificationStatus('success');
          setGuidanceMessage('验证通过！');
          setTimeout(() => onVerificationComplete(true), 1000);
          return;
        }

        // 不再在这里更新倒计时和引导信息，由独立的倒计时定时器负责
      } catch (error) {
        if (isModalActiveRef.current) {
          setGuidanceMessage('识别过程出现错误，请重新尝试');
        }
        // console.error('验证图像失败:', error);
      } finally {
        if (isModalActiveRef.current) {
          isProcessingVerifyRef.current = false; // 无论成功失败，都重置处理状态
        }
      }
    },
    [clearAllTimers, onCaptureImage, onVerificationComplete]
  );

  // 验证图像函数 - 由定时器调用
  const verifyImages = useCallback(() => {
    if (!isModalActiveRef.current) {
      return;
    }

    // 只有当缓冲区有足够的5张照片时才触发验证
    if (imageBufferRef.current.length >= MAX_IMAGES_PER_REQUEST) {
      console.log(
        'verifyImages: Buffer size before send:',
        imageBufferRef.current.length
      );

      // 触发验证
      triggerVerification();
    }
  }, [triggerVerification]);

  // 倒计时函数 - 由定时器调用
  const updateCountdown = useCallback(() => {
    if (!isModalActiveRef.current) {
      return;
    }

    const elapsedTime = Date.now() - startTimeRef.current;
    const remaining = Math.max(
      0,
      Math.floor((TIMEOUT_DURATION - elapsedTime) / 1000)
    );

    setRemainingSeconds(remaining);

    // 更新引导信息
    updateGuidanceMessage(remaining);

    // 如果倒计时结束且验证状态不是成功，则触发超时
    if (remaining <= 0 && verificationStatus !== 'success') {
      clearAllTimers();
      setVerificationStatus('timeout');
      setTimeout(() => onVerificationComplete(false), 1000);
    }
  }, [
    clearAllTimers,
    onVerificationComplete,
    updateGuidanceMessage,
    verificationStatus,
  ]);

  // 暂停所有定时器（通常用于应用切换到后台）
  const pauseAllTimers = useCallback(() => {
    if (captureTimerRef.current) {
      clearInterval(captureTimerRef.current);
      captureTimerRef.current = null; // 设为null以便restartTimers可以重建
    }
    if (verifyTimerRef.current) {
      clearInterval(verifyTimerRef.current);
      verifyTimerRef.current = null; // 设为null以便restartTimers可以重建
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null; // 设为null以便restartTimers可以重建
    }
    // 注意：这里没有改变 isCapturing 和 isVerifying 的状态
    // 目的是让 restartTimers 知道之前它们是否在运行
  }, []);

  // 重启定时器（通常用于应用从后台恢复）
  const restartTimers = useCallback(() => {
    // 仅当模态框活动且之前就在拍照/验证时才重启
    if (!isModalActiveRef.current) return;

    if (isCapturing && !captureTimerRef.current) {
      captureTimerRef.current = setInterval(captureImage, CAPTURE_INTERVAL);
    }
    if (isVerifying && !verifyTimerRef.current) {
      verifyTimerRef.current = setInterval(verifyImages, VERIFY_INTERVAL);
    }
    if (isCountingDown && !countdownTimerRef.current) {
      countdownTimerRef.current = setInterval(
        updateCountdown,
        COUNTDOWN_INTERVAL
      );
    }
  }, [
    isCapturing,
    isVerifying,
    isCountingDown,
    captureImage,
    verifyImages,
    updateCountdown,
    CAPTURE_INTERVAL,
    VERIFY_INTERVAL,
    COUNTDOWN_INTERVAL,
  ]);

  // 开始人脸识别流程
  const startFaceRecognition = useCallback(() => {
    // isModalActiveRef 此时应该为 true (由 useEffect([visible, hasPermission]) 设置)
    clearAllTimers(); // 清理可能存在的旧定时器和状态

    // 重置状态变量和引用
    setVerificationStatus('processing'); // 设置为处理中状态
    setGuidanceMessage('请正对镜头，完成张嘴动作进行活体验证'); // 更明确的初始引导信息
    setRemainingSeconds(Math.floor(TIMEOUT_DURATION / 1000)); // 重置倒计时
    imageBufferRef.current = []; // 清空图像缓冲区
    isProcessingVerifyRef.current = false; // 重置API调用锁
    attemptCountRef.current = 0; // 重置尝试次数
    startTimeRef.current = Date.now(); //记录开始时间

    // 设置总超时
    overallTimeoutRef.current = setTimeout(() => {
      if (!isModalActiveRef.current) return; // 超时触发时，再次检查模态框是否活动
      clearAllTimers();
      setVerificationStatus('timeout');
      setGuidanceMessage('识别超时，请重试');
      setTimeout(() => {
        onVerificationComplete(false);
      }, 1000);
    }, TIMEOUT_DURATION);

    // 直接开始周期性拍照和验证
    setIsCapturing(true);
    setIsVerifying(true);
    setIsCountingDown(true); // 启动倒计时
  }, [clearAllTimers, onVerificationComplete, TIMEOUT_DURATION]);

  // 监听应用状态变化，处理应用切换到后台/前台的情况
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const currentAppState = appStateRef.current;
      appStateRef.current = nextAppState; // 更新当前状态

      if (
        currentAppState === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // 应用从前台切换到后台或非活动状态
        if (isModalActiveRef.current) {
          // 仅当模态框活跃时才暂停
          pauseAllTimers();
        }
      } else if (
        currentAppState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // 应用从后台或非活动状态恢复到前台
        if (isModalActiveRef.current) {
          // 仅当模态框应该活跃时才重启
          restartTimers();
        }
      }
    });

    return () => {
      subscription.remove(); // 清理事件监听
    };
  }, [pauseAllTimers, restartTimers]); // isCapturing, isVerifying 从依赖中移除，因为它们在restartTimers内部被读取

  // 请求相机权限
  useEffect(() => {
    let isMounted = true; // 处理异步操作中的组件卸载情况
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (isMounted) {
        setHasPermission(status === 'granted');
        if (status !== 'granted') {
          Alert.alert('权限被拒绝', '需要相机权限才能继续人脸验证');
          onClose(); // 关闭模态框，这将触发下面的useEffect来设置isModalActiveRef.current = false
        }
      }
    })();

    return () => {
      isMounted = false; // 组件卸载
      // isModalActiveRef.current = false; // 确保卸载时设置为非活动
      // clearAllTimers(); // 确保卸载时清理定时器
      // 上面两行已包含在 useEffect([visible, hasPermission]) 的 !visible 分支，当 onClose 触发 visible 改变时
      // 但如果是因为父组件直接移除此模态框（非通过onClose），这里直接设置更保险
      // 不过标准的关闭流程是通过 onClose -> visible 变化 -> 下面的useEffect
    };
  }, [onClose]); // clearAllTimers 从依赖中移除，因为它不应导致此effect重跑

  // 当模态框可见性或权限变化时，控制识别流程的启动与停止
  useEffect(() => {
    if (visible && hasPermission) {
      // 模态框变为可见且有权限
      isModalActiveRef.current = true; // 标记模态框会话开始
      startFaceRecognition(); // 开始识别流程
    } else if (!visible && isModalActiveRef.current) {
      // 仅当之前是 active 时才执行清理
      // 模态框变为不可见 (或者初次渲染时 visible 为 false)
      // 确保这是在模态框从活动状态关闭时才执行的清理
      isModalActiveRef.current = false; // 标记模态框会话结束
      clearAllTimers(); // 清理所有定时器

      // 重置所有相关状态和引用，为下次打开做准备
      setVerificationStatus('idle');
      setGuidanceMessage('请将面部对准取景框，完成张嘴动作'); // 简化重置信息
      setRemainingSeconds(Math.floor(TIMEOUT_DURATION / 1000)); // 重置倒计时
      // initialVerificationDoneRef.current = false; // 已移除
      isProcessingVerifyRef.current = false;
      imageBufferRef.current = [];
      attemptCountRef.current = 0;
      // setIsCapturing(false) 和 setIsVerifying(false) 由 clearAllTimers 内部处理
    }
  }, [visible, hasPermission, startFaceRecognition, clearAllTimers]);

  // 定时器管理 Effect: 拍照
  useEffect(() => {
    if (isCapturing && isModalActiveRef.current) {
      // 增加 isModalActiveRef.current 条件
      if (!captureTimerRef.current) {
        // 只有当定时器不存在时才创建
        captureTimerRef.current = setInterval(captureImage, CAPTURE_INTERVAL);
      }
    } else {
      // isCapturing 为 false 或模态框不再活动，清除定时器
      if (captureTimerRef.current) {
        clearInterval(captureTimerRef.current);
        captureTimerRef.current = null;
      }
    }

    // 组件卸载或 isCapturing/captureImage 变化时清理定时器
    return () => {
      if (captureTimerRef.current) {
        clearInterval(captureTimerRef.current);
        captureTimerRef.current = null;
      }
    };
  }, [isCapturing, captureImage, CAPTURE_INTERVAL]);

  // 定时器管理 Effect: 验证
  useEffect(() => {
    if (isVerifying && isModalActiveRef.current) {
      // 增加 isModalActiveRef.current 条件
      if (!verifyTimerRef.current) {
        // 只有当定时器不存在时才创建
        verifyTimerRef.current = setInterval(verifyImages, VERIFY_INTERVAL);
      }
    } else {
      // isVerifying 为 false 或模态框不再活动，清除定时器
      if (verifyTimerRef.current) {
        clearInterval(verifyTimerRef.current);
        verifyTimerRef.current = null;
      }
    }

    // 组件卸载或 isVerifying/verifyImages 变化时清理定时器
    return () => {
      if (verifyTimerRef.current) {
        clearInterval(verifyTimerRef.current);
        verifyTimerRef.current = null;
      }
    };
  }, [isVerifying, verifyImages, VERIFY_INTERVAL]);

  // 定时器管理 Effect: 倒计时
  useEffect(() => {
    if (isCountingDown && isModalActiveRef.current) {
      if (!countdownTimerRef.current) {
        // 立即执行一次更新，然后设置定时器
        updateCountdown();
        countdownTimerRef.current = setInterval(
          updateCountdown,
          COUNTDOWN_INTERVAL
        );
      }
    } else {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    }

    // 组件卸载或依赖变化时清理定时器
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [isCountingDown, updateCountdown, COUNTDOWN_INTERVAL]);

  // UI渲染部分
  if (hasPermission === null) {
    // 正在请求权限时，不渲染任何内容或显示加载指示器
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={() => {
        // Android 返回按钮关闭模态框时触发
        // isModalActiveRef.current = false; // 由 visible 变化的useEffect处理
        clearAllTimers(); // 确保清理
        onClose(); // 通知父组件关闭
      }}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            // isModalActiveRef.current = false; // 由 visible 变化的useEffect处理
            clearAllTimers(); // 确保清理
            onClose(); // 通知父组件关闭
          }}
        >
          <XCircle size={30} color="#fff" />
        </TouchableOpacity>

        {hasPermission === false && (
          <View style={styles.noCameraContainer}>
            <Text style={styles.noCameraText}>相机权限已被拒绝</Text>
            <Text style={styles.noCameraText}>请在系统设置中开启权限</Text>
          </View>
        )}

        {hasPermission && (
          <View style={styles.cameraContainer}>
            <View style={styles.cameraBackground} />
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="front" // 使用前置摄像头
              animateShutter={false} // 关闭快门动画
            />
            <View style={styles.overlay}>
              <View style={styles.faceFrame} />

              <View style={styles.statusContainer}>
                {(verificationStatus === 'processing' ||
                  verificationStatus === 'adjusting') && (
                  <Text style={styles.statusText}>{guidanceMessage}</Text>
                )}
                {verificationStatus === 'success' && (
                  <View style={styles.resultContainer}>
                    <CheckCircle2 size={50} color="#4CAF50" />
                    <Text style={[styles.statusText, { color: '#4CAF50' }]}>
                      验证成功
                    </Text>
                  </View>
                )}
                {verificationStatus === 'failed' && ( // 'failed' 状态当前逻辑中未被主动设置，可考虑移除或完善
                  <View style={styles.resultContainer}>
                    <XCircle size={50} color="#F44336" />
                    <Text style={[styles.statusText, { color: '#F44336' }]}>
                      验证失败
                    </Text>
                  </View>
                )}
                {verificationStatus === 'timeout' && (
                  <View style={styles.resultContainer}>
                    <XCircle size={50} color="#FF9800" />
                    <Text style={[styles.statusText, { color: '#FF9800' }]}>
                      {guidanceMessage}
                    </Text>
                  </View>
                )}
              </View>

              {/* 移除加载动画 */}
              {/* 
              {(verificationStatus === 'processing' ||
                verificationStatus === 'adjusting') &&
                isProcessingVerifyRef.current && (
                  <ActivityIndicator
                    size="large"
                    color="#4A90E2"
                    style={styles.activityIndicator}
                  />
                )}
              */}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40, // 适配iOS刘海屏
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  cameraBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 1,
  },
  camera: {
    flex: 1,
    zIndex: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  faceFrame: {
    width: 250,
    height: 350,
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderRadius: 20, // 圆角取景框
  },
  statusContainer: {
    position: 'absolute',
    bottom: 100, // 状态信息位置
    width: '90%', // 宽度调整
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', // 半透明背景以增强可读性
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', // 更深的半透明背景
    padding: 20,
    borderRadius: 10,
  },
  activityIndicator: {
    position: 'absolute',
    bottom: 50, // 加载动画位置
  },
  noCameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333', // 深色背景
  },
  noCameraText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
