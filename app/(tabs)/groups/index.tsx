import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  ChevronRight,
  Plus,
  UserPlus,
  PlusCircle,
} from 'lucide-react-native';
import { useGroupsStore } from '@/stores/groups';
import type { GroupType } from '@/types/groups';
import Card from '@/components/Card';
import Button from '@/components/Button';
// Removed Badge import as we'll style it directly or assume it's simple
// import Badge from '@/components/Badge';

// Define style constants inspired by the target image
const BACKGROUND_COLOR = '#F8F9FD'; // A very light, slightly bluish gray
const CARD_BACKGROUND_COLOR = '#FFFFFF';
const PRIMARY_TEXT_COLOR = '#1A202C'; // Dark gray for primary text
const SECONDARY_TEXT_COLOR = '#5A6A85'; // Medium gray for secondary text
const TERTIARY_TEXT_COLOR = '#A0AEC0'; // Lighter gray
const PRIMARY_COLOR = '#2563EB'; // A vibrant blue, similar to the image
const WHITE_COLOR = '#FFFFFF';
const DIVIDER_COLOR = '#E2E8F0'; // Light gray for borders/dividers
const ERROR_COLOR = '#E53E3E'; // Red for error messages
const ADMIN_BADGE_BG_COLOR = '#EBF4FF'; // Light blue for admin badge background
const ADMIN_BADGE_TEXT_COLOR = '#2563EB'; // Blue for admin badge text
const ICON_BG_COLOR = '#E0EAFC'; // Background for icons in modal

const FONT_FAMILY_SANS = 'System'; // Using system font as a default sans-serif

const RADIUS_MEDIUM = 12;
const RADIUS_LARGE = 16; // For modal bottom sheet and cards
const PADDING_SMALL = 8;
const PADDING_MEDIUM = 16;
const PADDING_LARGE = 24;
const MARGIN_SMALL = 8;
const MARGIN_MEDIUM = 16;
const MARGIN_LARGE = 24;

const FONT_SIZE_XS = 10;
const FONT_SIZE_SMALL = 12;
const FONT_SIZE_BODY = 14;
const FONT_SIZE_SUBHEADING = 16;
const FONT_SIZE_HEADING = 18;
const FONT_WEIGHT_REGULAR = '400';
const FONT_WEIGHT_MEDIUM = '500';
const FONT_WEIGHT_BOLD = '700';

