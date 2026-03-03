import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  FlatList,
  Dimensions,
  ImageStyle,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, ICONS, IMAGES } from '../../utils/constants';
import SimpleHeader from '../../components/common/SimpleHeader';
import { navigate, goBack } from '../../utils/helper/RootNavigation';
import normalize from '../../utils/helper/normalize';
import ProductCard from '../../components/common/ProductCard';

const { width } = Dimensions.get('window');

interface ProductDetailsScreenProps {
  navigation?: any;
  route?: any;
}

interface ColorOption {
  name: string;
  selected: boolean;
}

interface SizeOption {
  name: string;
  selected: boolean;
}

interface RelatedProduct {
  id: number;
  category: string;
  title: string;
  originalPrice: string;
  salePrice: string;
  image: any;
}

interface SocialMedia {
  name: string;
  color: string;
  icon: string;
}

const ProductDetailsScreen: React.FC<ProductDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const [selectedColor, setSelectedColor] = useState('Black');
  const [selectedSize, setSelectedSize] = useState('L');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDescription, setShowDescription] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const productImages = [IMAGES.demo, IMAGES.demo4, IMAGES.demo3];

  const colorOptions: ColorOption[] = [
    { name: 'Black', selected: true },
    { name: 'Gray', selected: false },
    { name: 'White', selected: false },
    { name: 'Red', selected: false },
  ];

  const sizeOptions: SizeOption[] = [
    { name: 'L', selected: true },
    { name: 'XL', selected: false },
  ];

  const relatedProducts: RelatedProduct[] = [
    {
      id: 1,
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹1299.00',
      salePrice: '₹1200.00',
      image: IMAGES.demo,
    },
    {
      id: 2,
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹1299.00',
      salePrice: '₹1200.00',
      image: IMAGES.demo2,
    },
    {
      id: 3,
      category: 'Audio Boards',
      title: '300W Amplifier Board (5200 & 1943)',
      originalPrice: '₹1299.00',
      salePrice: '₹1200.00',
      image: IMAGES.demo3,
    },
  ];

  const socialMediaIcons: SocialMedia[] = [
    { name: 'F', color: '#1877f2', icon: 'facebook' },
    { name: 'T', color: '#1d9bf0', icon: 'twitter' },
    { name: 'W', color: '#5bd366', icon: 'whatsapp' },
    { name: 'I', color: '#C837AB', icon: 'instagram' },
  ];

  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      setQuantity(quantity + 1);
    } else {
      setQuantity(Math.max(1, quantity - 1));
    }
  };

  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName);
  };

  const handleSizeSelect = (sizeName: string) => {
    setSelectedSize(sizeName);
  };

  const handleBuyNow = () => {
    navigate('CheckoutScreen');
  };

  const handleAddToCart = () => {
    // Add to cart logic
    console.log('Added to cart');
  };

  const renderProductImages = () => (
    <View style={styles.imageSection}>
      <View style={styles.mainImageContainer}>
        <Image
          source={productImages[currentImageIndex]}
          style={styles.mainImage}
          resizeMode="cover"
        />
        <View style={styles.saleTag}>
          <Image source={ICONS.sale} style={styles.saleIcon} />
          <Text style={styles.saleText}>SALE</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.thumbnailContainer}
        contentContainerStyle={styles.thumbnailContent}
      >
        {productImages.map((image, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.thumbnail,
              currentImageIndex === index && styles.activeThumbnail,
            ]}
            onPress={() => setCurrentImageIndex(index)}
          >
            <Image
              source={image}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderProductInfo = () => (
    <View style={styles.contentSection}>
      <View style={styles.titleSection}>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>Amplifier Cabinets</Text>
        </View>
        <Text style={styles.productTitle}>12V DC Cooling Fan 80mm (3″)</Text>

        <View style={styles.ratingSection}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(star => (
              <Image key={star} source={ICONS.star} style={styles.starIcon} />
            ))}
          </View>
          <Text style={styles.ratingText}>(4.7) - 390 Product Sold</Text>
        </View>

        <Text style={styles.skuText}>SKU: ELX-0126</Text>
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.priceContainer}>
          <Text style={styles.originalPrice}>₹199.00 </Text>
          <Text style={styles.salePrice}>₹79.00</Text>
        </Text>

        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={() => setIsWishlisted(!isWishlisted)}
        >
          <Image
            source={isWishlisted ? ICONS.love : ICONS.heart}
            style={styles.heartIcon}
          />
          <Text style={styles.wishlistText}>Add to Wishlist</Text>
        </TouchableOpacity>

        <Text style={styles.shippingText}>
          Shipping calculated at checkout.
        </Text>
        <Text style={styles.deliveryText}>Estimated delivery: 3 days</Text>
      </View>
    </View>
  );

  const renderOptions = () => (
    <View style={styles.optionsSection}>
      {/* Color Selection */}
      <View style={styles.optionGroup}>
        <Text style={styles.optionLabel}>Choose Color</Text>
        <View style={styles.optionButtons}>
          {colorOptions.map(color => (
            <TouchableOpacity
              key={color.name}
              style={[
                styles.optionButton,
                selectedColor === color.name && styles.selectedOption,
              ]}
              onPress={() => handleColorSelect(color.name)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  selectedColor === color.name && styles.selectedOptionText,
                ]}
              >
                {color.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Size Selection */}
      <View style={styles.optionGroup}>
        <Text style={styles.optionLabel}>Size</Text>
        <View style={styles.optionButtons}>
          {sizeOptions.map(size => (
            <TouchableOpacity
              key={size.name}
              style={[
                styles.optionButton,
                selectedSize === size.name && styles.selectedOption,
              ]}
              onPress={() => handleSizeSelect(size.name)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  selectedSize === size.name && styles.selectedOptionText,
                ]}
              >
                {size.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quantity Selection */}
      <View style={styles.optionGroup}>
        <Text style={styles.optionLabel}>Quantity</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(false)}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(true)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity style={styles.buyNowButton} onPress={handleBuyNow}>
        <Text style={styles.buyNowText}>Buy Now</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={handleAddToCart}
      >
        <Image source={ICONS.cart} style={styles.cartIcon} />
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStoreInfo = () => (
    <View style={styles.storeSection}>
      <View style={styles.divider} />
      <View style={styles.storeInfo}>
        <View style={styles.storeFeature}>
          <Image source={ICONS.check} style={styles.featureIcon} />
          <Text style={styles.featureText}>Original store product</Text>
        </View>
        <View style={styles.storeFeature}>
          <Image source={ICONS.check} style={styles.featureIcon} />
          <Text style={styles.featureText}>100% trusted shop</Text>
        </View>
        <View style={styles.storeFeature}>
          <Image source={ICONS.check} style={styles.featureIcon} />
          <Text style={styles.featureText}>Long term warranty</Text>
        </View>
        <View style={styles.storeFeature}>
          <Image source={ICONS.check} style={styles.featureIcon} />
          <Text style={styles.featureText}>Monthly installment</Text>
        </View>
      </View>

      <View style={styles.shareSection}>
        <Text style={styles.shareText}>Share</Text>
        <View style={styles.socialIcons}>
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: 'blue' }]}
          >
            <Text style={styles.socialText}>i</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPromotion = () => (
    <View style={styles.promotionSection}>
      <Text style={styles.promotionTitle}>🔥 Buy More Save More!</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.promoCard}>
          <Text style={styles.promoText}>
            Buy from 3 to 5 items and{'\n'}get 5% OFF
          </Text>
          <Text style={styles.promoSubtext}>On each product</Text>
        </View>
        <View style={[styles.promoCard, styles.promoCardInactive]}>
          <Text style={styles.promoText}>
            Buy from 6 to 10 items and{'\n'}get 10% OFF
          </Text>
          <Text style={styles.promoSubtext}>On each product</Text>
        </View>
      </ScrollView>
    </View>
  );

  const renderDescriptionTabs = () => (
    <View style={styles.tabSection}>
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tab, showDescription && styles.activeTab]}
          onPress={() => setShowDescription(true)}
        >
          <Text
            style={[styles.tabText, showDescription && styles.activeTabText]}
          >
            Description
          </Text>
          {showDescription && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, !showDescription && styles.activeTab]}
          onPress={() => setShowDescription(false)}
        >
          <Text
            style={[styles.tabText, !showDescription && styles.activeTabText]}
          >
            Specifications
          </Text>
          {!showDescription && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      <View style={styles.tabContent}>
        <Text style={styles.descriptionText}>
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry's standard dummy text ever
          since the 1500s
        </Text>
        <View style={styles.fadeOverlay} />
        <TouchableOpacity style={styles.readMoreButton}>
          <Text style={styles.readMoreText}>Read More</Text>
          <Image source={ICONS.arrowdown} style={styles.arrowIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReviews = () => (
    <View style={styles.reviewsSection}>
      <Text style={styles.reviewsTitle}>Reviews</Text>

      <View style={styles.reviewSummary}>
        <View style={styles.ratingOverview}>
          <Text
            style={{
              ...styles.overallRating,
              fontSize: normalize(30),
              marginBottom: normalize(0),
            }}
          >
            4.5
          </Text>
          <View style={{ ...styles.ratingStars, marginBottom: normalize(0) }}>
            {[1, 2, 3, 4, 5].map(star => (
              <Image key={star} source={ICONS.star} style={styles.starIcon} />
            ))}
          </View>
          <Text style={styles.reviewCount}>345 Reviews</Text>
        </View>
        <View style={styles.separatorLineVertical} />

        <View style={styles.ratingBars}>
          {[5, 4, 3, 2, 1].map((rating, index) => (
            <View key={rating} style={styles.ratingBar}>
              <Text style={styles.ratingNumber}>{rating}</Text>
              <Image source={ICONS.star} style={styles.smallStar} />
              <View style={styles.progressBar}>
                <View style={styles.progressBackground} />
                <View
                  style={[
                    styles.progressFill,
                    { width: `${[83, 73, 34, 13, 5][index]}%` },
                  ]}
                />
              </View>
              <Text style={styles.ratingCount}>
                {[300, 94, 30, 10, 1][index]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>RE</Text>
          </View>
          <View style={styles.reviewInfo}>
            <Text style={styles.userName}>Ralph Edwards</Text>
            <View style={styles.reviewStars}>
              {[1, 2, 3, 4, 5].map(star => (
                <Image
                  key={star}
                  source={ICONS.star}
                  style={styles.smallStar}
                />
              ))}
            </View>
          </View>
          <Text style={styles.reviewDate}>August 20, 2025</Text>
        </View>
        <Text style={styles.reviewText}>
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry's standard dummy text ever
          since the 1500s, when an unknown printer took a galley of type and
          scrambled it to make a type specimen book.
        </Text>
        <View style={styles.reviewActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Image source={ICONS.heart} style={styles.actionIcon} />
            <Text style={styles.actionText}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Image source={ICONS.reply} style={styles.actionIcon} />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.postReviewButton}
        onPress={() => navigate('AddReviewScreen')}
      >
        <Text style={styles.postReviewText}>Post your review</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRelatedProducts = () => (
    <View style={styles.relatedSection}>
      <Text style={styles.relatedTitle}>Related Products</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {relatedProducts.map(product => (
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

  return (
    <SafeAreaView style={styles.container}>
      <SimpleHeader title="Details" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderProductImages()}
        {renderProductInfo()}
        {renderOptions()}
        {renderActionButtons()}
        {renderStoreInfo()}
        {renderPromotion()}
        {renderDescriptionTabs()}
        {renderReviews()}
        {renderRelatedProducts()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  separatorLineVertical: {
    height: '100%',
    width: normalize(1),
    backgroundColor: COLORS.border,
    marginHorizontal: normalize(10),
  },
  headerContainer: {
    backgroundColor: COLORS.lightBackground,
  },
  customHeader: {
    backgroundColor: COLORS.lightBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.primary,
  } as ImageStyle,
  headerTitle: {
    // ...TYPOGRAPHY.h6,
    color: COLORS.primary,
    fontFamily: FONTS.regular,
    fontSize: 16,
  } as TextStyle,
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: 8,
    marginLeft: 8,
    position: 'relative',
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIconContainer: {
    position: 'relative',
  },
  headerIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.shuttleGray,
  } as ImageStyle,
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.notificationRed,
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  mainImageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainImage: {
    width: width - 32,
    height: 300,
    borderRadius: 8,
    backgroundColor: COLORS.productBackground,
  } as ImageStyle,
  saleTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  saleIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.white,
    marginRight: 4,
  } as ImageStyle,
  saleText: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.white,
  },
  thumbnailContainer: {
    marginBottom: 16,
  },
  thumbnailContent: {
    paddingRight: 16,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: COLORS.productBackground,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: COLORS.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  } as ImageStyle,
  contentSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  titleSection: {
    marginBottom: 16,
  },
  categoryTag: {
    backgroundColor: 'rgba(82, 5, 123, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.primary,
  },
  productTitle: {
    fontSize: normalize(19),
    fontFamily: FONTS.semiBold,
    color: COLORS.blackText,
    // marginBottom: normalize(8),
    // lineHeight: 32,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stars: {
    flexDirection: 'row',
    marginRight: normalize(5),
  },
  starIcon: {
    width: normalize(11),
    height: normalize(11),
    tintColor: '#FFD700',
    marginRight: normalize(5),
  } as ImageStyle,
  ratingText: {
    fontSize: normalize(12),
    fontFamily: FONTS.regular,
    color: COLORS.shuttleGray,
  },
  skuText: {
    fontSize: normalize(12),
    fontFamily: FONTS.regular,
    color: COLORS.shuttleGray,
  },
  priceSection: {
    marginBottom: 16,
  },
  priceContainer: {
    fontSize: normalize(19),
    fontFamily: FONTS.semiBold,
    marginBottom: 16,
  },
  originalPrice: {
    color: COLORS.priceStriked,
    textDecorationLine: 'line-through',
  },
  salePrice: {
    color: COLORS.blackText,
  },
  wishlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heartIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.shuttleGray,
    marginRight: 16,
  } as ImageStyle,
  wishlistText: {
    fontSize: normalize(12),
    fontFamily: FONTS.medium,
    color: COLORS.shuttleGray,
  },
  shippingText: {
    fontSize: normalize(12),
    fontFamily: FONTS.regular,
    color: COLORS.shuttleGray,
    marginBottom: 16,
  },
  deliveryText: {
    fontSize: normalize(12),
    fontFamily: FONTS.regular,
    color: COLORS.shuttleGray,
  },
  optionsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  optionGroup: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGray,
    paddingBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    // justifyContent: 'space-between',
  },
  optionLabel: {
    fontSize: normalize(14),
    fontFamily: FONTS.regular,
    color: COLORS.shuttleGray,
    marginBottom: 16,
    marginRight: normalize(12),
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: normalize(3),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(3),
  },
  selectedOption: {
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.shuttleGray,
  },
  selectedOptionText: {
    color: COLORS.blackText,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  quantityButton: {
    backgroundColor: COLORS.alto,
    width: normalize(24),
    height: normalize(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: normalize(16),
    fontFamily: FONTS.regular,
    color: COLORS.blackText,
  },
  quantityText: {
    fontSize: normalize(16),
    fontFamily: FONTS.regular,
    color: COLORS.blackText,
    paddingHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  buyNowButton: {
    width: '48%',
    backgroundColor: COLORS.primary,
    borderRadius: normalize(6),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(8),
  },
  buyNowText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.white,
  },
  addToCartButton: {
    // flex: 1,
    width: '48%',
    borderRadius: normalize(6),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.blackText,
    paddingVertical: normalize(8),
    flexDirection: 'row',
  },
  cartIcon: {
    width: normalize(20),
    height: normalize(20),
    tintColor: COLORS.blackText,
    marginRight: normalize(8),
  } as ImageStyle,
  addToCartText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.blackText,
  },
  storeSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderGray,
    marginBottom: 16,
  },
  storeInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  storeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  featureIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.primary,
    marginRight: 16,
  } as ImageStyle,
  featureText: {
    fontSize: normalize(10),
    fontFamily: FONTS.regular,
    color: COLORS.blackText,
  },
  shareSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  shareText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.blackText,
    marginRight: 16,
  },
  socialIcons: {
    flexDirection: 'row',
  },
  socialButton: {
    width: 16,
    height: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  socialText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.white,
  },
  promotionSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  promotionTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.blackText,
    marginBottom: 16,
  },
  promoCard: {
    width: normalize(200),
    height: normalize(85),
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    backgroundColor: COLORS.white,
  },
  promoCardInactive: {
    borderColor: COLORS.borderGray,
  },
  promoText: {
    fontSize: normalize(12),
    fontFamily: FONTS.medium,
    color: COLORS.blackText,
    marginBottom: normalize(6),
  },
  promoSubtext: {
    fontSize: normalize(10),
    fontFamily: FONTS.regular,
    color: COLORS.shuttleGray,
  },
  tabSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tabHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGreen,
  },
  tab: {
    marginRight: 16,
    paddingBottom: 16,
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.shuttleGray,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.primary,
  },
  tabContent: {
    position: 'relative',
  },
  descriptionText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#666666',
    // lineHeight: 16,
    marginBottom: 16,
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    height: 16,
    backgroundColor: 'rgba(248, 248, 248, 0.8)',
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  readMoreText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    marginRight: 16,
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.primary,
  } as ImageStyle,
  reviewsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  reviewsTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.blackText,
    marginBottom: 16,
  },
  reviewSummary: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  ratingOverview: {
    // alignItems: 'center',
    // marginRight: 16,
    justifyContent: 'center',
  },
  overallRating: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
    marginBottom: 16,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  reviewCount: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.blackText,
  },
  ratingBars: {
    flex: 1,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(8),
  },
  ratingNumber: {
    fontSize: normalize(10),
    fontFamily: FONTS.semiBold,
    color: COLORS.waterloo,
    // width: 16,
    marginRight: normalize(4),
  },
  smallStar: {
    width: normalize(12),
    height: normalize(12),
    tintColor: '#FFD700',
    marginRight: normalize(4),
  } as ImageStyle,
  progressBar: {
    width: '55%',
    height: normalize(8),
    borderRadius: 16,
    position: 'relative',
    marginRight: 16,
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#c1c1c1',
    borderRadius: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#479622',
    borderRadius: 16,
  },
  ratingCount: {
    fontSize: normalize(12),
    fontFamily: FONTS.regular,
    color: COLORS.waterloo,
    // width: 16,
    textAlign: 'right',
  },
  postReviewButton: {
    backgroundColor: 'rgba(0, 121, 106, 0.09)',
    borderRadius: 16,
    paddingVertical: normalize(12),
    alignItems: 'center',
    marginBottom: 16,
  },
  postReviewText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: 100,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(8),
  },
  avatarText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.blackText,
  },
  reviewInfo: {
    flex: 1,
  },
  userName: {
    fontSize: normalize(12),
    fontFamily: FONTS.medium,
    color: COLORS.blackText,
    // marginBottom: 16,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: normalize(12),
    fontFamily: FONTS.medium,
    color: '#858585',
  },
  reviewText: {
    fontSize: normalize(12),
    fontFamily: FONTS.regular,
    color: '#666666',
    // lineHeight: 16,
    marginBottom: 16,
  },
  reviewActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // borderWidth: 1,
    // borderColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginRight: 16,
  },
  actionIcon: {
    width: normalize(18),
    height: normalize(18),
    tintColor: COLORS.primary,
    marginRight: normalize(8),
  } as ImageStyle,
  actionText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  relatedSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  relatedTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.blackText,
    marginBottom: 16,
  },
  relatedProductCard: {
    width: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
  },
  relatedImageContainer: {
    position: 'relative',
    backgroundColor: COLORS.productBackground,
    height: 16,
  },
  relatedProductImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  relatedWishlistButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 16,
  },
  wishlistIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.shuttleGray,
  } as ImageStyle,
  relatedProductInfo: {
    padding: 16,
  },
  relatedCategory: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.accent,
    marginBottom: 16,
  },
  relatedProductTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.blackText,
    marginBottom: 16,
    // lineHeight: 16,
  },
  relatedPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  relatedOriginalPrice: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.priceStriked,
    textDecorationLine: 'line-through',
    marginRight: 16,
  },
  relatedSalePrice: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
});

export default ProductDetailsScreen;
