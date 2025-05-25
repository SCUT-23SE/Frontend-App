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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTasksStore } from '@/stores/tasks';
import { auditRequestsApi } from '@/request';
import { InlineObject10, BaseResponseCodeEnum } from '@/gen/models';
import * as ImagePicker from 'expo-image-picker';
import { Camera, AlertCircle } from 'lucide-react-native';

// --- Style Constants (从admin-task-form.tsx复制) ---
const APP_BACKGROUND = '#F8F8FA';
const CARD_BACKGROUND = '#FFFFFF';
const PRIMARY_BLUE = '#007AFF';
const PRIMARY_TEXT_COLOR = '#1C1C1E';
const SECONDARY_TEXT_COLOR = '#8A8A8E';
const LIGHT_GRAY_BORDER = '#E5E5EA';
const ICON_BLUE = PRIMARY_BLUE;

const BADGE_INFO_BG = '#EBF4FF';
const BADGE_WARNING_BG = '#FFFBE6';
const BADGE_WARNING_TEXT = '#FA8C16';
const BADGE_ERROR_BG = '#FFF1F0';
const BADGE_ERROR_TEXT = '#FF4D4F';

const CARD_BORDER_RADIUS = 12;
const INPUT_BORDER_RADIUS = 8;

const PADDING_XS = 4;
const PADDING_S = 8;
const PADDING_M = 12;
const PADDING_L = 16;
const PADDING_XL = 20;

const MARGIN_S = 8;
const MARGIN_M = 12;
const MARGIN_L = 16;

const FONT_SIZE_S = 12;
const FONT_SIZE_M = 14;
const FONT_SIZE_L = 16;
const FONT_SIZE_XL = 17;

const FONT_WEIGHT_REGULAR = '400';
const FONT_WEIGHT_MEDIUM = '500';
const FONT_WEIGHT_SEMIBOLD = '600';
// --- End Style Constants ---

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

    if (proofImages.length === 0) {
      Alert.alert('错误', '请至少上传一张证明材料图片');
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
        <View style={styles.successContent}>
          <Text style={styles.title}>申请已提交</Text>
          {requestId && (
            <Text style={styles.message}>申请编号：{requestId}</Text>
          )}
          <Text style={styles.time}>
            提交时间：{new Date().toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleClose}>
          <Text style={styles.submitButtonText}>关闭</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>申请信息</Text>

        <Text style={styles.label}>异常原因</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="请详细说明无法按时签到的原因"
          placeholderTextColor={SECONDARY_TEXT_COLOR}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={styles.imageSection}>
          <Text style={styles.label}>
            证明材料 <Text style={styles.requiredMark}>*</Text>
          </Text>
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.configButton} onPress={pickImage}>
              <Camera size={18} color={ICON_BLUE} />
              <Text style={styles.configButtonText}>从相册选择</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.configButton} onPress={takePhoto}>
              <Camera size={18} color={ICON_BLUE} />
              <Text style={styles.configButtonText}>拍照</Text>
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

          <Text style={styles.configHintText}>
            请上传能够证明您无法正常签到的材料，如请假条、病历、车票等
          </Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <AlertCircle size={20} color={BADGE_ERROR_TEXT} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (isSubmitting || !reason.trim() || proofImages.length === 0) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || !reason.trim() || proofImages.length === 0}
        >
          {isSubmitting ? (
            <ActivityIndicator color={CARD_BACKGROUND} />
          ) : (
            <Text style={styles.submitButtonText}>提交申请</Text>
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
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: PADDING_XL,
  },
  label: {
    fontSize: FONT_SIZE_M,
    fontWeight: FONT_WEIGHT_MEDIUM,
    color: PRIMARY_TEXT_COLOR,
    marginBottom: MARGIN_S,
  },
  requiredMark: {
    color: BADGE_ERROR_TEXT,
    fontWeight: FONT_WEIGHT_SEMIBOLD,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imageSection: {
    marginBottom: MARGIN_L,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: MARGIN_M,
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: PADDING_M - 2,
    paddingHorizontal: PADDING_L,
    backgroundColor: BADGE_INFO_BG,
    borderRadius: INPUT_BORDER_RADIUS,
    flex: 0.48,
    justifyContent: 'center',
  },
  configButtonText: {
    marginLeft: MARGIN_S,
    color: ICON_BLUE,
    fontSize: FONT_SIZE_M,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },
  configHintText: {
    fontSize: FONT_SIZE_S,
    color: SECONDARY_TEXT_COLOR,
    marginTop: MARGIN_S,
  },
  imageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: MARGIN_S,
    marginBottom: MARGIN_M,
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
    borderRadius: INPUT_BORDER_RADIUS,
    borderWidth: 1,
    borderColor: LIGHT_GRAY_BORDER,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: BADGE_ERROR_TEXT,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
  removeImageText: {
    color: CARD_BACKGROUND,
    fontWeight: FONT_WEIGHT_SEMIBOLD,
    fontSize: FONT_SIZE_S,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BADGE_ERROR_BG,
    paddingVertical: PADDING_M,
    paddingHorizontal: PADDING_L,
    marginTop: MARGIN_L,
    borderRadius: INPUT_BORDER_RADIUS,
    borderLeftWidth: 4,
    borderLeftColor: BADGE_ERROR_TEXT,
  },
  errorBannerText: {
    marginLeft: MARGIN_S,
    color: BADGE_ERROR_TEXT,
    fontSize: FONT_SIZE_M,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },
  submitButton: {
    backgroundColor: PRIMARY_BLUE,
    marginTop: MARGIN_L,
    marginBottom: PADDING_XS,
    paddingVertical: PADDING_L - PADDING_XS,
    borderRadius: INPUT_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitButtonText: {
    color: CARD_BACKGROUND,
    fontSize: FONT_SIZE_L,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },
  submitButtonDisabled: {
    backgroundColor: PRIMARY_BLUE,
    opacity: 0.5,
  },
  title: {
    fontSize: FONT_SIZE_XL,
    fontWeight: FONT_WEIGHT_SEMIBOLD,
    color: PRIMARY_TEXT_COLOR,
    marginBottom: MARGIN_L,
  },
  message: {
    fontSize: FONT_SIZE_M,
    color: SECONDARY_TEXT_COLOR,
    marginBottom: MARGIN_S,
  },
  time: {
    fontSize: FONT_SIZE_S,
    color: SECONDARY_TEXT_COLOR,
  },
});
