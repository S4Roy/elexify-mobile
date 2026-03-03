import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import SimpleHeader from '../../components/common/SimpleHeader';
import { COLORS, FONTS, ICONS, IMAGES } from '../../utils/constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import normalize from '../../utils/helper/normalize';

const CheckoutScreen: React.FC = () => {
  const [couponCode, setCouponCode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');

  // Demo product data (in real app, this would come from cart state)
  const cartItem = {
    id: 1,
    category: 'Audio Boards',
    name: '300W Amplifier Board (5200 & 1943)',
    originalPrice: 1299.0,
    discountedPrice: 1200.0,
    quantity: 1,
    image: IMAGES.demo,
  };

  const orderSummary = {
    subTotal: 83.52,
    vat: 10.52,
    deliveryCharge: 0.0,
    total: 93.52,
  };

  const handlePlaceOrder = () => {
    // Handle order placement logic
    console.log('Order placed with payment method:', selectedPaymentMethod);
    console.log('Coupon code:', couponCode);
    console.log('Delivery instructions:', deliveryInstructions);
  };

  const handleApplyCoupon = () => {
    // Handle coupon application logic
    console.log('Applying coupon:', couponCode);
  };

  return (
    <SafeAreaView style={styles.container}>
      <SimpleHeader title="Cart" showSearch={true} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Shipping Address Section */}
        <View style={styles.shippingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shipping address</Text>
            <TouchableOpacity style={styles.changeButton}>
              <Text style={styles.changeText}>Change</Text>
              <Image source={ICONS.arrownext} style={styles.changeIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.addressCard}>
            <View style={styles.addressTypeContainer}>
              <Image source={ICONS.solidhome} style={styles.homeIcon} />
              <Text style={styles.addressType}>Home</Text>
            </View>

            <Text style={styles.addressText}>
              Archita Appartment, Falt no: 234 87 Anil Roy Road,{'\n'}
              Ballyguange,
            </Text>

            <Text style={styles.addressText}>
              Pin code -712233, Kolkata, West Bengal
            </Text>

            <Text style={styles.landmarkText}>Landmark : Ashoka Tower</Text>
          </View>
        </View>

        {/* Product Item */}
        <View style={styles.productSection}>
          <View style={styles.productCard}>
            <View style={styles.productImageContainer}>
              <Image source={cartItem.image} style={styles.productImage} />
            </View>

            <View style={styles.productContent}>
              <Text style={styles.productCategory}>{cartItem.category}</Text>
              <Text style={styles.productName}>{cartItem.name}</Text>

              <View style={styles.priceContainer}>
                <Text style={styles.discountedPrice}>
                  ₹ {cartItem.discountedPrice.toFixed(2)}{' '}
                </Text>
                <Text style={styles.quantity}>QTY: {cartItem.quantity}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Coupon Section */}
        <View style={styles.couponSection}>
          <Text style={styles.couponTitle}>Have coupon code?</Text>
          <View style={styles.couponInputContainer}>
            <TextInput
              style={styles.couponInput}
              placeholder="ENTER CODE"
              placeholderTextColor={COLORS.placeholderGray}
              value={couponCode}
              onChangeText={setCouponCode}
            />
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyCoupon}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Instructions */}
        <View style={styles.deliverySection}>
          <Text style={styles.deliveryLabel}>Note</Text>
          <View style={styles.deliveryInputContainer}>
            <TextInput
              style={styles.deliveryInput}
              placeholder="Add delivery instructions"
              placeholderTextColor={COLORS.placeholderGray}
              value={deliveryInstructions}
              onChangeText={setDeliveryInstructions}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.orderSummarySection}>
          <Text style={styles.orderSummaryTitle}>Order summary</Text>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sub Total</Text>
              <Text style={styles.summaryValue}>
                ₹ {orderSummary.subTotal.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Vat (5%)</Text>
              <Text style={styles.summaryValue}>
                ₹ {orderSummary.vat.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Charge</Text>
              <Text style={[styles.summaryValue, styles.freeDelivery]}>
                0.00
              </Text>
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerTop} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  ₹ {orderSummary.total.toFixed(2)}
                </Text>
              </View>
              <View style={styles.dividerBottom} />
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Payment method</Text>

          <View style={styles.paymentMethodsContainer}>
            {/* Cash on Delivery */}
            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'cash' &&
                  styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPaymentMethod('cash')}
            >
              <View style={styles.paymentContent}>
                <Image
                  source={ICONS.money}
                  style={{
                    ...styles.paymentIcon,
                    tintColor:
                      selectedPaymentMethod === 'cash'
                        ? COLORS.white
                        : COLORS.shuttleGray,
                  }}
                />
                <Text
                  style={[
                    styles.paymentText,
                    selectedPaymentMethod === 'cash' &&
                      styles.paymentTextSelected,
                  ]}
                >
                  Cash on Delivery
                </Text>
              </View>
            </TouchableOpacity>

            {/* Online Payment */}
            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'online' &&
                  styles.paymentOptionSelected,
                styles.paymentOptionInactive,
              ]}
              onPress={() => setSelectedPaymentMethod('online')}
            >
              <View style={styles.paymentContent}>
                <Image
                  source={ICONS.card}
                  style={{
                    ...styles.paymentIcon,
                    tintColor:
                      selectedPaymentMethod === 'online'
                        ? COLORS.white
                        : COLORS.shuttleGray,
                  }}
                />
                <Text
                  style={[
                    styles.paymentText,
                    selectedPaymentMethod === 'online' &&
                      styles.paymentTextSelected,
                  ]}
                >
                  Online Payment
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Checkout Button */}
      <View style={styles.checkoutButtonContainer}>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.checkoutButtonText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: normalize(16),
  },

  // Shipping Address Section
  shippingSection: {
    backgroundColor: COLORS.lightBackground,
    // marginHorizontal: 19,
    marginTop: 15,
    borderRadius: 15,
    padding: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  sectionTitle: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: '#180000',
    // lineHeight: 16,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.primary,
    // lineHeight: 21,
    letterSpacing: 0.28,
    marginRight: 4,
  },
  changeIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  addressCard: {
    gap: 10,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: 15,
  },
  homeIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    marginRight: 5,
  },
  addressType: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#262626',
    // lineHeight: 21,
  },
  addressText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.charcoal,
    // lineHeight: 23,
  },
  landmarkText: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 14,
    color: COLORS.charcoal,
    // lineHeight: 23,
  },

  // Product Section
  productSection: {
    // marginHorizontal: 19,
    marginTop: 15,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 8.33,
    padding: 8,
    flexDirection: 'row',
    height: 149,
  },
  productImageContainer: {
    width: 122.55,
    height: 125,
    backgroundColor: COLORS.borderGray,
    borderRadius: 10.6,
    marginRight: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  productContent: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  productCategory: {
    fontFamily: FONTS.regular,
    fontSize: normalize(11),
    color: COLORS.accent,
    // lineHeight: 21,
  },
  productName: {
    fontFamily: FONTS.medium,
    fontSize: normalize(13),
    color: COLORS.blackText,
    // lineHeight: 22.1,
    marginTop: 5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  originalPrice: {
    fontFamily: FONTS.regular,
    fontSize: 15.79,
    color: COLORS.priceStriked,
    // lineHeight: 23.68,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontFamily: FONTS.bold,
    fontSize: 16,

    color: COLORS.primary,
    // lineHeight: 24,
    flex: 1,
  },
  quantity: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.primary,
    // lineHeight: 21.64,
  },

  // Coupon Section
  couponSection: {
    backgroundColor: COLORS.primary,
    // marginHorizontal: 19,
    marginTop: 15,
    borderRadius: 15,
    padding: normalize(15),
  },
  couponTitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.white,
    // lineHeight: 24,
    marginBottom: 17,
  },
  couponInputContainer: {
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingLeft: 25,
  },
  couponInput: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.black,
    letterSpacing: 2.8,
    // lineHeight: 20,
  },
  applyButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: normalize(25),
    // paddingVertical: 23,
    // marginRight: -8,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontFamily: FONTS.medium,
    fontSize: normalize(12),
    color: COLORS.white,
    // lineHeight: 20,
  },

  // Delivery Instructions
  deliverySection: {
    // marginHorizontal: 19,
    marginTop: 29,
  },
  deliveryLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#656565',
    // lineHeight: 20,
    letterSpacing: -0.42,
    marginBottom: 8,
  },
  deliveryInputContainer: {
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 8,
    height: 103,
  },
  deliveryInput: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.black,
    letterSpacing: -0.42,
    // lineHeight: 20,
    padding: 16,
    height: '100%',
  },

  // Order Summary
  orderSummarySection: {
    // marginHorizontal: 19,
    marginTop: 19,
  },
  orderSummaryTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: normalize(14),
    color: '#180000',
    // lineHeight: 20,
    marginBottom: 19,
  },
  summaryContainer: {
    gap: 26,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: FONTS.medium,
    fontSize: normalize(12),
    color: '#555555',
    // lineHeight: 25.76,
  },
  summaryValue: {
    fontFamily: FONTS.regular,
    fontSize: normalize(12),
    color: '#180000',
    // lineHeight: 25.76,
  },
  freeDelivery: {
    opacity: 0.3,
  },
  dividerContainer: {
    marginTop: 20,
  },
  dividerTop: {
    height: 1,
    backgroundColor: '#858585',
    opacity: 0.3,
    marginBottom: 14,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: normalize(12),
    color: '#555555',
    // lineHeight: 25.76,
  },
  totalValue: {
    fontFamily: FONTS.semiBold,
    fontSize: normalize(12),
    color: '#180000',
    // lineHeight: 25.76,
  },
  dividerBottom: {
    height: 1,
    backgroundColor: '#858585',
    opacity: 0.3,
    marginTop: 14,
  },

  // Payment Method
  paymentSection: {
    // marginHorizontal: 19,
    marginTop: 30,
    marginBottom: 100, // Space for fixed checkout button
  },
  paymentTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: normalize(14),
    color: '#180000',
    // lineHeight: 20,
    marginBottom: 19,
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    gap: 14,
  },
  paymentOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#959595',
    borderRadius: 10,
    height: 79,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  paymentOptionInactive: {
    borderColor: '#959595',
  },
  paymentContent: {
    // alignItems: 'center',
    gap: 10,
  },
  paymentIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  paymentText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#959595',
    // lineHeight: 40,
    textAlign: 'center',
  },
  paymentTextSelected: {
    color: COLORS.white,
  },
  paymentTextInactive: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#959595',
    // lineHeight: 40,
    textAlign: 'center',
  },

  // Checkout Button
  checkoutButtonContainer: {
    // position: 'absolute',
    // bottom: 0,
    // left: 0,
    // right: 0,
    // backgroundColor: COLORS.white,
    // paddingHorizontal: 0,
    // paddingTop: 0,
    // height: 75,
    // backgroundColor: COLORS.white,
    // flexDirection: 'row',
    // alignItems: 'center',
    // borderTopWidth: 1,
    // borderTopColor: COLORS.lightGray,
    height: normalize(55),
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: normalize(14),
    color: COLORS.white,
    // lineHeight: 30,
    letterSpacing: 0.54,
    textAlign: 'center',
  },
});

export default CheckoutScreen;
