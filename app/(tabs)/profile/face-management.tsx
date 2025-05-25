import { useState, useEffect } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
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
  const [isLoading, setIsLoading] = useState(false);

  // 从auth store获取用户信息
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // 获取用户人脸数据
    if (isAuthenticated && user) {
      fetchUserFace();
    }
  }, [isAuthenticated, user]);

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

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('需要权限', '需要访问您的相机来采集人脸信息');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];

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

        if (manipResult.base64) {
          await uploadFaceImage(manipResult.base64);
        }
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
    } catch (error: any) {
      // 处理特定的错误类型
      if (
        error.isAxiosError &&
        error.response &&
        error.response.status === 400 &&
        error.response.data
      ) {
        // 检查是否是"图片中未检测到人脸"的错误
        const responseData = error.response.data;
        if (
          responseData.message &&
          responseData.message.includes('图片中未检测到人脸')
        ) {
          Alert.alert(
            '人脸识别失败',
            '上传的图片中未检测到人脸，请确保：\n\n1. 面部清晰可见\n2. 光线充足\n3. 正面面对镜头\n\n请重新拍摄照片。'
          );
        } else {
          Alert.alert(
            '错误',
            responseData.message || '上传人脸数据失败，请重试'
          );
        }
      } else {
        Alert.alert('错误', '上传人脸数据失败，请重试');
      }
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>正在处理...</Text>
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

          <TouchableOpacity style={styles.updateButton} onPress={takePhoto}>
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

          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
