import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, ICONS, IMAGES } from '../../utils/constants';
import SimpleHeader from '../../components/common/SimpleHeader';
import normalize from '../../utils/helper/normalize';

interface CancellationReason {
  id: string;
  label: string;
  selected: boolean;
}

const CancelOrderScreen: React.FC = () => {
  const [reasons, setReasons] = useState<CancellationReason[]>([
    { id: '1', label: 'Product is not good', selected: false },
    { id: '2', label: 'Wrong product placed by mistake', selected: false },
    { id: '3', label: 'Other', selected: true },
  ]);

  const [comment, setComment] = useState('');

  const handleReasonToggle = (id: string) => {
    setReasons(prev =>
      prev.map(reason =>
        reason.id === id ? { ...reason, selected: !reason.selected } : reason,
      ),
    );
  };

  const handleSubmit = () => {
    const selectedReasons = reasons.filter(reason => reason.selected);
    console.log('Cancel order request:', {
      reasons: selectedReasons,
      comment,
    });
  };

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

  const renderCheckbox = (reason: CancellationReason) => (
    <TouchableOpacity
      key={reason.id}
      style={styles.checkboxRow}
      onPress={() => handleReasonToggle(reason.id)}
    >
      <View
        style={[styles.checkbox, reason.selected && styles.checkboxSelected]}
      >
        {reason.selected && (
          <Image source={ICONS.check} style={styles.checkIcon} />
        )}
      </View>
      <Text style={styles.checkboxLabel}>{reason.label}</Text>
    </TouchableOpacity>
  );

  const renderReasonSection = () => (
    <View style={styles.reasonSection}>
      <Text style={styles.sectionTitle}>Reason For Cancellation</Text>
      <View style={styles.checkboxContainer}>
        {reasons.map(reason => renderCheckbox(reason))}
      </View>
    </View>
  );

  const renderCommentSection = () => (
    <View style={styles.commentSection}>
      <TextInput
        style={styles.commentInput}
        value={comment}
        onChangeText={setComment}
        placeholder="Your Comment"
        placeholderTextColor="#989898"
        multiline
        textAlignVertical="top"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <SimpleHeader title="Cancel Order" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Product Card */}
          {renderProductCard()}

          {/* Reason Section */}
          {renderReasonSection()}

          {/* Comment Section */}
          {renderCommentSection()}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleSubmit}>
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>
      </View>
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
    // height: 149,
    alignItems: 'center',
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
    marginBottom: 5,
    lineHeight: 21,
  },
  productName: {
    fontFamily: FONTS.medium,
    fontSize: normalize(13),
    color: '#212121',
    lineHeight: 22.1,
  },
  productStatus: {
    // marginTop: 12,
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
  reasonSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: FONTS.medium,
    fontSize: 18,
    color: '#180000',
    letterSpacing: 0.36,
    lineHeight: 20,
    marginBottom: 21,
  },
  checkboxContainer: {
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#959595',
    borderRadius: 4,
    marginRight: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkIcon: {
    width: 10,
    height: 10,
    tintColor: COLORS.white,
  },
  checkboxLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#000000',
    letterSpacing: 0.28,
    lineHeight: 20,
    flex: 1,
  },
  commentSection: {
    marginBottom: 20,
  },
  commentInput: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 8,
    height: 165,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#000000',
    letterSpacing: -0.42,
    lineHeight: 20,
  },
  buttonContainer: {
    backgroundColor: COLORS.white,
    height: 75,
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  cancelButton: {
    backgroundColor: COLORS.primary,
    // height: 75,
    paddingVertical: normalize(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: normalize(14),
    color: COLORS.white,
    letterSpacing: 0.54,
    // lineHeight: 30,
  },
});

export default CancelOrderScreen;
