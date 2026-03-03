// App configuration constants

interface AppConstants {
  readonly TOKEN: string;
  readonly BASE_URL: string;
}

export const constants: AppConstants = {
  TOKEN: 'TOKEN',
  BASE_URL: 'https://api.elexify.online/api/',
  // BASE_URL: 'https://api.elexify.com',
} as const;

// Colors extracted from Figma design
export const COLORS = {
  // Primary brand colors
  primary: '#00796A', // Blaze Orange
  primaryLight: 'rgba(0, 121, 106, 0.3)', // Blaze Orange
  primaryDark: '#F79E1B', // Tree Poppy
  secondary: '#006FCF', // Science Blue
  secondaryDark: '#142688', // Deep Koamaru

  // Semantic colors
  success: '#34A853', // Chateau Green
  warning: '#FBBC04', // Blaze Orange (same as primary)
  error: '#EB001B', // Red
  info: '#4285F4', // Cornflower Blue

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  codGray: '#1C1C1C',
  shuttleGray: '#5F6368',
  waterloo: '#808191',
  alto: '#D9D9D9',
  whiteLinen: '#F8F2EA',

  // Additional gray variants
  gray: '#5F6368', // Using shuttleGray as the main gray
  lightGray: '#D9D9D9', // Using alto as light gray
  darkGray: '#1C1C1C', // Using codGray as dark gray
  mediumGray: '#959595', // Medium gray for borders and placeholders
  lightestGray: '#E5E5E5', // Very light gray for backgrounds
  placeholderGray: '#989898', // Placeholder text color
  subtleGray: '#666666', // Subtle text color
  mutedGray: '#7C7C7C', // Muted text color
  charcoal: '#333333', // Charcoal color for text

  // Additional UI colors
  accent: '#FF9D33', // Orange accent color
  backgroundTertiary: '#FAFAFA', // Very light background
  accentLight: '#97DFEC', // Light blue accent
  headerBlue: '#007AFF', // Header background blue
  red: '#FF3B30', // Red color for errors

  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8F2EA',
  surface: '#F8F2EA',

  // Text colors
  textPrimary: '#000000',
  textSecondary: '#1C1C1C',
  textTertiary: '#5F6368',
  placeholder: '#808191',

  // Border colors
  border: '#D9D9D9',
  borderLight: '#D4CEC6',

  // Additional colors from design
  lightBackground: '#EEFFFD', // Light mint background
  flashSaleBg: '#FFB039', // Flash sale background with opacity
  productBackground: '#F2F2F2', // Product placeholder background
  borderGray: '#E6E8EC', // Product card border
  priceStriked: '#828282', // Striked price color
  yellowAccent: '#FBFF2E', // Yellow accent color
  pinkAccent: '#E76AAD', // Pink accent color
  lightMint: '#C7E2EE', // Light mint color
  blackText: '#212121', // Black text color
  notificationRed: '#F80036', // Notification red color
  lightGreen: '#F0F0F0', // Light green divider
};

export const FONTS = {
  // Font Sizes
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  light: 'Poppins-Light',
  thin: 'Poppins-Thin',
  extraBold: 'Poppins-ExtraBold',
  black: 'Poppins-Black',
};

