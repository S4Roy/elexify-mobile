import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../utils/constants';
import TabHeader from '../../components/common/TabHeader';
import normalize from '../../utils/helper/normalize';

interface BrandItem {
  id: string;
  name: string;
  image?: string;
}

const BrandsScreen: React.FC = () => {
  const topBrands: BrandItem[] = [
    { id: '1', name: 'Brand\nImage' },
    { id: '2', name: 'Brand\nImage' },
    { id: '3', name: 'Brand\nImage' },
    { id: '4', name: 'Brand\nImage' },
    { id: '5', name: 'Brand\nImage' },
    { id: '6', name: 'Brand\nImage' },
  ];

  const allBrands: BrandItem[] = Array.from({ length: 16 }, (_, i) => ({
    id: `brand-${i + 1}`,
    name: 'Brand\nImage',
  }));

  const renderTopBrands = () => (
    <View style={styles.topBrandsSection}>
      <Text style={styles.sectionTitle}>Top Brands</Text>

      <View style={styles.topBrandsGrid}>
        {topBrands.map((item, index) => (
          <TouchableOpacity key={item.id} style={styles.topBrandItem}>
            <View style={styles.topBrandImageContainer}>
              <Text style={styles.topBrandImageText}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAllBrandItem = ({
    item,
    index,
  }: {
    item: BrandItem;
    index: number;
  }) => (
    <TouchableOpacity style={styles.allBrandItem}>
      <View style={styles.allBrandImageContainer}>
        <Text style={styles.allBrandImageText}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderAllBrands = () => (
    <View style={styles.allBrandsSection}>
      <Text style={styles.sectionTitle}>All Brands</Text>
      <FlatList
        data={allBrands}
        renderItem={renderAllBrandItem}
        keyExtractor={item => item.id}
        numColumns={4}
        scrollEnabled={false}
        contentContainerStyle={styles.allBrandsGrid}
        columnWrapperStyle={styles.allBrandsRow}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TabHeader />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.divider} />
        {renderTopBrands()}
        {renderAllBrands()}
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

  // Header Styles
  header: {
    backgroundColor: COLORS.lightBackground,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.primary,
    letterSpacing: 2,
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 240,
  },
  iconButton: {
    position: 'relative',
  },
  searchIcon: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.mediumGray,
    borderRadius: 15,
  },
  cartIcon: {
    width: 38,
    height: 38,
    backgroundColor: COLORS.mediumGray,
    borderRadius: 19,
  },
  bellIcon: {
    width: 29,
    height: 29,
    backgroundColor: COLORS.mediumGray,
    borderRadius: 14.5,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10.875,
    height: 10.875,
    backgroundColor: COLORS.notificationRed,
    borderRadius: 5.4375,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationDot: {
    width: 4.32,
    height: 4.32,
    backgroundColor: COLORS.subtleGray,
    borderRadius: 2.16,
    marginRight: 8,
  },
  locationText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.subtleGray,
    letterSpacing: 0.14,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGreen,
  },

  scrollView: {
    flex: 1,
  },

  // Section Styles
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: normalize(14),
    color: COLORS.blackText,
    letterSpacing: 0,
    lineHeight: 20,
    marginBottom: normalize(15),
  },

  // Top Brands Section
  topBrandsSection: {
    backgroundColor: 'rgba(255, 157, 51, 0.07)',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  topBrandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  topBrandItem: {
    width: normalize(94), // Calculated for 3 columns with proper spacing
    marginBottom: normalize(6), // Increased bottom margin for better spacing
  },
  topBrandImageContainer: {
    backgroundColor: '#EBEBEB',
    borderRadius: 8.29,
    height: 78.18, // Matching exact Figma height
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBrandImageText: {
    fontFamily: FONTS.regular,
    fontSize: 17.25,
    color: COLORS.black,
    textAlign: 'center',
    lineHeight: 20.13,
  },

  // All Brands Section
  allBrandsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  allBrandsGrid: {
    paddingBottom: 20,
  },
  allBrandsRow: {
    justifyContent: 'space-between',
    marginBottom: normalize(6), // Increased from 12 to 15 for better spacing
  },
  allBrandItem: {
    width: normalize(70), // Calculated for 4 columns with proper spacing
  },
  allBrandImageContainer: {
    backgroundColor: '#EBEBEB',
    borderRadius: 6.13,
    height: 57.85,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allBrandImageText: {
    fontFamily: FONTS.regular,
    fontSize: 12.77,
    color: COLORS.black,
    textAlign: 'center',
    lineHeight: 14.9,
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
    backgroundColor: COLORS.primary,
    marginBottom: 2,
  },
  accountIcon: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.mediumGray,
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

export default BrandsScreen;
