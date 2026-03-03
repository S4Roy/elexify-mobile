import React, { FunctionComponent } from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, FONTS, ICONS } from '../../utils/constants';
import { goBack, navigate } from '../../utils/helper/RootNavigation';
import normalize from '../../utils/helper/normalize';

const SimpleHeader: FunctionComponent<{
  title: string;
  onSearchPress?: () => void;
  showSearch?: boolean;
}> = ({ title, onSearchPress, showSearch = true }) => {
  return (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Custom header with mint background */}
      <View style={styles.customHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => goBack()}
              style={styles.backButton}
            >
              <Image source={ICONS.back} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
          </View>

          <View style={styles.iconsRow}>
            {showSearch && (
              <TouchableOpacity
                style={styles.srcButton}
                onPress={() => navigate('SearchScreen')}
              >
                <Image source={ICONS.search} style={styles.srcicon} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                navigate('CartScreen');
              }}
            >
              <Image source={ICONS.cart} style={styles.carticon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigate('NotificationScreen')}
            >
              <Image source={ICONS.notification} style={styles.bellicon} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(16), // Space between icons
    // backgroundColor: 'red',
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
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 10.875, // Exact Figma width
    height: 10.875, // Exact Figma height
    backgroundColor: '#f80036', // Exact Figma color
    borderRadius: normalize(6),
  },

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
    fontSize: normalize(13),
    color: COLORS.primary,
    // width: '65%',
    // backgroundColor: 'red',
    // lineHeight: 24,
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
    color: COLORS.charcoal,
    lineHeight: 22,
  },
  sectionAction: {
    fontFamily: FONTS.medium,
    fontSize: 14,
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
    color: '#979797',
    lineHeight: 22,
    marginBottom: 4,
    textAlign: 'right',
  },
  notificationTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.black,
    lineHeight: 22,
    marginBottom: 4,
  },
  notificationMessage: {
    fontFamily: FONTS.regular,
    fontSize: 14,
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
    color: '#495F8A',
    lineHeight: 22,
  },
});

export default SimpleHeader;
