import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { COLORS, FONTS, ICONS } from '../../utils/constants';
import SimpleHeader from '../../components/common/SimpleHeader';
import { navigate } from '../../utils/helper/RootNavigation';
import ProductCard from '../../components/common/ProductCard';
import normalize from '../../utils/helper/normalize';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Product {
  id: string;
  category: string;
  title: string;
  originalPrice: number;
  discountedPrice: number;
  image: any;
  isInWishlist: boolean;
}

const RecentlyViewedScreen: React.FC = () => {
  const [recentlyViewedItems, setRecentlyViewedItems] = useState<Product[]>([
    {
      id: '1',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: 1299.0,
      discountedPrice: 1200.0,
      image: require('../../assets/images/demo.png'),
      isInWishlist: true,
    },
    {
      id: '2',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: 1299.0,
      discountedPrice: 1200.0,
      image: require('../../assets/images/demo2.png'),
      isInWishlist: true,
    },
    {
      id: '3',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: 1299.0,
      discountedPrice: 1200.0,
      image: require('../../assets/images/demo3.png'),
      isInWishlist: true,
    },
    {
      id: '4',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: 1299.0,
      discountedPrice: 1200.0,
      image: require('../../assets/images/demo4.png'),
      isInWishlist: true,
    },
    {
      id: '5',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: 1299.0,
      discountedPrice: 1200.0,
      image: require('../../assets/images/demo5.png'),
      isInWishlist: true,
    },
    {
      id: '6',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: 1299.0,
      discountedPrice: 1200.0,
      image: require('../../assets/images/demo6.png'),
      isInWishlist: true,
    },
  ]);

  const toggleWishlist = (productId: string) => {
    setRecentlyViewedItems(
      prev =>
        prev
          .map(item =>
            item.id === productId
              ? { ...item, isInWishlist: !item.isInWishlist }
              : item,
          )
          .filter(item => item.isInWishlist), // Remove items when heart is untapped
    );
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <ProductCard
      cardwidth={'50%'}
      imgHeight={normalize(130)}
      titleFontSize={normalize(12)}
      // marginRight={normalize(10)}
      // borderRadius={normalize(10)}
      borderWidth={1}
      borderColor="#E6E8EC"
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <SimpleHeader title="Recently Viewed" />

      {/* Products Grid */}
      <FlatList
        data={recentlyViewedItems}
        renderItem={renderProductCard}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsContainer}
        columnWrapperStyle={styles.productRow}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 64,
    backgroundColor: COLORS.lightBackground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 27,
    height: 27,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.primary,
  },
  headerTitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.primary,
    letterSpacing: 0.16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 30,
    height: 30,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.shuttleGray,
  },
  notificationButton: {
    width: 38,
    height: 38,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: COLORS.notificationRed,
  },
  productsContainer: {
    padding: 16,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 146,
    backgroundColor: COLORS.borderGray,
    borderRadius: 9,
    margin: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: 129,
    height: 129,
    borderRadius: 8,
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 21,
    height: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    width: 18,
    height: 18,
  },
  productContent: {
    padding: 12,
    paddingTop: 0,
  },
  titleSection: {
    marginBottom: 16,
  },
  categoryText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.accent,
    marginBottom: 4,
    lineHeight: 16,
  },
  titleText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.blackText,
    lineHeight: 19,
    height: 38,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.priceStriked,
    textDecorationLine: 'line-through',
    marginRight: 8,
    lineHeight: 21,
  },
  discountedPrice: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 21,
  },
});

export default RecentlyViewedScreen;
