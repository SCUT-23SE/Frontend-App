import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ClipboardCopy,
  Users,
  CircleCheck as CheckCircle2,
  UserPlus,
  AlertTriangle,
} from 'lucide-react-native';
import { useGroupsStore } from '@/stores/groups';
import { useEffect } from 'react';

export default function GroupManageScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const {
    currentGroup,
    currentGroupLoading,
    currentGroupError,
    fetchGroupDetail,
  } = useGroupsStore();

  useEffect(() => {
    fetchGroupDetail(id as string);
  }, [id]);

  const handleCopyId = () => {
    // 在实际应用中，使用 Clipboard API
    alert('用户组 ID 已复制到剪贴板');
  };

  const menuItems = [
    {
      id: 'tasks',
      title: '签到任务管理',
      icon: CheckCircle2,
      color: '#4A90E2',
      onPress: () => router.push(`/groups/admin-tasks?id=${id}`),
    },
    {
      id: 'members',
      title: '成员列表',
      icon: Users,
      color: '#4CAF50',
      onPress: () => router.push(`/groups/admin-members?id=${id}`),
    },
    {
      id: 'applications',
      title: '入组申请',
      icon: UserPlus,
      color: '#FF9800',
      onPress: () => router.push(`/groups/admin-applications?id=${id}`),
    },
    {
      id: 'audit-requests',
      title: '管理异常情况',
      icon: AlertTriangle,
      color: '#E91E63',
      onPress: () => router.push(`/groups/admin-audit-requests?id=${id}`),
    },
  ];

  if (currentGroupLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (currentGroupError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{currentGroupError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchGroupDetail(id as string)}
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.groupName}>{currentGroup.name}</Text>
        <Text style={styles.description}>{currentGroup.description}</Text>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyId}>
          <Text style={styles.groupId}>ID: {id}</Text>
          <ClipboardCopy size={16} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuIcon}>
              <item.icon size={24} color={item.color} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupId: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  descriptionSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  menuSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    borderRadius: 12,
    marginHorizontal: 12,
    padding: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});
