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
  CheckCircle,
  UserPlus,
  AlertTriangle,
} from 'lucide-react-native';
import { useGroupsStore } from '@/stores/groups';
import { useEffect } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ListItem from '@/components/ListItem';
import ShareLinkButton from '@/app/components/ShareLinkButton';
import THEME, { COLORS, FONTS, SIZES } from '@/utils/theme';

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
      icon: CheckCircle,
      color: '#007AFF',
      onPress: () => router.push(`/groups/admin-tasks?id=${id}`),
    },
    {
      id: 'members',
      title: '成员列表',
      icon: Users,
      color: '#4CD964',
      onPress: () => router.push(`/groups/admin-members?id=${id}`),
    },
    {
      id: 'applications',
      title: '入组申请',
      icon: UserPlus,
      color: '#FF9500',
      onPress: () => router.push(`/groups/admin-applications?id=${id}`),
    },
    {
      id: 'audit-requests',
      title: '管理异常情况',
      icon: AlertTriangle,
      color: '#FF3B30',
      onPress: () => router.push(`/groups/admin-audit-requests?id=${id}`),
    },
  ];

  if (currentGroupLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (currentGroupError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{currentGroupError}</Text>
        <Button
          title="重试"
          onPress={() => fetchGroupDetail(id as string)}
          variant="primary"
          size="medium"
        />
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
        <View style={styles.idContainer}>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyId}>
            <Text style={styles.groupId}>ID: {id}</Text>
            <ClipboardCopy size={16} color="#8E8E93" />
          </TouchableOpacity>

          <ShareLinkButton
            type="group"
            id={id as string}
            label="分享邀请链接"
            mode="both"
            style={styles.shareButton}
          />
        </View>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${item.color}15` },
              ]}
            >
              <item.icon size={20} color={item.color} />
            </View>
            <Text style={styles.menuItemText}>{item.title}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F8FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 12,
  },
  header: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  groupName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 10,
  },
  idContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupId: {
    fontSize: 13,
    color: '#8E8E93',
    marginRight: 4,
  },
  shareButton: {
    marginLeft: 'auto',
  },
  menuSection: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEF',
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontWeight: '400',
  },
  chevron: {
    fontSize: 18,
    color: '#C7C7CC',
    marginLeft: 8,
  },
});
