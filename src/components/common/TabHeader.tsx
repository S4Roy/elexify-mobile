import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { COLORS, FONTS, ICONS, IMAGES } from '../../utils/constants';
import normalize from '../../utils/helper/normalize';
import { navigate } from '../../utils/helper/RootNavigation';

interface HeaderProps {
  showSearch?: boolean;
  showCart?: boolean;
  showNotifications?: boolean;
  onSearchPress?: () => void;
  onCartPress?: () => void;
  onNotificationPress?: () => void;
}

const TabHeader: React.FC<HeaderProps> = ({
  showSearch = true,
  showCart = true,
  showNotifications = true,
  onSearchPress,
  onCartPress,
  onNotificationPress,
}) => {
  return (
    <View style={styles.header}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Image source={IMAGES.logoSmall} style={styles.logoImage} />
        <View style={styles.iconsRow}>
          {showSearch && (
            <TouchableOpacity
              style={styles.srcButton}
              onPress={() => navigate('SearchScreen')}
            >
              <Image source={ICONS.search} style={styles.srcicon} />
            </TouchableOpacity>
          )}

          {/* {showCart && ( */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigate('CartScreen')}
          >
            <Image source={ICONS.cart} style={styles.carticon} />
          </TouchableOpacity>
          {/* )} */}

          {showNotifications && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigate('NotificationScreen')}
            >
              <Image source={ICONS.notification} style={styles.bellicon} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Icons Row */}

      {/* Location */}
      <View style={styles.locationContainer}>
        <Image source={ICONS.location} style={styles.locicon} />
        <Text style={styles.locationText}>
          123 Chamac Street, Kolkata, West Bengal
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.lightBackground, // #eefffd
    paddingHorizontal: normalize(15),
    paddingVertical: normalize(15),
  },

  // Logo Section
  logoContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingLeft: 16, // Align with Figma positioning
  },
  logoImageContainer: {
    // Container for the ELEXIFY logo
  },
  logoImage: {
    width: normalize(120), // Exact Figma width
    height: normalize(18), // Exact Figma height
    resizeMode: 'contain',
    // backgroundColor: COLORS.primary, // Placeholder - replace with actual logo
  },
  locicon: {
    width: normalize(17), // Exact Figma width
    height: normalize(17), // Exact Figma height
    resizeMode: 'contain',
    marginRight: normalize(8),
  },
  srcicon: {
    width: normalize(21), // Exact Figma width
    height: normalize(21), // Exact Figma height
    resizeMode: 'contain',
  },
  carticon: {
    width: normalize(28), // Exact Figma width
    height: normalize(28), // Exact Figma height
    resizeMode: 'contain',
  },
  bellicon: {
    width: normalize(22), // Exact Figma width
    height: normalize(22), // Exact Figma height
    resizeMode: 'contain',
  },
  // Icons Row
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(16), // Space between icons
  },
  iconButton: {
    position: 'relative',
  },
  srcButton: {
    height: normalize(32),
    width: normalize(32),
    borderRadius: 100,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    width: 30, // Exact Figma width
    height: 30, // Exact Figma height
    backgroundColor: COLORS.mediumGray,
    borderRadius: 15,
  },
  cartIcon: {
    width: 38, // Exact Figma width
    height: 38, // Exact Figma height
    backgroundColor: COLORS.mediumGray,
    borderRadius: 19,
  },
  bellContainer: {
    position: 'relative',
  },
  bellIcon: {
    width: 29, // Exact Figma width
    height: 29, // Exact Figma height
    backgroundColor: COLORS.mediumGray,
    borderRadius: 14.5,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 10.875, // Exact Figma width
    height: 10.875, // Exact Figma height
    backgroundColor: '#f80036', // Exact Figma color
    borderRadius: normalize(6),
  },

  // Location Section
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: normalize(14),
    // justifyContent: 'center',
    // paddingHorizontal: 16,
  },
  locationDot: {
    width: 4.32, // Exact Figma width
    height: 4.32, // Exact Figma height
    backgroundColor: COLORS.subtleGray, // #666666
    borderRadius: 2.16,
    marginRight: 8,
  },
  locationText: {
    fontFamily: FONTS.regular, // Poppins Regular
    fontSize: normalize(12), // Exact Figma size
    color: COLORS.subtleGray, // #666666
    letterSpacing: 0.14, // Exact Figma letter spacing
    lineHeight: 21, // Exact Figma line height
  },
});

export default TabHeader;
