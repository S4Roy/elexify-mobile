import React from 'react';
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
import { COLORS, FONTS, ICONS, IMAGES } from '../../utils/constants';
import TabHeader from '../../components/common/TabHeader';
import normalize from '../../utils/helper/normalize';

import { ImageSourcePropType } from 'react-native';
import { navigate } from '../../utils/helper/RootNavigation';

interface MenuItemProps {
  icon: ImageSourcePropType;
  title: string;
  onPress?: () => void;
  showDivider?: boolean;
}

interface OrderCardProps {
  icon: React.ReactNode;
  title: string;
  onPress?: () => void;
}

const AccountScreen: React.FC = () => {
  const renderProfileSection = () => (
    <View style={styles.profileSection}>
      <View style={styles.profileContainer}>
        <View style={styles.profileImageContainer}>
          <View
            style={{
              padding: normalize(4),
              borderWidth: normalize(1),
              borderRadius: 100,
              borderColor: COLORS.white,
              borderStyle: 'dashed',
            }}
          >
            <Image source={IMAGES.userdemo} style={styles.user} />
          </View>
          <TouchableOpacity style={styles.cameraButton}>
            <Image source={ICONS.camera} style={styles.editIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.userName}>Indranil Sen</Text>
          <Text style={styles.userPhone}>6291332961</Text>
          <Text style={styles.userEmail}>indrahmz06@gmail.com</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.editButton}>
        <Image source={ICONS.arrownext} style={styles.nextIcon} />
      </TouchableOpacity>
    </View>
  );

  const renderOrderCard = ({ icon, title, onPress }: OrderCardProps) => (
    <TouchableOpacity style={styles.orderCard} onPress={onPress}>
      <View style={styles.orderIconContainer}>{icon}</View>
      <Text style={styles.orderCardTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const renderOrdersSection = () => (
    <View style={styles.ordersSection}>
      <Text style={styles.sectionTitle}>My Orders</Text>
      <View style={styles.ordersGrid}>
        {renderOrderCard({
          icon: <Image source={ICONS.box} style={styles.orderIcon} />,
          title: 'Ongoing',
          onPress: () => {
            navigate('OngoingOrderScreen');
          },
        })}
        {renderOrderCard({
          icon: <Image source={ICONS.track} style={styles.orderIcon} />,
          title: 'Completed',
          onPress: () => {
            navigate('CompletedOrderScreen');
          },
        })}
        {renderOrderCard({
          icon: <Image source={ICONS.reply} style={styles.orderIcon} />,
          title: 'Returns',
          onPress: () => {
            navigate('ReturnOrderScreen');
          },
        })}
        {renderOrderCard({
          icon: <Image source={ICONS.comment} style={styles.orderIcon} />,
          title: 'Cancel',
          onPress: () => {
            navigate('CanceledListScreen');
          },
        })}
      </View>
    </View>
  );

  const renderMenuItem = ({
    icon,
    title,
    onPress,
    showDivider = true,
  }: MenuItemProps) => (
    <View>
      <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuItemLeft}>
          <Image
            source={icon}
            style={{
              height: normalize(20),
              width: normalize(20),
              resizeMode: 'contain',
              tintColor: COLORS.primary,
              marginRight: normalize(10),
            }}
          />

          <Text style={styles.menuItemTitle}>{title}</Text>
        </View>
        <Image
          source={ICONS.arrownext}
          style={{
            height: normalize(20),
            width: normalize(14),
            resizeMode: 'contain',
            tintColor: COLORS.primary,
          }}
        />
      </TouchableOpacity>
      {/* {showDivider && <View style={styles.menuDivider} />} */}
    </View>
  );

  const renderMenuSection = (title: string, items: MenuItemProps[]) => (
    <View style={styles.menuSection}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.menuList}>
        {items.map((item, index) =>
          renderMenuItem({
            ...item,
            showDivider: index < items.length - 1,
          }),
        )}
      </View>
    </View>
  );

  const accountMenuItems = [
    {
      icon: ICONS.location,
      title: 'Manage Address',
      onPress: () => {
        navigate('ManageAddressScreen');
      },
    },
    {
      icon: ICONS.heart,
      title: 'Wishlist',
      onPress: () => {
        navigate('WishlistScreen');
      },
    },
    {
      icon: ICONS.clock,
      title: 'Recently Viewed',
      onPress: () => {
        navigate('RecentlyViewedScreen');
      },
    },
  ];

  const settingsMenuItems = [
    {
      icon: ICONS.settings,
      title: 'Manage App',
      onPress: () => {
        navigate('ManageAppScreen');
      },
    },
  ];

  const otherMenuItems = [
    {
      icon: ICONS.faq,
      title: "FAQ's",
      onPress: () => {
        navigate('FAQScreen');
      },
    },
    {
      icon: ICONS.support,
      title: 'Customer Service',
      onPress: () => {},
    },
    {
      icon: ICONS.remove,
      title: 'Delete account',
      onPress: () => {},
    },
    {
      icon: ICONS.logout,
      title: 'Logout',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <TabHeader />
        <View style={styles.divider} />
        {renderProfileSection()}
        {renderOrdersSection()}
        {renderMenuSection('', accountMenuItems)}
        {renderMenuSection('Settings', settingsMenuItems)}
        {renderMenuSection('Other', otherMenuItems)}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  user: { width: normalize(75), height: normalize(75), borderRadius: 100 },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGreen,
  },

  scrollView: {
    flex: 1,
  },

  // Profile Section
  profileSection: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 17,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 107,
    height: 107,
    borderRadius: 53.5,
    backgroundColor: COLORS.alto,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  cameraButton: {
    position: 'absolute',
    bottom: normalize(0),
    right: normalize(4),
    width: 32,
    height: 32,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    width: 16,
    height: 16,
    backgroundColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: FONTS.semiBold,
    fontSize: 22,
    color: COLORS.white,
    marginBottom: 3,
    lineHeight: 33,
  },
  userPhone: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 5,
    lineHeight: 21,
  },
  userEmail: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.white,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  editButton: {
    width: 33,
    height: 33,
    backgroundColor: '#006659',
    borderRadius: 16.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextIcon: {
    width: 12,
    height: 24,
    resizeMode: 'contain',
    // backgroundColor: COLORS.white,
  },
  editIcon: {
    width: normalize(20),
    height: normalize(20),
    resizeMode: 'contain',
    // backgroundColor: COLORS.white,
  },

  // Orders Section
  ordersSection: {
    paddingHorizontal: 17,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: normalize(15),
    color: COLORS.blackText,
    marginBottom: normalize(12),
    // lineHeight: 28,
  },
  ordersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderCard: {
    alignItems: 'center',
    width: 86.61,
  },
  orderIconContainer: {
    width: normalize(44),
    height: normalize(44),
    backgroundColor: 'rgba(0, 121, 106, 0.09)',
    borderRadius: 9.62,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderIcon: {
    width: normalize(24),
    height: normalize(24),
    resizeMode: 'contain',
    // backgroundColor: COLORS.primary,
  },
  orderCardTitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.blackText,
    textAlign: 'center',
    lineHeight: 24.06,
  },

  // Menu Sections
  menuSection: {
    paddingHorizontal: 17,
    marginBottom: 24,
  },
  menuList: {
    backgroundColor: COLORS.white,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: normalize(14),
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.mediumGray,
    marginRight: 16,
  },
  menuItemTitle: {
    fontFamily: FONTS.medium,
    fontSize: normalize(13),
    color: COLORS.charcoal,
    lineHeight: 24,
  },
  arrowIcon: {
    width: 16,
    height: 16,
    backgroundColor: COLORS.mediumGray,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(73, 95, 138, 0.12)',
    marginHorizontal: 0,
  },

  // Bottom Navigation
  bottomNav: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    paddingVertical: 17,
    paddingHorizontal: 31,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGray,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  homeIcon: {
    width: 28,
    height: 28,
    backgroundColor: COLORS.mediumGray,
    marginBottom: 2,
  },
  categoryIcon: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.mediumGray,
    marginBottom: 2,
  },
  brandsIcon: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.mediumGray,
    marginBottom: 2,
  },
  accountIcon: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.primary,
    marginBottom: 2,
  },
  navText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  activeNavText: {
    color: COLORS.primary,
  },

  bottomSpacing: {
    height: normalize(50),
  },
});

export default AccountScreen;
