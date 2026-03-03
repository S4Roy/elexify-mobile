import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Dimensions,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { COLORS, FONTS, IMAGES } from '../../utils/constants';
// Or, if the file does not exist, create 'src/constants/constants.ts' and export COLORS, FONTS, IMAGES from there.
import TabHeader from '../../components/common/TabHeader';
import normalize from '../../utils/helper/normalize';

import { ImageSourcePropType } from 'react-native';

interface CategoryItem {
  id: string;
  name: string;
  image: ImageSourcePropType;
}

interface MainCategoryItem {
  id: string;
  name: string;
  image: ImageSourcePropType;
}
const { height, width } = Dimensions.get('window');

const CategoryScreen: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('1');

  const sidebarCategories: CategoryItem[] = [
    {
      id: '1',
      name: 'Connectors',
      image: IMAGES.demo5,
    },
    {
      id: '2',
      name: 'Capacitors (Polar)',
      image: IMAGES.demo2,
    },
    {
      id: '3',
      name: 'AVR Boards',
      image: IMAGES.demo6,
    },
    {
      id: '4',
      name: 'Amplifier Cabinets',
      image: IMAGES.demo5,
    },
    {
      id: '5',
      name: 'Connectors',
      image: IMAGES.demo2,
    },
    {
      id: '6',
      name: 'Connectors',
      image: IMAGES.demo6,
    },
  ];

  const mainCategories: MainCategoryItem[] = [
    {
      id: '1',
      name: 'Connectors',
      image: IMAGES.demo6,
    },
    {
      id: '2',
      name: 'AVR Boards',
      image: IMAGES.demo,
    },
    {
      id: '3',
      name: 'Capacitors (Polar)',
      image: IMAGES.demo5,
    },
    {
      id: '4',
      name: 'Amplifier Cabinets',
      image: IMAGES.demo4,
    },
    {
      id: '5',
      name: 'Amplifier Power Supply Boards',
      image: IMAGES.demo3,
    },
    {
      id: '6',
      name: 'Audio Boards',
      image: IMAGES.demo2,
    },
  ];

  const renderSidebarCategory = ({ item }: { item: CategoryItem }) => {
    const isSelected = selectedCategoryId === item.id;

    return (
      <TouchableOpacity
        onPress={() => setSelectedCategoryId(item.id)}
        activeOpacity={0.7}
      >
        <View
          style={{
            ...styles.sidebarImageContainer,
            backgroundColor: isSelected ? '#00594E' : COLORS.primary,
          }}
        >
          <Image source={item.image} style={styles.sidebarImage} />

          <Text numberOfLines={1} style={[styles.sidebarCategoryName]}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMainCategory = ({ item }: { item: MainCategoryItem }) => (
    <TouchableOpacity style={styles.mainCategoryCard}>
      <View style={styles.mainCategoryImageFrame}>
        <Image source={item.image} style={styles.mainCategoryImage} />
      </View>
      <Text style={styles.mainCategoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={{
        ...styles.container,
      }}
    >
      <TabHeader />

      <View style={styles.divider} />

      <View style={styles.contentContainer}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.sidebarScrollView}
          >
            {sidebarCategories.map(item => (
              <View key={item.id}>{renderSidebarCategory({ item })}</View>
            ))}
          </ScrollView>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <FlatList
            data={mainCategories}
            renderItem={renderMainCategory}
            keyExtractor={item => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.mainCategoriesContainer}
            columnWrapperStyle={styles.categoryRow}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    height: height - normalize(50),
    width: width,
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: 16,
  },
  searchButton: {
    marginRight: 240,
  },
  iconButton: {
    position: 'relative',
    marginLeft: 30,
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

  // Content Container
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    marginTop: normalize(14),
  },

  // Sidebar Styles
  sidebar: {
    width: normalize(95),
    backgroundColor: COLORS.primary,
    borderRadius: normalize(14),
    paddingTop: normalize(14),
    overflow: 'hidden',
  },
  sidebarHeader: {
    height: 123,
    backgroundColor: '#00594e',
    margin: 7,
    borderRadius: 15,
  },
  sidebarHeaderHighlight: {
    backgroundColor: '#00594e',
    borderRadius: 15,
    flex: 1,
  },
  sidebarScrollView: {
    // paddingHorizontal: normalize(10),
  },
  sidebarCategoryItem: {
    alignItems: 'center',
    // marginBottom: 24,
    width: 82,
    alignSelf: 'center',
  },
  sidebarImageContainer: {
    backgroundColor: '#00594E',
    width: normalize(80),
    height: normalize(95),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(10),
    borderRadius: normalize(15),
    alignSelf: 'center',
  },
  sidebarImageContainerSelected: {
    opacity: 1,
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
    borderWidth: 1,
    // Perfect circle for selected state (like ELLIPSE in Figma)
    borderRadius: 75.14 / 2,
  },
  sidebarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  sidebarCategoryName: {
    fontFamily: FONTS.medium,
    fontSize: normalize(11),
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 19.6,
  },
  sidebarCategoryNameSelected: {
    color: COLORS.white,
    fontWeight: '500',
  },

  // Main Content Styles
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  mainCategoriesContainer: {
    paddingHorizontal: normalize(10),
  },
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  mainCategoryCard: {
    width: normalize(97),
    height: normalize(125),
    backgroundColor: COLORS.white,
    borderRadius: 10.22,
    borderWidth: normalize(0.5),
    borderColor: 'rgba(0, 121, 106, 0.3)',
    alignItems: 'center',
    paddingTop: 8.5,
    paddingBottom: 8.5,
  },
  mainCategoryImageFrame: {
    width: normalize(80),
    height: normalize(80),
    backgroundColor: '#f9f9f9',
    borderRadius: 10.22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  mainCategoryImage: {
    width: '100%',
    height: '100%',
  },
  mainCategoryName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16.1,
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 22.54,
    paddingHorizontal: 8,
    flexShrink: 1,
  },

  // Bottom Navigation
  bottomNav: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 31,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGray,
    justifyContent: 'space-between',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
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
    backgroundColor: COLORS.primary,
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
});

export default CategoryScreen;
