import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, ICONS } from '../../utils/constants';
import SimpleHeader from '../../components/common/SimpleHeader';
import normalize from '../../utils/helper/normalize';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface AccordionItemProps {
  item: FAQItem;
  isExpanded: boolean;
  onPress: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  item,
  isExpanded,
  onPress,
}) => {
  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.accordionItem}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.accordionHeader}>
        <View style={styles.accordionLeft}>
          <Text style={styles.accordionQuestion}>{item.question}</Text>
          <View style={styles.orangeIndicator}>
            <Image
              source={isExpanded ? ICONS.minus : ICONS.plus}
              style={{
                width: normalize(14),
                height: normalize(14),
                resizeMode: 'contain',
              }}
            />
          </View>
        </View>
      </View>
      {isExpanded && (
        <View style={styles.accordionContent}>
          <Text style={styles.accordionAnswer}>{item.answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const FAQScreen: React.FC = () => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'Ask Your Question',
      answer:
        'This is a detailed answer to your question. You can expand this section to view the complete response with all the necessary information.',
    },
    {
      id: '2',
      question: 'This is a accordion',
      answer:
        'This accordion component allows you to expand and collapse content sections. It provides an organized way to display information without cluttering the interface.',
    },
    {
      id: '3',
      question: 'Ask Your Question',
      answer:
        'Here you can find answers to frequently asked questions about our services, products, and policies. Feel free to browse through different sections.',
    },
    {
      id: '4',
      question: 'This is a accordion',
      answer:
        'The accordion interface is designed to save space while providing access to detailed information when needed. Simply tap to expand or collapse sections.',
    },
    {
      id: '5',
      question: 'Ask Your Question',
      answer:
        'If you have any additional questions that are not covered in this FAQ section, please feel free to contact our support team for assistance.',
    },
    {
      id: '6',
      question: 'This is a accordion',
      answer:
        'Each accordion item can contain different types of content including text, links, and other relevant information to help answer your questions.',
    },
  ];

  const handleAccordionPress = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Custom Header */}
        <SimpleHeader title="FAQ" />

        {/* Separator Line */}
        <View style={styles.separatorLine} />

        {/* FAQ Content */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {faqData.map((item, index) => (
              <View
                key={item.id}
                style={index > 0 ? styles.itemWithMargin : undefined}
              >
                <AccordionItem
                  item={item}
                  isExpanded={expandedItem === item.id}
                  onPress={() => handleAccordionPress(item.id)}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
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
    padding: 19, // Match Figma spacing
    paddingTop: 32,
  },
  itemWithMargin: {
    marginTop: 14, // Spacing between accordion items
  },
  // Accordion Styles
  accordionItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(165, 165, 165, 0.25)', // #A5A5A5 with 25% opacity
    overflow: 'hidden',
  },
  accordionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 48.93, // Exact height from Figma
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orangeIndicator: {
    width: 25.51,
    height: 25.58,
    backgroundColor: COLORS.accent, // #FF9D33
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // marginRight: 16,
  },
  accordionQuestion: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.charcoal, // #333333
    letterSpacing: 0,
    lineHeight: 16,
    flex: 1,
  },
  accordionContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 4,
  },
  accordionAnswer: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textTertiary,
    lineHeight: 20,
    marginLeft: 41.51, // Align with question text (indicator width + margin)
  },
});

export default FAQScreen;
