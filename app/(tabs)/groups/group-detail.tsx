import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Users, Mail, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useGroupsStore } from '@/stores/groups';

// --- Style Constants (Inspired by tasks/index.tsx) ---
const APP_BACKGROUND = '#F8F8FA';
const CARD_BACKGROUND = '#FFFFFF';
const PRIMARY_BLUE = '#007AFF';
const PRIMARY_TEXT_COLOR = '#1C1C1E';
const SECONDARY_TEXT_COLOR = '#8A8A8E';
const LIGHT_GRAY_BORDER = '#E5E5EA';
const ICON_BLUE = PRIMARY_BLUE;

const BADGE_SUCCESS_BG = '#E6F7EA'; // Light Green
const BADGE_SUCCESS_TEXT = '#389E0D';
const BADGE_WARNING_BG = '#FFFBE6'; // Light Orange/Yellow
const BADGE_WARNING_TEXT = '#FA8C16'; // Dark Orange/Yellow for text
const BADGE_ERROR_TEXT = '#FF4D4F';

const CARD_BORDER_RADIUS = 12;

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
const FONT_SIZE_XXL = 20; // Slightly reduced group name size

const FONT_WEIGHT_REGULAR = '400';
const FONT_WEIGHT_MEDIUM = '500';
const FONT_WEIGHT_SEMIBOLD = '600';
const FONT_WEIGHT_BOLD = '700';

