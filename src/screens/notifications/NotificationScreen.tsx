import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, ICONS } from '../../utils/constants';
import SimpleHeader from '../../components/common/SimpleHeader';
import normalize from '../../utils/helper/normalize';

interface NotificationItemProps {
  id: string;
  type: 'app-update' | 'offer' | 'order' | 'delivery' | 'cancelled';
  title: string;
  message: string;
  timestamp?: string;
  icon: any;
  backgroundColor: string;
  isRead?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

interface NotificationSectionProps {
  title: string;
  rightAction?: {
    text: string;
    onPress: () => void;
  };
  children: React.ReactNode;
}

const NotificationScreen: React.FC = () => {
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    [],
  );
  const [selectAllMode, setSelectAllMode] = useState(false);

  const notifications = [
    {
      id: '1',
      type: 'app-update' as const,
      title: 'App update',
      message: 'New version has been launched, please update your app',
      icon: ICONS.update,
      backgroundColor: '#FFEEF7',
      isRead: false,
    },
    {
      id: '2',
      type: 'offer' as const,
      title: 'New offer has been launched',
      message: 'New version has been launched, please update your app',
      icon: ICONS.offer,
      backgroundColor: '#F0FCFF',
      isRead: false,
    },
    {
      id: '3',
      type: 'order' as const,
      title: 'Your order has been placed',
      message: 'New version has been launched, please update your app',
      icon: ICONS.love,
      backgroundColor: COLORS.white,
      isRead: true,
    },
    {
      id: '4',
      type: 'delivery' as const,
      title: 'Your order has been delivered',
      message: 'New version has been launched, please update your app',
      timestamp: '10 Aug 2025 | 10:00',
      icon: ICONS.delivered,
      backgroundColor: COLORS.white,
      isRead: true,
    },
    {
      id: '5',
      type: 'cancelled' as const,
      title: 'Your order has been cancelled',
      message: 'New version has been launched, please update your app',
      timestamp: '10 Aug 2025 | 10:00',
      icon: ICONS.cancel,
      backgroundColor: COLORS.white,
      isRead: true,
    },
  ];

  const todayNotifications = notifications.slice(0, 3);
  const allNotifications = notifications.slice(3);

  const handleBack = () => {
    // TODO: Implement navigation back
    console.log('Navigate back');
  };

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Open search');
  };

  const handleNotificationBell = () => {
    // TODO: Implement notification bell action
    console.log('Notification bell pressed');
  };

  const handleMarkAllAsRead = () => {
    // TODO: Implement mark all as read
    console.log('Mark all as read');
  };

  const handleToggleSelectAll = () => {
    setSelectAllMode(!selectAllMode);
    if (!selectAllMode) {
      setSelectedNotifications(allNotifications.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleToggleNotificationSelect = (id: string) => {
    setSelectedNotifications(prev =>
      prev.includes(id) ? prev.filter(nId => nId !== id) : [...prev, id],
    );
  };

  const renderNotificationItem = ({
    id,
    title,
    message,
    timestamp,
    icon,
    backgroundColor,
    isSelected = false,
  }: NotificationItemProps) => (
    <View>
      {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}

      <TouchableOpacity
        key={id}
        style={[styles.notificationItem, { backgroundColor }]}
        onPress={() => handleToggleNotificationSelect(id)}
      >
        {selectAllMode && (
          <View style={styles.checkboxContainer}>
            <View
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
            />
          </View>
        )}

        <View style={styles.notificationIcon}>
          <Image source={icon} style={styles.iconImage} />
        </View>

        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{title}</Text>
          <Text style={styles.notificationMessage}>{message}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderNotificationSection = ({
    title,
    rightAction,
    children,
  }: NotificationSectionProps) => (
    <View style={styles.notificationSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress}>
            <Text style={styles.sectionAction}>{rightAction.text}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* {renderHeader()} */}
      <SimpleHeader title="Notification" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Today Section */}
        {renderNotificationSection({
          title: 'Today',
          rightAction: {
            text: 'Mark all as read',
            onPress: handleMarkAllAsRead,
          },
          children: (
            <View style={styles.notificationsContainer}>
              {todayNotifications.map(notification =>
                renderNotificationItem({
                  ...notification,
                  isSelected: selectedNotifications.includes(notification.id),
                  onToggleSelect: handleToggleNotificationSelect,
                }),
              )}
            </View>
          ),
        })}

        {/* All Notifications Section */}
        {renderNotificationSection({
          title: 'All notification',
          // rightAction: {
          //   text: 'Select all',
          //   onPress: handleToggleSelectAll,
          // },
          children: (
            <View>
              <View style={styles.notificationsContainer}>
                {allNotifications.map(notification =>
                  renderNotificationItem({
                    ...notification,
                    isSelected: selectedNotifications.includes(notification.id),
                    onToggleSelect: handleToggleNotificationSelect,
                  }),
                )}
              </View>
            </View>
          ),
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerContainer: {
    backgroundColor: COLORS.lightBackground,
  },
  customHeader: {
    backgroundColor: COLORS.lightBackground,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.primary,
    lineHeight: 24,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    marginLeft: 16,
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10.875,
    height: 10.875,
    backgroundColor: COLORS.notificationRed,
    borderRadius: 5.4375,
  },
  headerIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: normalize(10),
  },
  notificationSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.charcoal,
    lineHeight: 22,
  },
  sectionAction: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    lineHeight: 22,
  },
  notificationsContainer: {
    gap: 15,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  checkbox: {
    width: 17,
    height: 17,
    borderWidth: 1,
    borderColor: '#C4C4C4',
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    marginRight: 15,
    marginTop: 4,
  },
  iconImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  notificationContent: {
    flex: 1,
  },
  timestamp: {
    fontFamily: FONTS.regular,
    fontSize: 9,
    fontWeight: '400',
    color: '#979797',
    lineHeight: 22,
    // marginBottom: 4,
    textAlign: 'right',
  },
  notificationTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    lineHeight: 22,
    marginBottom: 4,
  },
  notificationMessage: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.charcoal,
    lineHeight: 22,
  },
  selectAllContainer: {
    marginBottom: 20,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  selectAllCheckbox: {
    width: 17,
    height: 17,
    borderWidth: 1,
    borderColor: '#C4C4C4',
    borderRadius: 3,
    backgroundColor: COLORS.white,
    marginRight: 10,
  },
  selectAllText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: '500',
    color: '#495F8A',
    lineHeight: 22,
  },
});

export default NotificationScreen;
