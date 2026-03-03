import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  ImageSourcePropType,
  Dimensions,
} from 'react-native';
import { COLORS, FONTS, ICONS, IMAGES } from '../../utils/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabHeader from '../../components/common/TabHeader';
import normalize from '../../utils/helper/normalize';
import ProductCard from '../../components/common/ProductCard';
import { navigate } from '../../utils/helper/RootNavigation';
import { useDispatch } from 'react-redux';
import { bannerRequest } from '../../redux/reducer/MainReducer';

interface CategoryItem {
  id: string;
  name: string;
  image: ImageSourcePropType;
}

interface ProductItem {
  id: string;
  category: string;
  title: string;
  originalPrice: string;
  salePrice: string;
  image: ImageSourcePropType;
}

interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  backgroundColor: string;
  buttonColor: string;
  image: ImageSourcePropType;
  imageStyle: 'banner1' | 'banner2';
}

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch();
  const bannerScrollRef = useRef<FlatList>(null);
  const currentBannerIndex = useRef(0);
  const bannerWidth = width * 0.84 + 16; // Banner width + margin

  const banners: BannerItem[] = [
    {
      id: '1',
      title: 'Amplifier Boards',
      subtitle: 'Upto 30% Discount',
      backgroundColor: '#06ab8d',
      buttonColor: '#00796a',
      image: IMAGES.banner,
      imageStyle: 'banner1',
    },
    {
      id: '2',
      title: 'Audio Boards',
      subtitle: 'Upto 30% Discount',
      backgroundColor: '#ffb039',
      buttonColor: '#000000',
      image: IMAGES.banner,
      imageStyle: 'banner2',
    },
    // {
    //   id: '3',
    //   title: 'Audio Boards',
    //   subtitle: 'Upto 30% Discount',
    //   backgroundColor: '#ffb039',
    //   buttonColor: '#000000',
    //   image: IMAGES.banner,
    //   imageStyle: 'banner2',
    // },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (bannerScrollRef.current) {
        currentBannerIndex.current =
          (currentBannerIndex.current + 1) % banners.length;
        bannerScrollRef.current.scrollToIndex({
          index: currentBannerIndex.current,
          animated: true,
        });
      }
    }, 3000); // Auto scroll every 3 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  const categories: CategoryItem[] = [
    {
      id: '1',
      name: 'Connectors',
      image: IMAGES.demo5,
    },
    {
      id: '2',
      name: 'Capacitors (Polar)',
      image: IMAGES.demo4,
    },
    {
      id: '3',
      name: 'AVR Boards',
      image: IMAGES.demo3,
    },
    {
      id: '4',
      name: 'Amplifier Cabinets',
      image: IMAGES.demo2,
    },
    {
      id: '5',
      name: 'Connectors',
      image: IMAGES.demo,
    },
  ];

  const newArrivals: ProductItem[] = [
    {
      id: '1',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      image: IMAGES.demo5,
    },
    {
      id: '2',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      image: IMAGES.demo5,
    },
    {
      id: '3',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      image: IMAGES.demo5,
    },
    {
      id: '4',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      image: IMAGES.demo5,
    },
  ];

  const flashSaleProducts: ProductItem[] = [
    {
      id: '1',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      image: IMAGES.demo3,
    },
    {
      id: '2',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      image: IMAGES.demo3,
    },
    {
      id: '3',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      image: IMAGES.demo3,
    },
  ];

  const popularProducts: ProductItem[] = [
    {
      id: '1',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      image: IMAGES.demo3,
    },
    {
      id: '2',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      image: IMAGES.demo3,
    },
    {
      id: '3',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      image: IMAGES.demo3,
    },
  ];

  const renderBannerItem = ({ item }: { item: BannerItem }) => (
    <TouchableOpacity style={[styles.banner]}>
      <Image source={item.image} style={styles.bannerImage} />
    </TouchableOpacity>
  );

  const renderBanners = () => (
    <View style={styles.bannersWrapper}>
      <FlatList
        ref={bannerScrollRef}
        data={banners}
        renderItem={renderBannerItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={true}
        decelerationRate="fast"
        snapToInterval={bannerWidth}
        snapToAlignment="start"
        contentContainerStyle={styles.bannersContainer}
        getItemLayout={(data, index) => ({
          length: bannerWidth,
          offset: bannerWidth * index,
          index,
        })}
      />
    </View>
  );

  const renderCategories = () => (
    <View style={{ ...styles.section }}>
      <Text style={styles.sectionTitle}>Popular Categories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map((category, index) => (
          <TouchableOpacity key={category.id} style={styles.categoryItem}>
            <View style={styles.categoryImageContainer}>
              <Image source={category.image} style={styles.categoryImage} />
            </View>
            <Text numberOfLines={1} style={styles.categoryName}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.viewAllCategory}>
          <View style={styles.categoryImageContainer}>
            <Image
              source={ICONS.openeye}
              style={{ height: normalize(34), width: normalize(34) }}
            />
          </View>
          <Text style={styles.categoryName}>View All</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderFlashSale = () => (
    <View style={styles.flashSaleSection}>
      <View style={styles.flashSaleHeader}>
        <View style={styles.flashSaleTitleContainer}>
          <Text style={{ ...styles.sectionTitle, marginBottom: 0 }}>
            Flash Sale
          </Text>
          <Image
            source={ICONS.fire}
            style={{
              height: normalize(20),
              width: normalize(20),
              resizeMode: 'contain',
              marginLeft: normalize(5),
            }}
          />
        </View>
        <View style={styles.timeContainer}>
          <View style={styles.timeBox}>
            <Text style={styles.timeText}>04</Text>
          </View>
          <Text style={styles.timeSeparator}>:</Text>
          <View style={styles.timeBox}>
            <Text style={styles.timeText}>24</Text>
          </View>
          <Text style={styles.timeSeparator}>:</Text>
          <View style={styles.timeBox}>
            <Text style={styles.timeText}>39</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {flashSaleProducts.map(product => (
          <ProductCard
            cardwidth={normalize(170)}
            imgHeight={normalize(130)}
            titleFontSize={normalize(12)}
            marginRight={normalize(10)}
            borderRadius={normalize(10)}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderNewArrivals = () => (
    <View style={{ ...styles.section, paddingHorizontal: normalize(14) }}>
      <Text style={styles.sectionTitle}>New Arrivals</Text>
      {newArrivals.map(product => (
        <View key={product.id} style={styles.newArrivalCard}>
          <TouchableOpacity style={styles.heartIconList}>
            {/* <View style={styles.heartIconInner} /> */}
            <Image
              source={ICONS.heart}
              style={{
                height: normalize(20),
                width: normalize(20),
                resizeMode: 'contain',
                marginLeft: normalize(5),
              }}
            />
          </TouchableOpacity>
          <View style={styles.newArrivalImageContainer}>
            <Image source={product.image} style={styles.newArrivalImage} />
          </View>
          <View style={styles.newArrivalContent}>
            <Text style={styles.productCategory}>{product.category}</Text>
            <Text style={styles.newArrivalTitle}>{product.title}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.originalPrice}>{product.originalPrice}</Text>
              <Text style={styles.salePrice}>{product.salePrice}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderSellerBanner = () => (
    <View style={styles.sellerBanner}>
      <Text style={styles.sellerTitle}>Now it's easier to open your shop</Text>
      <Text style={styles.sellerSubtitle}>
        With simple step by step and easy help instructions to follow
      </Text>
    </View>
  );

  const renderPopularProducts = () => (
    <View style={styles.section}>
      <View style={styles.popularHeader}>
        <Text style={styles.sectionTitle}>Popular Products</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {popularProducts.map(product => (
          <ProductCard
            cardwidth={normalize(170)}
            imgHeight={normalize(130)}
            titleFontSize={normalize(12)}
            marginRight={normalize(10)}
            borderRadius={normalize(10)}
            borderWidth={1}
            borderColor="#E6E8EC"
          />
        ))}
      </ScrollView>
    </View>
  );

  useEffect(() => {
    dispatch(bannerRequest({}));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <TabHeader />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderBanners()}
        <View style={styles.divider} />
        {renderCategories()}
        {renderFlashSale()}
        {renderNewArrivals()}
        {renderSellerBanner()}
        {renderPopularProducts()}
        <View style={styles.bottomSpacing} />

        <View style={{ height: normalize(50) }} />
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

  scrollView: {
    flex: 1,
  },

  // Banner Styles
  bannersWrapper: {
    marginBottom: normalize(7),
    marginTop: normalize(15),
  },
  bannersContainer: {
    paddingHorizontal: 16,
  },
  banner: {
    width: width * 0.84,
    height: normalize(130),
    borderRadius: 15,
    marginRight: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bannerContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 21,
    color: COLORS.white,
    lineHeight: 31.5,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: 18,
    color: COLORS.white,
    lineHeight: 27,
    marginBottom: 16,
  },
  shopNowButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 21.39,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  shopNowText: {
    fontFamily: FONTS.medium,
    fontSize: 14.97,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 22.46,
  },
  bannerImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 20,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerImage2: {
    width: 84,
    height: 84,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGreen,
    marginVertical: 16,
  },

  // Section Styles
  section: {
    paddingLeft: normalize(14),
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.charcoal,
    letterSpacing: 0.36,
    lineHeight: 27,
    marginBottom: 16,
  },

  // Categories Styles
  categoriesContainer: {
    flexDirection: 'row',
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 28,
    width: 82,
  },
  categoryImageContainer: {
    width: 75.14,
    height: 75.14,
    borderRadius: 37.57,
    borderWidth: 1,
    borderColor: 'rgba(0, 121, 106, 0.2)',
    // opacity: 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  categoryName: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 19.6,
  },
  viewAllCategory: {
    alignItems: 'center',
    width: 82,
  },
  viewAllContainer: {
    width: 75,
    height: 75,
    backgroundColor: COLORS.productBackground,
    borderRadius: 37.5,
    borderWidth: 1,
    borderColor: COLORS.primary,
    opacity: 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  viewAllIcon: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.mediumGray,
  },

  // Flash Sale Styles
  flashSaleSection: {
    backgroundColor: 'rgba(255, 176, 57, 0.12)',
    paddingLeft: normalize(14),
    paddingVertical: 24,
    marginBottom: 24,
  },
  flashSaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: normalize(14),
  },
  flashSaleTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireIcon: {
    width: 28,
    height: 28,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    marginLeft: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBox: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 33,
    alignItems: 'center',
  },
  timeText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.white,
    lineHeight: 22.4,
  },
  timeSeparator: {
    fontFamily: 'Inter-Medium', // Keep as specific font for Inter
    fontSize: 20,
    color: COLORS.blackText,
    marginHorizontal: 8,
    lineHeight: 24.2,
  },

  flashSaleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8.33,
    marginRight: 15,
    width: 232,
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
  },
  flashSaleImage: {
    width: '100%',
    height: '100%',
    // resizeMode: 'contain',
    // backgroundColor: COLORS.borderGray,
    // borderRadius: 10.6,
    // margin: 9,
  },
  heartIcon: {
    position: 'absolute',
    top: 17,
    right: 17,
    width: 24,
    height: 24,
  },
  heartIconInner: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.mediumGray,
  },

  // Product Content Styles
  productContent: {
    padding: 13,
  },
  productCategory: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.accent,
    lineHeight: 18,
    marginBottom: 5,
  },
  productTitle: {
    fontFamily: FONTS.medium,
    fontSize: 15.79,
    color: COLORS.blackText,
    lineHeight: 22.1,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontFamily: FONTS.regular,
    fontSize: 15.79,
    color: COLORS.priceStriked,
    textDecorationLine: 'line-through',
    marginRight: 8,
    lineHeight: 23.68,
  },
  salePrice: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
    lineHeight: 24,
  },

  // New Arrivals Styles
  newArrivalCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8.33,
    flexDirection: 'row',
    marginBottom: 15,
    padding: 9,
    position: 'relative',
  },
  heartIconList: {
    position: 'absolute',
    top: 17,
    right: 17,
    width: 24,
    height: 24,
    zIndex: 1,
  },
  newArrivalImageContainer: {
    backgroundColor: COLORS.borderGray,
    borderRadius: 10.6,
    width: 125,
    height: 125,
    marginRight: 13,
  },
  newArrivalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10.6,
  },
  newArrivalContent: {
    flex: 1,
    justifyContent: 'center',
  },
  newArrivalTitle: {
    fontFamily: FONTS.medium,
    fontSize: 15.79,
    color: COLORS.blackText,
    lineHeight: 22.1,
    marginBottom: 8,
    paddingRight: 40, // Space for heart icon
  },

  // Seller Banner Styles
  sellerBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 30,
    marginBottom: 24,
  },
  sellerTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.white,
    lineHeight: 27,
    marginBottom: 8,
  },
  sellerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 21,
  },

  // Popular Products Styles
  popularHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.primary,
    letterSpacing: 0.28,
    lineHeight: 21,
  },
  popularProductCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8.33,
    marginRight: 15,
    width: 232,
    overflow: 'hidden',
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
    width: 24,
    height: 24,
    backgroundColor: COLORS.primary,
    marginBottom: 2,
  },
  brandsIcon: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.mediumGray,
    marginBottom: 2,
  },
  categoryIcon: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.mediumGray,
    marginBottom: 2,
  },
  accountIcon: {
    width: 24,
    height: 24,
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
    height: 20,
  },
});

export default HomeScreen;
