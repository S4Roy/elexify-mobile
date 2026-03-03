import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, ICONS, IMAGES } from '../../utils/constants';
import SimpleHeader from '../../components/common/SimpleHeader';
import normalize from '../../utils/helper/normalize';
import { navigate } from '../../utils/helper/RootNavigation';
import ProductCard from '../../components/common/ProductCard';

interface CartItemData {
  id: string;
  category: string;
  title: string;
  originalPrice: string;
  salePrice: string;
  quantity: number;
  image: any;
  isSelected: boolean;
}

interface ProductCardData {
  id: string;
  category: string;
  title: string;
  originalPrice: string;
  salePrice: string;
  image: any;
}

interface CartItemProps {
  item: CartItemData;
  onQuantityChange: (id: string, quantity: number) => void;
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onBuyNow: (id: string) => void;
}

interface ProductCardProps {
  item: ProductCardData;
  onPress: (id: string) => void;
}

const CartScreen: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItemData[]>([
    {
      id: '1',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      quantity: 1,
      image: IMAGES.demo,
      isSelected: true,
    },
    {
      id: '2',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      quantity: 1,
      image: IMAGES.demo2,
      isSelected: true,
    },
    {
      id: '3',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      quantity: 1,
      image: IMAGES.demo3,
      isSelected: true,
    },
  ]);

  const [previouslyBought] = useState<ProductCardData[]>([
    {
      id: '4',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      image: IMAGES.demo4,
    },
    {
      id: '5',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      image: IMAGES.demo5,
    },
    {
      id: '6',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      salePrice: '₹ 1200.00',
      image: IMAGES.demo6,
    },
  ]);

  const handleBack = () => {
    // TODO: Implement navigation back
    console.log('Navigate back');
  };

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Open search');
  };

  const handleNotificationBell = () => {
    // TODO: Implement notification action
    console.log('Open notifications');
  };

  const handleCart = () => {
    // TODO: Implement cart action
    console.log('Cart action');
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
      ),
    );
  };

  const handleToggleSelect = (id: string) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isSelected: !item.isSelected } : item,
      ),
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleBuyNow = (id: string) => {
    // TODO: Implement buy now functionality
    console.log('Buy now:', id);
  };

  const handleProductPress = (id: string) => {
    // TODO: Navigate to product details
    console.log('Product pressed:', id);
  };

  const handleCheckout = () => {
    // TODO: Navigate to checkout
    console.log('Navigate to checkout');
    navigate('CheckoutScreen');
  };

  const calculateTotal = () => {
    return cartItems
      .filter(item => item.isSelected)
      .reduce((total, item) => {
        const price = parseFloat(
          item.salePrice.replace('₹ ', '').replace(',', ''),
        );
        return total + price * item.quantity;
      }, 0);
  };

  const getSelectedItemsCount = () => {
    return cartItems.filter(item => item.isSelected).length;
  };

  const renderAnnouncementBar = () => (
    <View style={styles.announcementBar}>
      <View style={styles.announcementContent}>
        <Image source={ICONS.delivered} style={styles.shippingIcon} />
        <Text style={styles.announcementText}>FREE shipping on ₹ 500.00+</Text>
      </View>
    </View>
  );

  const renderQuantityControls = (item: CartItemData) => (
    <View style={styles.quantityContainer}>
      <TouchableOpacity
        style={styles.quantityButton}
        onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
      >
        <Image source={ICONS.minus} style={styles.quantityIcon} />
      </TouchableOpacity>

      <View style={styles.quantityInputContainer}>
        <Text style={styles.quantityText}>{item.quantity}</Text>
      </View>

      <TouchableOpacity
        style={styles.quantityButton}
        onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
      >
        <Image source={ICONS.add} style={styles.quantityIcon} />
      </TouchableOpacity>
    </View>
  );

  const renderCartItem = ({ item }: { item: CartItemData }) => (
    <View style={styles.cartItem}>
      <TouchableOpacity style={styles.heartButton}>
        <Image source={ICONS.heart} style={styles.heartIcon} />
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View>
          {/* Selection Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleToggleSelect(item.id)}
          >
            <View
              style={[
                styles.checkbox,
                item.isSelected && styles.checkboxSelected,
              ]}
            >
              {item.isSelected && (
                <Image source={ICONS.check} style={styles.checkIcon} />
              )}
            </View>
          </TouchableOpacity>

          {/* Product Image */}
          <View style={styles.productImageContainer}>
            <Image source={item.image} style={styles.productImage} />
          </View>
        </View>

        {/* Product Details */}
        <View style={{ width: '65%', marginLeft: 12 }}>
          <Text style={styles.categoryText}>{item.category}</Text>
          <Text style={styles.productTitle}>{item.title}</Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={styles.priceContainer}>
              <Text style={styles.salePrice}>{item.salePrice}</Text>
            </View>
            {/* Quantity Controls */}
            <View style={styles.rightSection}>
              {renderQuantityControls(item)}
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRemoveItem(item.id)}
        >
          <Image source={ICONS.bin} style={styles.actionIcon} />
          <Text style={styles.actionText}>Remove from cart</Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleBuyNow(item.id)}
        >
          <Image
            source={ICONS.shoppingcart}
            style={{
              ...styles.actionIcon,
              height: normalize(20),
              width: normalize(20),
            }}
          />
          <Text style={styles.buyNowText}>Buy this product</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProductCard = ({ item }: { item: ProductCardData }) => (
    <ProductCard
      cardwidth={normalize(170)}
      imgHeight={normalize(130)}
      titleFontSize={normalize(12)}
      marginRight={normalize(10)}
      borderRadius={normalize(10)}
      borderWidth={1}
      borderColor="#E6E8EC"
    />
  );

  const renderPreviouslyBought = () => (
    <View style={styles.previouslyBoughtSection}>
      <Text style={styles.sectionTitle}>Previously Bought</Text>
      <FlatList
        data={previouslyBought}
        renderItem={renderProductCard}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
      />
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.footerLeft}>
        <Text style={styles.itemCount}>{getSelectedItemsCount()} Items</Text>
        <Text style={styles.totalAmount}>₹ {calculateTotal().toFixed(2)}</Text>
      </View>

      <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
        <Text style={styles.checkoutText}>Checkout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SimpleHeader title="Cart" />
      {renderAnnouncementBar()}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cartItemsContainer}>
          {cartItems.map(item => (
            <View key={item.id}>{renderCartItem({ item })}</View>
          ))}
        </View>

        {renderPreviouslyBought()}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {renderFooter()}
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
  announcementBar: {
    backgroundColor: COLORS.primary,
    paddingVertical: normalize(10),
    // paddingHorizontal: 20,
  },
  announcementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shippingIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 8,
    tintColor: COLORS.backgroundTertiary,
  },
  announcementText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.backgroundTertiary,
    // lineHeight: 16,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  cartItemsContainer: {
    paddingHorizontal: normalize(10),
    paddingTop: 20,
  },
  cartItem: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    position: 'relative',
    width: '100%',
  },
  checkboxContainer: {
    position: 'absolute',
    top: normalize(-4),
    left: normalize(-4),
    zIndex: 1,
  },
  checkbox: {
    width: normalize(17),
    height: normalize(17),
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 3,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
  },
  checkIcon: {
    width: normalize(12),
    height: normalize(12),
    resizeMode: 'contain',
    tintColor: COLORS.white,
  },
  productImageContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    // marginBottom: 12,
    backgroundColor: '#E6E8EC',
    borderRadius: 10,
    overflow: 'hidden',
  },
  productImage: {
    width: normalize(90),
    height: normalize(90),
    borderRadius: 10,
    resizeMode: 'cover',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
  },
  heartIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  productDetails: {
    marginBottom: 12,
  },
  categoryText: {
    fontFamily: FONTS.regular,
    fontSize: normalize(11),
    color: COLORS.accent,
    // lineHeight: 21,
    marginBottom: 2,
  },
  productTitle: {
    fontFamily: FONTS.medium,
    fontSize: normalize(12),
    color: COLORS.blackText,
    // lineHeight: 22,
    // marginBottom: 8,
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
    lineHeight: 24,
  },
  salePrice: {
    fontFamily: FONTS.bold,
    fontSize: normalize(14),
    color: COLORS.primary,
    lineHeight: 24,
  },
  rightSection: {},
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityIcon: {
    width: normalize(20),
    height: normalize(20),
    resizeMode: 'contain',
    tintColor: COLORS.white,
  },
  quantityInputContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    minWidth: 30,
    alignItems: 'center',
  },
  quantityText: {
    fontFamily: 'Work Sans',
    fontSize: 12.76,
    color: COLORS.primary,
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGray,
    paddingTop: 12,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: normalize(15),
    height: normalize(15),
    resizeMode: 'contain',
    marginRight: normalize(7),
  },
  actionText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.subtleGray,
    lineHeight: 22,
  },
  buyNowText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 22,
  },
  actionDivider: {
    width: 1,
    backgroundColor: COLORS.borderGray,
    marginHorizontal: 16,
    opacity: 0.12,
  },
  previouslyBoughtSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.charcoal,
    lineHeight: 27,
    marginBottom: 20,
  },
  horizontalList: {
    paddingHorizontal: 4,
  },
  cardSeparator: {
    width: 15,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    width: 232,
    padding: 12,
  },
  cardImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  cardImage: {
    width: '100%',
    height: 166,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  cardHeartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
  },
  cardHeartIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  cardContent: {
    paddingHorizontal: 4,
  },
  cardCategory: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.accent,
    lineHeight: 18,
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: FONTS.medium,
    fontSize: 15.79,
    color: COLORS.blackText,
    lineHeight: 22,
    marginBottom: 8,
  },
  cardPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardOriginalPrice: {
    fontFamily: FONTS.regular,
    fontSize: 15.79,
    color: COLORS.priceStriked,
    textDecorationLine: 'line-through',
    marginRight: 8,
    lineHeight: 24,
  },
  cardSalePrice: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 20,
  },
  footer: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  footerLeft: {
    width: '45%',
  },
  itemCount: {
    fontFamily: FONTS.medium,
    fontSize: normalize(10),
    color: '#495F8A',
  },
  totalAmount: {
    fontFamily: FONTS.semiBold,
    fontSize: normalize(16),
    color: COLORS.primary,
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 18,
    width: '50%',
    alignItems: 'center',
  },
  checkoutText: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.white,
    lineHeight: 30,
  },
});

export default CartScreen;
