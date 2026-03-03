import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, ICONS, IMAGES } from '../../utils/constants';
import SimpleHeader from '../../components/common/SimpleHeader';
import { navigate } from '../../utils/helper/RootNavigation';
import normalize from '../../utils/helper/normalize';

const OrderDetailsScreen: React.FC = () => {
  const renderProductCard = () => (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        <Image source={IMAGES.demo3} style={styles.productImage} />
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
  );

  const renderNote = () => (
    <View style={styles.noteSection}>
      <Text style={styles.noteTitle}>Note</Text>
      <Text style={styles.noteText}>
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry.
      </Text>
    </View>
  );

  const renderOrderSummary = () => (
    <View style={styles.orderSummarySection}>
      <Text style={styles.sectionTitle}>Order summary</Text>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Sub Total</Text>
        <Text style={styles.summaryValue}>₹ 83.452</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Vat (5%)</Text>
        <Text style={styles.summaryValue}>₹ 10.452</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Shipping Charge</Text>
        <Text style={[styles.summaryValue, styles.freeShipping]}>0.000</Text>
      </View>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹ 93.552</Text>
        </View>
        <View style={styles.divider} />
      </View>
    </View>
  );

  const renderPaymentMethod = () => (
    <View style={styles.paymentSection}>
      <Text style={{ ...styles.sectionTitle, marginBottom: normalize(0) }}>
        Payment method
      </Text>
      <View style={styles.paymentMethodCard}>
        <Image source={ICONS.money} style={styles.paymentIcon} />
        <Text style={styles.paymentText}>Cash on Delivery</Text>
      </View>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.buttonSection}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigate('CancelOrderScreen')}
        >
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.trackButton}>
          <Text style={styles.trackButtonText}>Track Order</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.downloadButton}>
        <Text style={styles.downloadButtonText}>Download Invoice</Text>
      </TouchableOpacity>
    </View>
  );

  const renderShippingAddress = () => (
    <View style={styles.shippingSection}>
      <Text style={styles.shippingTitle}>Shipping address</Text>

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
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <SimpleHeader title="Order Details" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Product Card */}
          {renderProductCard()}

          {/* Note Section */}
          {renderNote()}

          {/* Order Summary */}
          {renderOrderSummary()}

          {/* Payment Method */}
          {renderPaymentMethod()}

          {/* Action Buttons */}
          {renderActionButtons()}

          {/* Shipping Address */}
          {renderShippingAddress()}
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
    padding: 19,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8.33,
    borderWidth: 1,
    borderColor: '#E6E8EC',
    padding: normalize(8),
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
    // height: 149,
  },
  productImageContainer: {
    width: 122.55,
    height: 125,
    backgroundColor: '#E6E8EC',
    borderRadius: 10.6,
    overflow: 'hidden',
    marginRight: normalize(8),
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productContent: {
    flex: 1,
    // justifyContent: 'space-between',
  },
  productTitle: {
    marginBottom: 12,
  },
  categoryText: {
    fontFamily: FONTS.regular,
    fontSize: normalize(11),
    color: '#FF9D33',
    // marginBottom: 5,
    // lineHeight: 21,
  },
  productName: {
    fontFamily: FONTS.medium,
    fontSize: normalize(13),
    color: '#212121',
    // lineHeight: 22.1,
  },
  productStatus: {
    // marginTop: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  originalPrice: {
    fontFamily: FONTS.regular,
    fontSize: 15.79,
    color: '#828282',
    textDecorationLine: 'line-through',
    marginRight: 8,
    lineHeight: 23.68,
  },
  discountedPrice: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 16,
    lineHeight: 24,
  },
  quantity: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 'auto',
    lineHeight: 21.64,
  },
  noteSection: {
    marginBottom: 20,
  },
  noteTitle: {
    fontFamily: FONTS.medium,
    fontSize: normalize(14),
    color: '#000000',
    letterSpacing: -0.48,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteText: {
    fontFamily: FONTS.regular,
    fontSize: normalize(11),
    color: '#656565',
    letterSpacing: 0.28,
    lineHeight: 20,
  },
  orderSummarySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: normalize(14.5),
    color: '#180000',
    lineHeight: 20,
    marginBottom: 25,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: {
    fontFamily: FONTS.medium,
    fontSize: normalize(12),
    color: '#555555',
    lineHeight: 25.76,
  },
  summaryValue: {
    fontFamily: FONTS.regular,
    fontSize: normalize(12),
    color: '#180000',
    lineHeight: 25.76,
  },
  freeShipping: {
    opacity: 0.3,
  },
  dividerContainer: {
    marginTop: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#858585',
    opacity: 0.3,
    marginVertical: 13,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: normalize(13),
    color: '#555555',
    lineHeight: 25.76,
  },
  totalValue: {
    fontFamily: FONTS.semiBold,
    fontSize: normalize(13),
    color: '#180000',
    lineHeight: 25.76,
  },
  paymentSection: {
    // marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentMethodCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    // padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: normalize(10),
    // height: 52,
    // width: 212,
    // alignSelf: 'flex-end',
  },
  paymentIcon: {
    width: 32,
    height: 32,
    marginRight: 10,
    tintColor: COLORS.primary,
  },
  paymentText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.primary,
    lineHeight: 41,
  },
  buttonSection: {
    marginVertical: normalize(15),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 21,
  },
  cancelButton: {
    flex: 1,
    height: 55,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#F80036',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14.46,
    color: '#F80036',
    lineHeight: 19.28,
  },
  trackButton: {
    flex: 1,
    height: 55,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14.46,
    color: COLORS.primary,
    lineHeight: 19.28,
  },
  downloadButton: {
    height: 55,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14.46,
    color: COLORS.white,
    lineHeight: 19.28,
  },
  shippingSection: {
    backgroundColor: '#EEF5FF',
    opacity: 0.64,
    borderRadius: 15,
    padding: 18,
    marginBottom: 20,
  },
  shippingTitle: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: '#180000',
    lineHeight: 16,
    marginBottom: 20,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  homeIcon: {
    width: 18,
    height: 18,
    marginRight: 3,
    tintColor: '#000000',
  },
  addressType: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#000000',
    lineHeight: 21,
  },
  addressText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#333333',
    lineHeight: 23,
    marginBottom: 2,
  },
  landmarkText: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 14,
    color: '#333333',
    lineHeight: 23,
  },
});

export default OrderDetailsScreen;