export default function GroupsScreen() {
  const router = useRouter();
  const { groups, loading, error, fetchGroups } = useGroupsStore();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleCreateGroup = () => {
    handleCloseModal();
    router.push('/groups/create-group');
  };

  const handleJoinGroup = () => {
    handleCloseModal();
    router.push('/groups/join-group');
  };

  const renderGroup = ({ item }: { item: GroupType }) => (
    <Card style={styles.groupCard}>
      <TouchableOpacity
        style={styles.cardTouchable}
        onPress={() =>
          item.role === 'admin'
            ? router.push(`/groups/group-manage?id=${item.id}`)
            : router.push(`/groups/group-detail?id=${item.id}`)
        }
        activeOpacity={0.8}
      >
        <View style={styles.groupInfo}>
          <View style={styles.groupHeader}>
            <Text
              style={styles.groupName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
            {item.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>管理员</Text>
              </View>
            )}
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.stats}>
            <View style={styles.statBlock}>
              <Users
                size={16}
                color={SECONDARY_TEXT_COLOR}
                style={styles.statIcon}
              />
              <Text style={styles.statValueText}>{item.memberCount}</Text>
              <Text style={styles.statLabelText}>&nbsp;名成员</Text>
            </View>
          </View>
        </View>

        <ChevronRight size={20} color={TERTIARY_TEXT_COLOR} />
      </TouchableOpacity>
    </Card>
  );

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="重试"
          onPress={fetchGroups}
          // Assuming Button component might use PRIMARY_COLOR if it has a primary variant.
          // If not, it would need direct styling or prop updates.
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchGroups}
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无加入的用户组</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity style={styles.fabButton} onPress={handleOpenModal}>
        <Plus size={28} color={WHITE_COLOR} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContainerWrapper}
            onPress={() => {
              /* Trap accidental taps on content area */
            }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHandleBarContainer}>
                <View style={styles.modalHandleBar} />
              </View>
              <Text style={styles.modalTitle}>选择操作</Text>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleJoinGroup}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: ICON_BG_COLOR },
                  ]}
                >
                  <UserPlus size={24} color={PRIMARY_COLOR} />
                </View>
                <Text style={styles.modalOptionText}>加入用户组</Text>
                <ChevronRight
                  size={20}
                  color={TERTIARY_TEXT_COLOR}
                  style={styles.modalOptionChevron}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleCreateGroup}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: ICON_BG_COLOR },
                  ]}
                >
                  <PlusCircle size={24} color={PRIMARY_COLOR} />
                </View>
                <Text style={styles.modalOptionText}>创建用户组</Text>
                <ChevronRight
                  size={20}
                  color={TERTIARY_TEXT_COLOR}
                  style={styles.modalOptionChevron}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  } as ViewStyle,
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: PADDING_LARGE,
    backgroundColor: BACKGROUND_COLOR,
  } as ViewStyle,
  listContainer: {
    paddingHorizontal: PADDING_MEDIUM,
    paddingTop: PADDING_MEDIUM,
    paddingBottom: 80, // Add padding to account for FAB
  } as ViewStyle,
  groupCard: {
    backgroundColor: CARD_BACKGROUND_COLOR,
    borderRadius: RADIUS_LARGE,
    paddingVertical: PADDING_MEDIUM - 2, // Reduced from 20px to 14px
    paddingHorizontal: PADDING_SMALL + 4, // Reduced from 16px to 12px
    marginBottom: MARGIN_MEDIUM, // Reduced from MARGIN_LARGE (24px) to 16px
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 0,
  } as ViewStyle,
  cardTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  groupInfo: {
    flex: 1,
    marginRight: MARGIN_SMALL,
  } as ViewStyle,
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: MARGIN_SMALL + 2, // Reduced from MARGIN_MEDIUM (16px) to 10px
  } as ViewStyle,
  groupName: {
    fontFamily: FONT_FAMILY_SANS,
    fontSize: FONT_SIZE_HEADING, // Increased font size
    fontWeight: FONT_WEIGHT_BOLD, // Made bolder
    color: PRIMARY_TEXT_COLOR,
    marginRight: MARGIN_SMALL, // Space before badge
    flexShrink: 1, // Allow text to shrink if too long
  } as TextStyle,
  adminBadge: {
    backgroundColor: ADMIN_BADGE_BG_COLOR,
    borderRadius: RADIUS_MEDIUM, // Larger border radius for pill shape
    paddingHorizontal: PADDING_SMALL + 2, // 10px horizontal padding
    paddingVertical: PADDING_SMALL / 2, // 4px vertical padding (adjust for text height)
    marginLeft: MARGIN_SMALL, // Ensure some space if groupName is short
  },
  adminBadgeText: {
    fontFamily: FONT_FAMILY_SANS,
    fontSize: FONT_SIZE_SMALL,
    fontWeight: FONT_WEIGHT_MEDIUM,
    color: ADMIN_BADGE_TEXT_COLOR,
  },
  description: {
    fontFamily: FONT_FAMILY_SANS,
    fontSize: FONT_SIZE_BODY,
    color: SECONDARY_TEXT_COLOR,
    marginBottom: MARGIN_MEDIUM - 2, // Reduced from MARGIN_LARGE (24px) to 14px
    lineHeight: FONT_SIZE_BODY * 1.5, // Slightly reduced line height
  } as TextStyle,
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginTop is handled by description's marginBottom
  } as ViewStyle,
  statBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  statIcon: {
    marginRight: MARGIN_SMALL / 2, // 4px
  } as ViewStyle, // Icons accept style prop
  statValueText: {
    fontFamily: FONT_FAMILY_SANS,
    fontSize: FONT_SIZE_BODY, // 14px for value
    fontWeight: FONT_WEIGHT_MEDIUM,
    color: SECONDARY_TEXT_COLOR, // Darker gray for value
  } as TextStyle,
  statLabelText: {
    fontFamily: FONT_FAMILY_SANS,
    fontSize: FONT_SIZE_SMALL, // 12px for label
    color: TERTIARY_TEXT_COLOR, // Lighter gray for label
    marginLeft: 2, // if value is before it (e.g. "名成员")
  } as TextStyle,
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PADDING_LARGE * 2,
    marginTop: '25%', // Adjusted margin
  } as ViewStyle,
  emptyText: {
    fontFamily: FONT_FAMILY_SANS,
    fontSize: FONT_SIZE_BODY, // Slightly larger empty text
    color: SECONDARY_TEXT_COLOR,
    textAlign: 'center',
  } as TextStyle,
  errorText: {
    fontFamily: FONT_FAMILY_SANS,
    fontSize: FONT_SIZE_BODY,
    color: ERROR_COLOR,
    marginBottom: MARGIN_MEDIUM,
    textAlign: 'center',
  } as TextStyle,
  fabButton: {
    position: 'absolute',
    right: MARGIN_LARGE,
    bottom: MARGIN_LARGE,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY_COLOR, // Shadow with primary color
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  } as ViewStyle,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  } as ViewStyle,
  modalContainerWrapper: {
    // This wrapper helps in making the modalContent area non-clickable to dismiss the modal
    // The actual content is in modalContent
  } as ViewStyle,
  modalContent: {
    backgroundColor: WHITE_COLOR,
    paddingTop: PADDING_SMALL,
    paddingHorizontal: PADDING_LARGE,
    paddingBottom: PADDING_LARGE + MARGIN_MEDIUM, // Ensure enough space at bottom
    borderTopLeftRadius: RADIUS_LARGE,
    borderTopRightRadius: RADIUS_LARGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 }, // Shadow for bottom sheet
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 20, // Higher elevation for modal
  } as ViewStyle,
  modalHandleBarContainer: {
    alignItems: 'center',
    paddingVertical: PADDING_SMALL, // Space for the handle
    marginBottom: MARGIN_SMALL, // Space between handle and title
  },
  modalHandleBar: {
    width: 40,
    height: 5,
    backgroundColor: DIVIDER_COLOR, // Light gray handle
    borderRadius: 2.5,
  },
  modalTitle: {
    fontFamily: FONT_FAMILY_SANS,
    fontSize: FONT_SIZE_HEADING,
    fontWeight: FONT_WEIGHT_MEDIUM, // Medium weight for title
    color: PRIMARY_TEXT_COLOR,
    marginBottom: MARGIN_LARGE,
    textAlign: 'center',
    marginTop: MARGIN_SMALL,
  } as TextStyle,
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: PADDING_MEDIUM + PADDING_SMALL / 2, // More vertical padding for options
    // Removed borderBottom for a cleaner look, spacing will separate items
  } as ViewStyle,
  modalOptionText: {
    fontFamily: FONT_FAMILY_SANS,
    fontSize: FONT_SIZE_BODY, // Standard body size for option text
    fontWeight: FONT_WEIGHT_MEDIUM,
    color: PRIMARY_TEXT_COLOR,
    marginLeft: MARGIN_MEDIUM,
    flex: 1,
  } as TextStyle,
  modalOptionChevron: {
    marginLeft: MARGIN_SMALL,
  },
  iconContainer: {
    width: 48, // Increased size for better touchability and visual balance
    height: 48,
    borderRadius: 24, // Circular
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor is applied inline where needed
  } as ViewStyle,
});