// Card Shadow (Inspired by tasks/index.tsx)
const CARD_SHADOW_STYLE = {
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 6,
};
// --- End Style Constants ---

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const {
    currentGroup,
    currentGroupLoading,
    currentGroupError,
    applicationStatus,
    applicationStatusLoading,
    applicationStatusError,
    applicationSubmission,
    fetchGroupDetail,
    checkApplicationStatus,
    submitApplication,
    resetApplicationState,
  } = useGroupsStore();

  useEffect(() => {
    if (id) {
      fetchGroupDetail(id as string);
      checkApplicationStatus(id as string);
    }
    return () => {
      resetApplicationState();
    };
  }, [id]);

  const handleJoinRequest = () => {
    // 这里应该检查是否已录入人脸
    const hasFaceData = false; // 模拟检查结果

    if (!hasFaceData) {
      // 提示用户需要先录入人脸
      alert('需要先录入人脸信息才能申请加入用户组');
      // router.push('/profile/face-management');
      return;
    }

    setShowApplicationForm(true);
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('请输入申请理由');
      return;
    }
    await submitApplication(id as string, reason);
  };

  if (currentGroupLoading || applicationStatusLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY_BLUE} />
      </View>
    );
  }

  if (currentGroupError || applicationStatusError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {currentGroupError || applicationStatusError}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            fetchGroupDetail(id as string);
            checkApplicationStatus(id as string);
          }}
        >
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentGroup) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>用户组不存在</Text>
      </View>
    );
  }

  if (applicationSubmission.status === 'submitted') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>申请已提交</Text>
        <Text style={styles.message}>
          申请编号：{applicationSubmission.applicationId}
        </Text>
        <Text style={styles.time}>
          提交时间：
          {new Date(applicationSubmission.submitTime!).toLocaleString()}
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContentContainer}
    >
      <View style={styles.groupNameContainer}>
        <Text style={styles.groupName}>{currentGroup.name}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Users size={18} color={ICON_BLUE} />
            <Text style={styles.statText}>
              {currentGroup.memberCount} 名成员
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.section, styles.cardShadow]}>
        <Text style={styles.sectionTitle}>用户组介绍</Text>
        <Text style={styles.description}>{currentGroup.description}</Text>
      </View>

      {currentGroup.adminInfo && (
        <View style={[styles.section, styles.cardShadow]}>
          <Text style={styles.sectionTitle}>管理员信息</Text>
          <View style={styles.adminInfo}>
            <Text style={styles.adminName}>{currentGroup.adminInfo.name}</Text>
            <View style={styles.contactInfo}>
              <Mail size={16} color={SECONDARY_TEXT_COLOR} />
              <Text style={styles.contactText}>
                {currentGroup.adminInfo.contact}
              </Text>
            </View>
          </View>
        </View>
      )}

      {applicationStatus?.status === 'member' ? (
        <View style={[styles.statusContainer, styles.cardShadow]}>
          <Text style={[styles.statusText, styles.successText]}>
            您已是该组成员
          </Text>
        </View>
      ) : applicationStatus?.status === 'pending' ? (
        <View style={[styles.statusContainer, styles.cardShadow]}>
          <AlertCircle size={20} color={BADGE_WARNING_TEXT} />
          <Text style={[styles.statusText, styles.warningText]}>
            您的申请正在审核中
          </Text>
        </View>
      ) : showApplicationForm ? (
        <View style={[styles.applicationForm, styles.cardShadow]}>
          <Text style={styles.formLabel}>申请理由</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入申请理由"
            placeholderTextColor={SECONDARY_TEXT_COLOR}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {applicationSubmission.error && (
            <Text style={styles.errorTextForm}>
              {applicationSubmission.error}
            </Text>
          )}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                opacity:
                  applicationSubmission.status === 'submitting' ? 0.7 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={applicationSubmission.status === 'submitting'}
          >
            <Text style={styles.primaryButtonText}>
              {applicationSubmission.status === 'submitting'
                ? '提交中...'
                : '提交申请'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.primaryButton, styles.joinButtonMargin]}
          onPress={handleJoinRequest}
        >
          <Text style={styles.primaryButtonText}>申请加入</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_BACKGROUND,
  } as ViewStyle,
  scrollContentContainer: {
    paddingBottom: PADDING_XL, // Ensure space at the bottom
  } as ViewStyle,
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: PADDING_XL,
    backgroundColor: APP_BACKGROUND,
  } as ViewStyle,
  groupNameContainer: {
    backgroundColor: CARD_BACKGROUND,
    paddingVertical: PADDING_L,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY_BORDER,
    alignItems: 'center',
  } as ViewStyle,
  groupName: {
    fontSize: FONT_SIZE_XXL,
    fontWeight: FONT_WEIGHT_BOLD,
    color: PRIMARY_TEXT_COLOR,
    marginBottom: MARGIN_S,
    textAlign: 'center',
  } as TextStyle,
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  statText: {
    fontSize: FONT_SIZE_M,
    color: SECONDARY_TEXT_COLOR,
    marginLeft: MARGIN_S,
  } as TextStyle,
  section: {
    backgroundColor: CARD_BACKGROUND,
    padding: PADDING_L,
    marginHorizontal: PADDING_L,
    marginTop: MARGIN_L,
    marginBottom: 0,
    borderRadius: CARD_BORDER_RADIUS,
  } as ViewStyle,
  cardShadow: CARD_SHADOW_STYLE as ViewStyle,
  sectionTitle: {
    fontSize: FONT_SIZE_L,
    fontWeight: FONT_WEIGHT_SEMIBOLD,
    color: PRIMARY_TEXT_COLOR,
    marginBottom: MARGIN_M,
  } as TextStyle,
  description: {
    fontSize: FONT_SIZE_M,
    color: SECONDARY_TEXT_COLOR,
    lineHeight: 22,
  } as TextStyle,
  adminInfo: {
    marginTop: MARGIN_S,
  } as ViewStyle,
  adminName: {
    fontSize: FONT_SIZE_M,
    fontWeight: FONT_WEIGHT_MEDIUM,
    color: PRIMARY_TEXT_COLOR,
    marginBottom: MARGIN_S,
  } as TextStyle,
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  contactText: {
    fontSize: FONT_SIZE_S,
    color: SECONDARY_TEXT_COLOR,
    marginLeft: MARGIN_S,
  } as TextStyle,
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD_BACKGROUND,
    padding: PADDING_L,
    marginHorizontal: PADDING_L,
    marginTop: MARGIN_L,
    marginBottom: 0,
    borderRadius: CARD_BORDER_RADIUS,
  } as ViewStyle,
  statusText: {
    fontSize: FONT_SIZE_M,
    fontWeight: FONT_WEIGHT_MEDIUM,
    marginLeft: MARGIN_S,
  } as TextStyle,
  successText: {
    color: BADGE_SUCCESS_TEXT,
  } as TextStyle,
  warningText: {
    color: BADGE_WARNING_TEXT,
  } as TextStyle,
  applicationForm: {
    backgroundColor: CARD_BACKGROUND,
    padding: PADDING_L,
    marginHorizontal: PADDING_L,
    marginTop: MARGIN_L,
    marginBottom: 0,
    borderRadius: CARD_BORDER_RADIUS,
  } as ViewStyle,
  formLabel: {
    fontSize: FONT_SIZE_M,
    fontWeight: FONT_WEIGHT_MEDIUM,
    color: PRIMARY_TEXT_COLOR,
    marginBottom: MARGIN_S,
  } as TextStyle,
  input: {
    borderWidth: 1,
    borderColor: LIGHT_GRAY_BORDER,
    borderRadius: PADDING_S,
    paddingHorizontal: PADDING_M,
    paddingVertical: PADDING_M,
    fontSize: FONT_SIZE_M,
    color: PRIMARY_TEXT_COLOR,
    minHeight: 120,
    backgroundColor: APP_BACKGROUND,
    marginBottom: MARGIN_M,
  } as TextStyle,
  errorTextForm: {
    color: BADGE_ERROR_TEXT,
    fontSize: FONT_SIZE_S,
    marginBottom: MARGIN_M,
    textAlign: 'center',
  } as TextStyle,
  primaryButton: {
    backgroundColor: PRIMARY_BLUE,
    borderRadius: PADDING_S,
    paddingVertical: PADDING_M - 2,
    paddingHorizontal: PADDING_L,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: MARGIN_M,
  } as ViewStyle,
  primaryButtonText: {
    color: CARD_BACKGROUND,
    fontSize: FONT_SIZE_L,
    fontWeight: FONT_WEIGHT_MEDIUM,
  } as TextStyle,
  joinButtonMargin: {
    marginHorizontal: PADDING_L,
    marginTop: MARGIN_L,
  } as ViewStyle,
  title: {
    fontSize: FONT_SIZE_XL,
    fontWeight: FONT_WEIGHT_BOLD,
    color: PRIMARY_TEXT_COLOR,
    marginBottom: MARGIN_L,
  } as TextStyle,
  message: {
    fontSize: FONT_SIZE_M,
    color: SECONDARY_TEXT_COLOR,
    marginBottom: MARGIN_S,
    textAlign: 'center',
  } as TextStyle,
  time: {
    fontSize: FONT_SIZE_S,
    color: SECONDARY_TEXT_COLOR,
    marginBottom: PADDING_XL,
  } as TextStyle,
  errorText: {
    color: BADGE_ERROR_TEXT,
    fontSize: FONT_SIZE_M,
    marginBottom: MARGIN_M,
    textAlign: 'center',
  } as TextStyle,
  retryButton: {
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: PADDING_M - 2,
    paddingHorizontal: PADDING_L,
    borderRadius: PADDING_S,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: MARGIN_L,
  } as ViewStyle,
  retryText: {
    color: CARD_BACKGROUND,
    fontSize: FONT_SIZE_L,
    fontWeight: FONT_WEIGHT_MEDIUM,
  } as TextStyle,
});
