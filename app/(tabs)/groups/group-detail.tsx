import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Users, Mail, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useGroupsStore } from '@/stores/groups';

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
        <ActivityIndicator size="large" color="#4A90E2" />
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
          提交时间：{new Date(applicationSubmission.submitTime!).toLocaleString()}
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.groupName}>{currentGroup.name}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Users size={20} color="#4A90E2" />
            <Text style={styles.statText}>{currentGroup.memberCount} 名成员</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>用户组介绍</Text>
        <Text style={styles.description}>{currentGroup.description}</Text>
      </View>

      {currentGroup.adminInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>管理员信息</Text>
          <View style={styles.adminInfo}>
            <Text style={styles.adminName}>{currentGroup.adminInfo.name}</Text>
            <View style={styles.contactInfo}>
              <Mail size={16} color="#666" />
              <Text style={styles.contactText}>{currentGroup.adminInfo.contact}</Text>
            </View>
          </View>
        </View>
      )}

      {applicationStatus?.status === 'member' ? (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>您已是该组成员</Text>
        </View>
      ) : applicationStatus?.status === 'pending' ? (
        <View style={styles.statusContainer}>
          <AlertCircle size={20} color="#FF9800" />
          <Text style={[styles.statusText, { color: '#FF9800' }]}>
            您的申请正在审核中
          </Text>
        </View>
      ) : showApplicationForm ? (
        <View style={styles.applicationForm}>
          <Text style={styles.formLabel}>申请理由</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入申请理由"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {applicationSubmission.error && (
            <Text style={styles.errorText}>{applicationSubmission.error}</Text>
          )}
          <TouchableOpacity 
            style={[
              styles.submitButton,
              { opacity: applicationSubmission.status === 'submitting' ? 0.7 : 1 }
            ]}
            onPress={handleSubmit}
            disabled={applicationSubmission.status === 'submitting'}
          >
            <Text style={styles.submitButtonText}>
              {applicationSubmission.status === 'submitting' ? '提交中...' : '提交申请'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.joinButton} onPress={handleJoinRequest}>
          <Text style={styles.joinButtonText}>申请加入</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  adminInfo: {
    marginTop: 8,
  },
  adminName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#4CAF50',
    marginLeft: 8,
  },
  applicationForm: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  formLabel: {
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
  joinButton: {
    backgroundColor: '#4A90E2',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
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
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
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
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});