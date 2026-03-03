import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { COLORS, FONTS, ICONS, IMAGES } from '../../utils/constants';
import normalize from '../../utils/helper/normalize';
import { navigate } from '../../utils/helper/RootNavigation';

interface ProductCardProps {
  cardwidth: number | string;
  isDiscount?: boolean;
  imgHeight: number;
  titleFontSize?: number;
  marginRight?: number;
  amountFontSize?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string | undefined;
}

const ProductCard: React.FC<ProductCardProps> = ({
  cardwidth,
  isDiscount = true,
  imgHeight,
  titleFontSize,
  marginRight,
  amountFontSize,
  borderRadius,
  borderWidth,
  borderColor,
}) => {
  return (
    <TouchableOpacity
      onPress={() => navigate('ProductDetailsScreen')}
      activeOpacity={0.7}
      style={[
        styles.productImageContainer,
        {
          width: cardwidth,
          marginRight: marginRight,
          borderRadius: borderRadius,
          borderWidth: normalize(borderWidth || 0),
          borderColor: borderColor,
        },
      ]}
    >
      <View>
        <View
          style={{
            width: '100%',
            height: imgHeight,
            backgroundColor: '#E6E8EC',
            borderRadius: 10.5,
            overflow: 'hidden',
          }}
        >
          <Image source={IMAGES.demo3} style={styles.flashSaleImage} />
        </View>
        <TouchableOpacity style={styles.heartIcon}>
          <Image
            source={ICONS.heart}
            style={{
              height: normalize(20),
              width: normalize(20),
              resizeMode: 'contain',
            }}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.productCategory}>Audio Boards</Text>
      <Text
        style={{ ...styles.productTitle, fontSize: titleFontSize }}
        numberOfLines={2}
      >
        300W Amplifier Board (5200 & 1943)
      </Text>
      <View style={styles.priceContainer}>
        {isDiscount && (
          <Text style={{ ...styles.originalPrice, fontSize: amountFontSize }}>
            ₹ 1299.00
          </Text>
        )}
        <Text style={{ ...styles.salePrice, fontSize: amountFontSize }}>
          ₹ 1200.00
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  productImageContainer: {
    backgroundColor: COLORS.white,
    // borderRadius: 10,
    marginRight: 0,
    width: 232,
    overflow: 'hidden',
    position: 'relative',
    padding: normalize(7),
    borderWidth: 0,
    borderColor: undefined,
  },
  flashSaleImage: {
    width: '100%',
    height: '100%',
  },
  heartIcon: {
    position: 'absolute',
    top: normalize(9),
    right: normalize(10),
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
    marginVertical: normalize(5),
  },
  productTitle: {
    fontFamily: FONTS.medium,
    fontSize: normalize(12),
    color: COLORS.blackText,
    // lineHeight: 22.1,
    marginBottom: 5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontFamily: FONTS.regular,
    fontSize: normalize(12),
    color: COLORS.priceStriked,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  salePrice: {
    fontFamily: FONTS.bold,
    fontSize: normalize(12),
    color: COLORS.primary,
  },
});

export default ProductCard;
