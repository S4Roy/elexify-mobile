import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, ICONS, IMAGES } from '../../utils/constants';
import SimpleHeader from '../../components/common/SimpleHeader';
import normalize from '../../utils/helper/normalize';

interface RecentSearchItem {
  id: string;
  text: string;
}

interface CategoryItem {
  id: string;
  name: string;
  image: ImageSourcePropType;
}

const SearchScreen: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([
    { id: '1', text: 'dummy Product name' },
    { id: '2', text: 'dummy Product name' },
    { id: '3', text: 'dummy Product name' },
    { id: '4', text: 'dummy Product name' },
  ]);

  const popularCategories: CategoryItem[] = [
    {
      id: '1',
      name: 'Connectors',
      image: IMAGES.demo,
    },
    {
      id: '2',
      name: 'AVR Boards',
      image: IMAGES.demo2,
    },
    {
      id: '3',
      name: 'Capacitors (Polar)',
      image: IMAGES.demo3,
    },
    {
      id: '4',
      name: 'Amplifier Cabinets',
      image: IMAGES.demo4,
    },
    {
      id: '5',
      name: 'Amplifier Power Supply Boards',
      image: IMAGES.demo5,
    },
    {
      id: '6',
      name: 'Audio Boards',
      image: IMAGES.demo6,
    },
  ];

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      // Add to recent searches if not already present
      const isAlreadyPresent = recentSearches.some(
        item => item.text.toLowerCase() === searchText.toLowerCase(),
      );

      if (!isAlreadyPresent) {
        const newSearch: RecentSearchItem = {
          id: Date.now().toString(),
          text: searchText.trim(),
        };
        setRecentSearches([newSearch, ...recentSearches.slice(0, 3)]);
      }

      // Here you would typically navigate to search results or perform the search
      console.log('Searching for:', searchText);
    }
  };

  const renderRecentSearchItem = ({ item }: { item: RecentSearchItem }) => (
    <TouchableOpacity style={styles.recentSearchItem}>
      <Image source={ICONS.clock} style={styles.clockIcon} />
      <Text style={styles.recentSearchText}>{item.text}</Text>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: CategoryItem }) => (
    <TouchableOpacity style={styles.categoryCard}>
      <View style={styles.categoryImageFrame}>
        <Image source={item.image} style={styles.categoryImage} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SimpleHeader title="Search" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Input Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Image source={ICONS.search} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search here..."
              placeholderTextColor={COLORS.subtleGray}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.filterButton}>
              <Image source={ICONS.settings} style={styles.filterIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Search Section */}
        {recentSearches.length > 0 && (
          <View style={styles.recentSearchSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Search</Text>
              <TouchableOpacity onPress={handleClearRecentSearches}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentSearchList}>
              <FlatList
                data={recentSearches}
                renderItem={renderRecentSearchItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            </View>
          </View>
        )}

        {/* Popular Categories Section */}
        <View style={styles.popularCategoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Categories</Text>
            <TouchableOpacity>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            <FlatList
              horizontal
              data={popularCategories}
              renderItem={renderCategoryItem}
              keyExtractor={item => item.id}

              // numColumns={3}
              // scrollEnabled={false}
              // columnWrapperStyle={styles.categoryRow}
            />
          </View>
        </View>
      </ScrollView>
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
  },

  // Search Input Section
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    height: 55,
    paddingHorizontal: 18,
  },
  searchIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginRight: 18,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 21,
  },
  filterButton: {
    padding: 4,
  },
  filterIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 31,
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    fontWeight: '600',
    color: '#180000',
    lineHeight: 20,
  },
  clearAllText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.error,
    lineHeight: 20,
  },

  // Recent Search Section
  recentSearchSection: {
    paddingHorizontal: 23,
    marginBottom: 48,
  },
  recentSearchList: {
    // No additional styling needed
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  clockIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 28,
  },
  recentSearchText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: '400',
    color: '#403F4F',
    lineHeight: 20,
  },

  // Popular Categories Section
  popularCategoriesSection: {
    paddingHorizontal: 23,
    paddingBottom: 40,
  },
  categoriesGrid: {
    // No additional styling needed
  },
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  categoryCard: {
    width: 129.44,
    height: 158.39,
    backgroundColor: COLORS.white,
    borderRadius: 10.22,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    borderStyle: 'solid',
    // opacity: 0.5,
    alignItems: 'center',
    paddingTop: 8.5,
    paddingBottom: 8.5,
    marginRight: normalize(10),
  },
  categoryImageFrame: {
    width: 112.4,
    height: 112.4,
    backgroundColor: '#F9F9F9',
    borderRadius: 10.22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryImage: {
    width: 97.08,
    height: 97.08,
  },
  categoryName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16.1,
    fontWeight: '500',
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 22.54,
    paddingHorizontal: 8,
    flexShrink: 1,
  },
});

export default SearchScreen;
