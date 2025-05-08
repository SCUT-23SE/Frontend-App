import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { groupsService } from '@/services/groups-service';
import { JoinApplicationRequest } from '@/types/groups';
import { useGroupsStore } from '@/stores/groups';

export default function JoinGroupScreen() {
  const router = useRouter();
  const [groupId, setGroupId] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchGroups } = useGroupsStore();

  const handleSubmit = async () => {
    if (!groupId.trim()) {
      Alert.alert('提示', '请输入用户组ID');
      return;
    }

    setIsSubmitting(true);
    try {
      // 准备请求数据
      const requestData: JoinApplicationRequest = {
        groupId: groupId.trim(),
        reason: reason.trim(),
      };

      // 调用加入用户组的API
      const response = await groupsService.submitApplication(requestData);

      if (response.success) {
        Alert.alert('成功', '已提交加入申请，请等待管理员审核', [
          {
            text: '确定',
            onPress: () => {
              fetchGroups(); // 刷新用户组列表
              router.back(); // 返回到上一页
            },
          },
        ]);
      } else {
        Alert.alert('失败', response.error || '申请加入用户组失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '申请加入用户组时发生错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>加入用户组</Text>
          <Text style={styles.subtitle}>请输入用户组ID和申请理由</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>用户组ID *</Text>
            <TextInput
              style={styles.input}
              value={groupId}
              onChangeText={setGroupId}
              placeholder="请输入用户组ID"
              keyboardType="number-pad"
              maxLength={50}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>申请理由</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="请输入申请理由（可选）"
              multiline
              numberOfLines={4}
              maxLength={255}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!groupId.trim() || isSubmitting) && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={!groupId.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>提交申请</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#a0c4e8',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
