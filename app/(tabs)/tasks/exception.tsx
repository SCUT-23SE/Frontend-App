import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTasksStore } from '@/stores/tasks';
import { auditRequestsApi } from '@/request';
import { InlineObject10, BaseResponseCodeEnum } from '@/gen/models';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';

export default function ExceptionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const { exception, submitException, resetExceptionState } = useTasksStore();

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('需要权限', '需要访问您的相册来选择证明图片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImage = result.assets[0].uri;
      setProofImages([...proofImages, newImage]);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('需要权限', '需要访问您的相机来拍摄证明图片');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImage = result.assets[0].uri;
      setProofImages([...proofImages, newImage]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...proofImages];
    newImages.splice(index, 1);
    setProofImages(newImages);
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('错误', '请填写异常原因');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // 先上传图片（这里仅为示例，实际项目可能需要实现图片上传功能）
      // 在实际项目中，这里应该调用上传图片API并获取图片URL
      const uploadedImageUrls: string[] = proofImages;

      // 构建请求参数
      const requestData: InlineObject10 = {
        reason: reason,
        proofImageUrls: uploadedImageUrls.join(','),
      };

      // 调用API提交异常申请
      const response =
        await auditRequestsApi.checkinTasksTaskIdAuditRequestsPost(
          parseInt(id as string),
          requestData
        );

      if (
        response.data &&
        response.data.code === BaseResponseCodeEnum._0 &&
        response.data.data
      ) {
        // 提交成功
        setIsSuccess(true);

        // 安全地处理响应数据
        const responseData = response.data.data;
        if (typeof responseData === 'object' && responseData !== null) {
          // TypeScript类型保护，确保安全访问auditRequestId
          const auditData = responseData as { auditRequestId?: number };
          if (auditData.auditRequestId) {
            setRequestId(String(auditData.auditRequestId));
          }
        }

        Alert.alert('成功', '异常申请已提交，等待管理员审核');
      } else {
        // 提交失败
        const errorMsg =
          typeof response.data?.data === 'string'
            ? response.data.data
            : '提交申请失败';
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetExceptionState();
    router.back();
  };

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>申请已提交</Text>
          {requestId && (
            <Text style={styles.message}>申请编号：{requestId}</Text>
          )}
          <Text style={styles.time}>
            提交时间：{new Date().toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleClose}>
          <Text style={styles.buttonText}>关闭</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>异常原因</Text>
        <TextInput
          style={styles.input}
          placeholder="请详细说明无法按时签到的原因"
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={styles.imageSection}>
          <Text style={styles.label}>证明材料（可选）</Text>
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Camera size={20} color="#4A90E2" />
              <Text style={styles.imageButtonText}>从相册选择</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Camera size={20} color="#4A90E2" />
              <Text style={styles.imageButtonText}>拍照</Text>
            </TouchableOpacity>
          </View>

          {proofImages.length > 0 && (
            <View style={styles.imageList}>
              {proofImages.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removeImageText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.submitButton, { opacity: isSubmitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isSubmitting || !reason.trim()}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? '提交中...' : '提交申请'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#F5F5F5',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  time: {
    fontSize: 14,
    color: '#999',
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    margin: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 8,
  },
  imageSection: {
    marginTop: 16,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  imageButtonText: {
    color: '#4A90E2',
    marginLeft: 8,
    fontWeight: '500',
  },
  imageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  imageContainer: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.5%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F44336',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
