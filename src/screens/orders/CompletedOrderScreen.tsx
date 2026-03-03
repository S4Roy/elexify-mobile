import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, ICONS, IMAGES } from '../../utils/constants';
import normalize from '../../utils/helper/normalize';
import SimpleHeader from '../../components/common/SimpleHeader';

const CompletedOrderScreen: React.FC = () => {
  const [rating, setRating] = useState<number>(0);
  const handleStarPress = (selectedRating: number) => {
    setRating(selectedRating);
  };
  const renderStarRating = () => {
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            style={styles.starButton}
            onPress={() => handleStarPress(star)}
          >
            <Image
              source={ICONS.star}
              style={[
                styles.starIcon,
                {
                  tintColor: star <= rating ? COLORS.accent : COLORS.lightGray,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderProductCard = () => (
    <View
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E6E8EC',
        padding: 12,
      }}
    >
      <View style={styles.productCard}>
        <View style={styles.productImageContainer}>
          <Image source={IMAGES.demo} style={styles.productImage} />
        </View>

        <View style={styles.productContent}>
          <View style={styles.productTitle}>
            <Text style={styles.categoryText}>Audio Boards</Text>
            <Text style={styles.productName}>
              300W Amplifier Board (5200 & 1943)
            </Text>
          </View>

          <View style={styles.productStatus}>
            <View style={styles.priceContainer}>
              {/* <Text style={styles.originalPrice}>₹ 1299.00</Text> */}
              <Text style={styles.discountedPrice}>₹ 1200.00</Text>
              <Text style={styles.quantity}>QTY: 1</Text>
            </View>
          </View>
        </View>
      </View>
      {renderDeliveryInfo()}
    </View>
  );

  const renderDeliveryInfo = () => (
    <View style={styles.deliveryContainer}>
      <View style={styles.deliveryInfo}>
        <Text style={styles.deliveryText}>Delivered</Text>
        <Text style={styles.deliveryDate}>20 August 2024</Text>
      </View>
      {renderStarRating()}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <SimpleHeader title="Completed Orders" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Product Card */}
          {renderProductCard()}

          {/* Delivery Info with Rating */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalize(6),
    marginBottom: normalize(16),
  } as ViewStyle,
  starButton: {
    // padding: normalize(8),
    marginHorizontal: normalize(6),
  } as ViewStyle,

  header: {
    height: 64,
    backgroundColor: '#EEFFFD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
    color: COLORS.primary,
    letterSpacing: 0.16,
    flex: 1,
    marginLeft: 11,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    width: 23,
    height: 23,
    tintColor: COLORS.primary,
  },
  cartButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.primary,
  },
  notificationButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationIcon: {
    width: 29,
    height: 29,
    tintColor: COLORS.primary,
  },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 10.875,
    height: 10.875,
    backgroundColor: '#F80036',
    borderRadius: 5.4375,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  productCard: {
    flexDirection: 'row',
    marginBottom: normalize(2),
  },
  productImageContainer: {
    width: 122.55,
    height: 125,
    backgroundColor: '#E6E8EC',
    borderRadius: 10.6,
    overflow: 'hidden',
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productTitle: {
    marginBottom: 12,
  },
  categoryText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#FF9D33',
    marginBottom: 5,
  },
  productName: {
    fontFamily: FONTS.medium,
    fontSize: 15.79,
    color: '#212121',
    lineHeight: 22.1,
  },
  productStatus: {
    marginTop: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  originalPrice: {
    fontFamily: FONTS.regular,
    fontSize: 15.79,
    color: '#828282',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPrice: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 16,
  },
  quantity: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 'auto',
  },
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#333333',
    lineHeight: 21.64,
  },
  deliveryDate: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#333333',
    lineHeight: 21.64,
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  starIcon: {
    width: normalize(20),
    height: normalize(20),
  },
});

export default CompletedOrderScreen;
