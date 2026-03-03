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
import SimpleHeader from '../../components/common/SimpleHeader';
import normalize from '../../utils/helper/normalize';
import { navigate } from '../../utils/helper/RootNavigation';

interface OrderItem {
  id: string;
  category: string;
  title: string;
  originalPrice: string;
  currentPrice: string;
  quantity: number;
  image: any;
}

interface OrderItemCardProps {
  item: OrderItem;
  onPress?: () => void;
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigate('OrderDetailsScreen')}
      // activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.productImage} />
      </View>

      <View
        style={{
          width: '55%',
          marginLeft: normalize(8),
        }}
      >
        {/* <View style={styles.titleSection}> */}
        <Text style={styles.categoryText}>{item.category}</Text>
        <Text style={styles.productTitle}>{item.title}</Text>
        {/* </View> */}

        {/* <View style={styles.statusSection}> */}
        <View style={styles.priceSection}>
          <Text style={styles.currentPrice}>{item.currentPrice}</Text>
          <Text style={styles.quantityText}>QTY: {item.quantity}</Text>
        </View>
        {/* </View> */}
      </View>
    </TouchableOpacity>
  );
};

const OngoingOrderScreen: React.FC = () => {
  const orderItems: OrderItem[] = [
    {
      id: '1',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      currentPrice: '₹ 1200.00',
      quantity: 1,
      image: IMAGES.demo4, // Using demo image from constants
    },
    {
      id: '2',
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹ 1299.00',
      currentPrice: '₹ 1200.00',
      quantity: 1,
      image: IMAGES.demo3, // Using demo2 image
    },
    // Add more items as needed
  ];

  const handleBackPress = () => {
    // Handle back navigation
    console.log('Back pressed');
  };

  const handleSearchPress = () => {
    console.log('Search pressed');
  };

  const handleCartPress = () => {
    console.log('Cart pressed');
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  const handleOrderItemPress = (item: OrderItem) => {
    console.log('Order item pressed:', item.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <SimpleHeader title="Ongoing Order" />
      {/* Separator Line */}
      <View style={styles.separatorLine} />

      {/* Order Items Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {orderItems.map((item, index) => (
            <View
              key={item.id}
              style={index > 0 ? styles.itemWithMargin : undefined}
            >
              <OrderItemCard
                item={item}
                onPress={() => handleOrderItemPress(item)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white, // #EEFFFD
  },
  safeArea: {
    flex: 1,
  },
  // Header Styles
  headerContainer: {
    backgroundColor: COLORS.lightBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  backButton: {
    width: 27,
    height: 27,
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
    color: COLORS.primary, // #00796A
    letterSpacing: 0.16,
    lineHeight: 24,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  headerIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.textPrimary,
  },
  notificationButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10.875,
    height: 10.875,
    borderRadius: 5.4375,
    backgroundColor: COLORS.notificationRed, // #F80036
  },
  // Separator
  separatorLine: {
    height: 1,
    backgroundColor: COLORS.lightGreen, // #F0F0F0
    marginHorizontal: 16,
  },
  // Content Styles
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20, // Match Figma spacing
    paddingTop: 18,
  },
  itemWithMargin: {
    marginTop: 20, // Spacing between order items
  },
  // Order Card Styles
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8.33, // Exact border radius from Figma
    borderWidth: 1,
    borderColor: COLORS.borderGray, // #E6E8EC
    flexDirection: 'row',
    padding: normalize(8),
    overflow: 'hidden',
    alignItems: 'center',
    // justifyContent: 'center',
  },
  imageContainer: {
    width: 122.55, // Exact width from Figma
    height: 125, // Exact height from Figma
    backgroundColor: COLORS.borderGray, // #E6E8EC
    borderRadius: 10.6, // Exact border radius from Figma
    // margin: 8.82, // Positioning margin
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: normalize(122), // Exact width from Figma
    height: normalize(122), // Exact height from Figma
    resizeMode: 'contain',
  },

  titleSection: {
    flex: 1,
  },
  categoryText: {
    fontFamily: FONTS.regular,
    fontSize: normalize(11),
    color: COLORS.accent, // #FF9D33
    letterSpacing: 0,
    lineHeight: 21,
    marginBottom: 5,
  },
  productTitle: {
    fontFamily: FONTS.medium,
    fontSize: normalize(13), // Exact font size from Figma
    color: COLORS.blackText, // #212121
    letterSpacing: 0,
    lineHeight: 22.1,
    maxWidth: 246, // Max width from Figma
  },
  statusSection: {
    justifyContent: 'flex-end',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: normalize(4),
    // height: 24, // Exact height from Figma
  },
  originalPrice: {
    fontFamily: FONTS.regular,
    fontSize: 15.79, // Exact font size from Figma
    color: COLORS.priceStriked, // #828282
    letterSpacing: 0,
    lineHeight: 23.68,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  currentPrice: {
    fontFamily: FONTS.bold,
    fontSize: normalize(13), // Exact font size from Figma
    color: COLORS.primary, // #00796A
    letterSpacing: 0,
    // lineHeight: 24,
    // flex: 1,
  },
  quantityText: {
    fontFamily: FONTS.regular,
    fontSize: normalize(12), // Exact font size from Figma
    color: COLORS.primary, // #00796A
    letterSpacing: 0,
    // lineHeight: 21.64,
    // position: 'absolute',
    // right: 0,
  },
});

export default OngoingOrderScreen;