export const ICONS = {
  // Navigation icons
  home: require('../../assets/icons/home.png'),
  category: require('../../assets/icons/category.png'),
  brands: require('../../assets/icons/brands.png'),
  account: require('../../assets/icons/account.png'),

  // Active navigation icons
  inhome: require('../../assets/icons/inhome.png'),
  incategory: require('../../assets/icons/incategory.png'),
  inbrands: require('../../assets/icons/inbrands.png'),
  inaccount: require('../../assets/icons/inaccount.png'),

  // Action icons
  search: require('../../assets/icons/search.png'),
  cart: require('../../assets/icons/cart.png'),
  shoppingcart: require('../../assets/icons/shoppingcart.png'),
  bag: require('../../assets/icons/bag.png'),
  back: require('../../assets/icons/back.png'),
  notification: require('../../assets/icons/notification.png'),

  // Arrow icons
  arrowdown: require('../../assets/icons/arrowdown.png'),
  arrownext: require('../../assets/icons/arrownext.png'),

  // User interaction icons
  heart: require('../../assets/icons/heart.png'),
  love: require('../../assets/icons/love.png'),
  eye: require('../../assets/icons/eye.png'),
  camera: require('../../assets/icons/camera.png'),
  plus: require('../../assets/icons/plus.png'),

  // Status and feedback icons
  check: require('../../assets/icons/check.png'),
  star: require('../../assets/icons/star.png'),
  fire: require('../../assets/icons/fire.png'),

  // Utility icons
  location: require('../../assets/icons/location.png'),
  clock: require('../../assets/icons/clock.png'),
  settings: require('../../assets/icons/settings.png'),
  bin: require('../../assets/icons/bin.png'),
  cancel: require('../../assets/icons/cancel.png'),

  // Commerce icons
  offer: require('../../assets/icons/offer.png'),
  sale: require('../../assets/icons/sale.png'),
  money: require('../../assets/icons/money.png'),

  // Communication icons
  comment: require('../../assets/icons/comment.png'),
  reply: require('../../assets/icons/reply.png'),
  faq: require('../../assets/icons/faq.png'),

  // Order and delivery icons
  box: require('../../assets/icons/box.png'),
  delivered: require('../../assets/icons/delivered.png'),
  track: require('../../assets/icons/track.png'),
  update: require('../../assets/icons/update.png'),

  // Special icons
  solidhome: require('../../assets/icons/solidhome.png'),
  logout: require('../../assets/icons/logout.png'),
  remove: require('../../assets/icons/remove.png'),
  support: require('../../assets/icons/support.png'),
  openeye: require('../../assets/icons/openeye.png'),
  add: require('../../assets/icons/add.png'),
  minus: require('../../assets/icons/minus.png'),
  card: require('../../assets/icons/card.png'),
};

export const IMAGES = {
  // Logo and branding
  logo: require('../../assets/images/Logo.png'),
  logoSmall: require('../../assets/images/LogoSmall.png'),

  // Banners and promotional
  banner: require('../../assets/images/Banner.png'),

  // Demo and placeholder images
  demo: require('../../assets/images/demo.png'),
  demo2: require('../../assets/images/demo2.png'),
  demo3: require('../../assets/images/demo3.png'),
  demo4: require('../../assets/images/demo4.png'),
  demo5: require('../../assets/images/demo5.png'),
  demo6: require('../../assets/images/demo6.png'),
  userdemo: require('../../assets/images/userdemo.png'),

  // Miscellaneous
  flag: require('../../assets/images/flag.png'),
};

export const SCREEN_NAMES = {
  // Auth
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  OTP: 'OTP',

  // Home
  HOME: 'Home',
  CATEGORY: 'Category',
  BRANDS: 'Brands',
  SEARCH: 'Search',

  // Products
  PRODUCT_LIST: 'ProductList',
  PRODUCT_DETAILS: 'ProductDetails',
  FILTER: 'Filter',
  ADD_REVIEW: 'AddReview',

  // Cart
  CART: 'Cart',
  CHECKOUT: 'Checkout',

  // Account
  MY_ACCOUNT: 'MyAccount',
  MANAGE_ADDRESS: 'ManageAddress',
  ADD_ADDRESS: 'AddAddress',
  WISHLIST: 'Wishlist',
  RECENTLY_VIEWED: 'RecentlyViewed',
  NOTIFICATION: 'Notification',
  MANAGE_APP: 'ManageApp',
  FAQ: 'FAQ',
  DETAILS: 'Details',

  // Orders
  ONGOING_ORDER: 'OngoingOrder',
  COMPLETED_ORDER: 'CompletedOrder',
  ORDER_DETAILS: 'OrderDetails',
  CANCEL_ORDER: 'CancelOrder',
  TRACK_ORDER: 'TrackOrder',
};
