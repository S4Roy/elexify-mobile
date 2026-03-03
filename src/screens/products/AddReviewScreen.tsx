import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  StatusBar,
  Alert,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { COLORS, FONTS, ICONS, IMAGES } from '../../utils/constants';
import normalize from '../../utils/helper/normalize';
import SimpleHeader from '../../components/common/SimpleHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddReviewScreen: React.FC = () => {
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleStarPress = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleAddPhoto = () => {
    // Photo picker implementation would go here
    Alert.alert(
      'Add Photo',
      'Photo picker functionality would be implemented here',
    );
  };

  const handleSubmitReview = () => {
    if (rating === 0) {
      Alert.alert(
        'Rating Required',
        'Please select a rating before submitting your review.',
      );
      return;
    }
    if (reviewText.trim().length === 0) {
      Alert.alert(
        'Review Required',
        'Please write a review before submitting.',
      );
      return;
    }

    Alert.alert('Review Submitted', 'Thank you for your review!', [
      { text: 'OK', onPress: () => console.log('Review submitted') },
    ]);
  };

  const renderProductCard = () => (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        <View style={styles.productImagePlaceholder}>
          {/* <Text style={styles.placeholderText}>IMG</Text> */}
          <Image source={IMAGES.demo3} style={styles.productImage} />
        </View>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.categoryText}>Audio Boards</Text>
        <Text style={styles.productTitle}>
          300W Amplifier Board (5200 & 1943)
        </Text>
        <View style={styles.priceContainer}>
          {/* <Text style={styles.originalPrice}>₹ 1299.00</Text> */}
          <Text style={styles.salePrice}>₹ 1200.00</Text>
        </View>
      </View>
    </View>
  );

  const renderStarRating = () => (
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

  const renderReviewInput = () => (
    <View style={styles.reviewInputContainer}>
      <TextInput
        style={styles.reviewInput}
        placeholder="Give your review"
        placeholderTextColor={COLORS.gray}
        multiline
        numberOfLines={6}
        value={reviewText}
        onChangeText={setReviewText}
        textAlignVertical="top"
      />
    </View>
  );

  const renderPhotoUpload = () => (
    <TouchableOpacity
      style={styles.photoUploadContainer}
      onPress={handleAddPhoto}
    >
      <Text style={styles.addPhotoText}>Add Photo</Text>
    </TouchableOpacity>
  );

  const renderSubmitButton = () => (
    <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReview}>
      <Text style={styles.submitButtonText}>Give Your Review</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SimpleHeader title="Add Review" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {renderProductCard()}
          {renderStarRating()}
          {renderReviewInput()}
          {renderPhotoUpload()}
        </View>
      </ScrollView>
      {renderSubmitButton()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  } as ViewStyle,

  // Header Styles
  headerContainer: {
    backgroundColor: COLORS.lightBackground,
  } as ViewStyle,
  header: {
    backgroundColor: COLORS.lightBackground,
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  backButton: {
    padding: normalize(8),
    marginRight: normalize(8),
  } as ViewStyle,
  backIcon: {
    width: normalize(24),
    height: normalize(24),
    tintColor: COLORS.primary,
  } as ImageStyle,
  headerTitle: {
    fontSize: normalize(16),
    fontFamily: FONTS.regular,
    color: COLORS.primary,
    flex: 1,
    marginLeft: normalize(16),
  } as TextStyle,
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  headerIconButton: {
    padding: normalize(8),
    marginLeft: normalize(8),
  } as ViewStyle,
  searchIconContainer: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  notificationIconContainer: {
    position: 'relative',
  } as ViewStyle,
  headerIcon: {
    width: normalize(24),
    height: normalize(24),
    tintColor: COLORS.shuttleGray,
  } as ImageStyle,
  notificationDot: {
    position: 'absolute',
    top: normalize(-2),
    right: normalize(-2),
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
    backgroundColor: COLORS.notificationRed,
  } as ViewStyle,

  // Content Styles
  scrollView: {
    flex: 1,
  } as ViewStyle,
  content: {
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(16),
  } as ViewStyle,

  // Product Card Styles
  productCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: normalize(8),
    padding: normalize(8),
    flexDirection: 'row',
    marginBottom: normalize(15),
    alignItems: 'center',
  } as ViewStyle,
  productImageContainer: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: normalize(10),
    backgroundColor: COLORS.productBackground,
    marginRight: normalize(10),
    overflow: 'hidden',
  } as ViewStyle,
  productImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.productBackground,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  placeholderText: {
    fontSize: normalize(16),
    fontFamily: FONTS.medium,
    color: COLORS.shuttleGray,
  } as TextStyle,
  productInfo: {
    flex: 1,
    // justifyContent: 'space-between',
  } as ViewStyle,
  categoryText: {
    fontSize: normalize(11),
    fontFamily: FONTS.regular,
    color: COLORS.accent,
    // marginBottom: normalize(2),
  } as TextStyle,
  productTitle: {
    fontSize: normalize(13),
    fontFamily: FONTS.medium,
    color: COLORS.blackText,
    lineHeight: normalize(22),
    // marginBottom: normalize(12),
  } as TextStyle,
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  originalPrice: {
    fontSize: normalize(16),
    fontFamily: FONTS.regular,
    color: COLORS.priceStriked,
    textDecorationLine: 'line-through',
    marginRight: normalize(8),
  } as TextStyle,
  salePrice: {
    fontSize: normalize(12),
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  } as TextStyle,

  // Rating Styles
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalize(6),
    marginBottom: normalize(16),
  } as ViewStyle,
  starButton: {
    padding: normalize(8),
    marginHorizontal: normalize(4),
  } as ViewStyle,
  starIcon: {
    width: normalize(33),
    height: normalize(33),
  } as ImageStyle,

  // Review Input Styles
  reviewInputContainer: {
    marginBottom: normalize(24),
  } as ViewStyle,
  reviewInput: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: normalize(8),
    padding: normalize(12),
    fontSize: normalize(14),
    fontFamily: FONTS.regular,
    color: COLORS.blackText,
    minHeight: normalize(145),
    textAlignVertical: 'top',
  } as TextStyle,

  // Photo Upload Styles
  photoUploadContainer: {
    width: normalize(100),
    height: normalize(100),
    backgroundColor: COLORS.borderGray,
    borderRadius: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(32),
  } as ViewStyle,
  addPhotoText: {
    fontSize: normalize(14),
    fontFamily: FONTS.regular,
    color: COLORS.shuttleGray,
    textAlign: 'center',
  } as TextStyle,

  // Submit Button Styles
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: normalize(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: normalize(0),
  } as ViewStyle,
  submitButtonText: {
    fontSize: normalize(14),
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
    letterSpacing: 0.54,
  } as TextStyle,
});

export default AddReviewScreen;
