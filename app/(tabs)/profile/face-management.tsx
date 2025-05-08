import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera as CameraIcon, RefreshCw } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { faceApi } from '@/request';
import { useAuth } from '@/stores/auth';
import { formatUnixTimestamp } from '@/utils/date';

interface PhotoType {
  uri: string;
  width: number;
  height: number;
  exif?: any;
  base64?: string;
}

export default function FaceManagementScreen() {
  const [hasFaceData, setHasFaceData] = useState(false);
  const [faceImage, setFaceImage] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState('');
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // 从auth store获取用户信息
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // 获取用户人脸数据
    if (isAuthenticated && user) {
      fetchUserFace();
    }
  }, [isAuthenticated, user]);

  // 相机组件隐藏时重置相机就绪状态
  useEffect(() => {
    if (!isCameraVisible) {
      setIsCameraReady(false);
    }
  }, [isCameraVisible]);

  const fetchUserFace = async () => {
    if (!user) {
      return;
    }

    try {
      setIsLoading(true);
      // 使用auth store中的用户ID
      const userId = parseInt(user.id);

      const response = await faceApi.usersMeFaceGet(userId);
      if (response.data && response.data.data) {
        setHasFaceData(true);
        const responseData = response.data.data as any;
        if (responseData.faceImageBase64) {
          setFaceImage(
            `data:image/jpeg;base64,${responseData.faceImageBase64}`
          );
        }
        if (responseData.updatedAt) {
          setLastUpdateTime(formatUnixTimestamp(responseData.updatedAt));
        } else {
          setLastUpdateTime(new Date().toLocaleDateString());
        }
      } else {
        setHasFaceData(false);
        setFaceImage('');
        setLastUpdateTime('');
      }
    } catch (error: any) {
      if (
        error.isAxiosError &&
        error.response &&
        error.response.status === 404
      ) {
        setHasFaceData(false);
        setFaceImage('');
        setLastUpdateTime('');
        console.log('用户尚未设置人脸数据 (API 返回 404)');
      } else {
        console.error('获取人脸数据失败:', error);
        setHasFaceData(false);
        setFaceImage('');
        setLastUpdateTime('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptureFace = () => {
    if (permission?.granted) {
      setIsCameraVisible(true);
    } else {
      requestPermission();
    }
  };

  const handleUpdateFace = () => {
    if (permission?.granted) {
      setIsCameraVisible(true);
    } else {
      requestPermission();
    }
  };

  // 处理拍照结果
  const handlePhotoTaken = async (photo: PhotoType) => {
    try {
      // 处理图片，调整大小以减少文件大小
      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 300 } }],
        {
          format: ImageManipulator.SaveFormat.JPEG,
          compress: 0.5,
          base64: true,
        }
      );

      // 关闭摄像头预览
      setIsCameraVisible(false);

      if (manipResult.base64) {
        await uploadFaceImage(manipResult.base64);
      }
    } catch (error) {
      Alert.alert('错误', '处理照片失败，请重试');
      console.error('处理照片失败:', error);
    }
  };

  const uploadFaceImage = async (base64Image: string) => {
    if (!user) {
      Alert.alert('错误', '未找到用户信息，请重新登录');
      return;
    }

    try {
      setIsLoading(true);
      // 使用auth store中的用户ID
      const userId = parseInt(user.id);

      await faceApi.usersMeFacePut({
        userId,
        faceImageBase64: base64Image,
      });

      // 更新状态
      setHasFaceData(true);
      setFaceImage(`data:image/jpeg;base64,${base64Image}`);
      setLastUpdateTime(new Date().toLocaleDateString());

      Alert.alert('成功', '人脸信息已更新');
    } catch (error) {
      Alert.alert('错误', '上传人脸数据失败，请重试');
      console.error('上传人脸数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 检查用户是否已登录
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>请先登录</Text>
      </View>
    );
  }

  if (!permission) {
    // 摄像头权限加载中
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>正在获取摄像头权限...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // 摄像头权限未授予
    return (
      <View style={styles.container}>
        <Text style={styles.placeholderText}>
          需要摄像头权限才能进行人脸采集
        </Text>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>授予摄像头权限</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>正在处理...</Text>
      </View>
    );
  }

  if (isCameraVisible) {
    return (
      <View style={styles.cameraContainer}>
        {/* 相机视图 - 不再包含子组件 */}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          mode="picture"
          responsiveOrientationWhenOrientationLocked={true}
          onCameraReady={() => {
            console.log('相机准备就绪');
            setIsCameraReady(true);
          }}
          onMountError={(error) => {
            console.error('相机挂载错误:', error);
            Alert.alert('错误', '相机初始化失败，请重试');
            setIsCameraVisible(false);
          }}
        />

        {/* 相机覆盖层放在外面 */}
        <View style={styles.cameraOverlay}>
          <View style={styles.faceFrame} />
          <Text style={styles.cameraInstructions}>
            {isCameraReady ? '请将脸部置于框内' : '相机正在初始化...'}
          </Text>
        </View>

        {/* 相机控制按钮放在外面 */}
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsCameraVisible(false)}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.captureButton,
              !isCameraReady && styles.disabledButton,
            ]}
            disabled={!isCameraReady}
            onPress={async () => {
              try {
                if (!isCameraReady) {
                  Alert.alert('提示', '相机正在初始化，请稍等');
                  return;
                }

                if (cameraRef.current) {
                  setIsLoading(true);

                  // 优化相机拍照配置
                  const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false, // 改为false，让ImageManipulator生成Base64
                    exif: false,
                  });

                  // 处理拍摄的照片
                  await handlePhotoTaken(photo);
                } else {
                  Alert.alert('错误', '相机未初始化，请重试');
                }
              } catch (error) {
                console.error('拍照失败:', error);
                Alert.alert('错误', '拍照失败，请重试');
                setIsLoading(false);
              }
            }}
          >
            <View style={styles.captureCircle} />
          </TouchableOpacity>
          <View style={styles.spacer} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hasFaceData ? (
        <View style={styles.content}>
          <View style={styles.facePreview}>
            <Image
              source={{
                uri:
                  faceImage ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
              }}
              style={styles.faceImage}
            />
            <Text style={styles.lastUpdateText}>
              上次更新：{lastUpdateTime}
            </Text>
            <Text style={styles.userText}>用户ID: {user.id}</Text>
          </View>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdateFace}
          >
            <RefreshCw size={20} color="#fff" />
            <Text style={styles.buttonText}>更新人脸信息</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.placeholder}>
            <CameraIcon size={48} color="#999" />
            <Text style={styles.placeholderText}>未采集人脸信息</Text>
            <Text style={styles.placeholderSubText}>
              采集人脸信息后才能进行人脸识别签到
            </Text>
            <Text style={styles.userText}>用户ID: {user.id}</Text>
          </View>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCaptureFace}
          >
            <CameraIcon size={20} color="#fff" />
            <Text style={styles.buttonText}>采集人脸信息</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  placeholderSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  facePreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 16,
  },
  lastUpdateText: {
    fontSize: 14,
    color: '#666',
  },
  userText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#4A90E2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#A9C7ED',
    shadowColor: '#A9C7ED',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // 相机相关样式
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceFrame: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
  },
  cameraInstructions: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 4,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  captureCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cancelButton: {
    padding: 15,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spacer: {
    width: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
