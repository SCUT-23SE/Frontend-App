import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Camera,
  Settings,
  LogOut,
  ChevronRight,
  History,
} from 'lucide-react-native';
import { useAuth } from '@/stores/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      id: 'history',
      title: '个人签到历史',
      icon: History,
      color: '#FF9800',
      onPress: () => router.push('/profile/check-in-history'),
    },
    {
      id: 'face',
      title: '人脸信息管理',
      icon: Camera,
      color: '#007AFF',
      onPress: () => router.push('/profile/face-management'),
    },
    {
      id: 'settings',
      title: '设置',
      icon: Settings,
      color: '#34C759',
      onPress: () => router.push('/profile/settings'),
    },
  ];

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {getInitial(user?.username || '')}
          </Text>
        </View>
        <Text style={styles.username}>{user?.username || '未登录'}</Text>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              index === menuItems.length - 1 && styles.menuItemLast,
            ]}
            onPress={item.onPress}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${item.color}1A` },
              ]}
            >
              <item.icon size={20} color={item.color} />
            </View>
            <Text style={styles.menuItemText}>{item.title}</Text>
            <ChevronRight
              size={18}
              color="#C7C7CC"
              style={styles.chevronIcon}
            />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButtonCard} onPress={handleLogout}>
        <LogOut size={20} color="#FF3B30" />
        <Text style={styles.logoutButtonText}>退出登录</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8FA',
  },
  header: {
    marginBottom: 12,

    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
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
  menuItemLast: {
    borderBottomWidth: 0,
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
  chevronIcon: {
    marginLeft: 8,
  },
  logoutButtonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  logoutButtonText: {
    fontSize: 15,
    color: '#FF3B30',
    marginLeft: 8,
    fontWeight: '400',
  },
});
