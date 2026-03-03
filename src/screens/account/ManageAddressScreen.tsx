import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, ICONS } from '../../utils/constants';
import SimpleHeader from '../../components/common/SimpleHeader';
import { navigate } from '../../utils/helper/RootNavigation';
import normalize from '../../utils/helper/normalize';

interface Address {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  name: string;
  address: string;
  landmark?: string;
  pincode: string;
  city: string;
  state: string;
  isDefault: boolean;
}

const ManageAddressScreen: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      type: 'Home',
      name: 'John Doe',
      address: '123 Chamac Street, Kolkata',
      landmark: 'Near City Mall',
      pincode: '700001',
      city: 'Kolkata',
      state: 'West Bengal',
      isDefault: true,
    },
    {
      id: '2',
      type: 'Work',
      name: 'John Doe',
      address: '456 Business District, Salt Lake',
      landmark: 'Opposite Metro Station',
      pincode: '700091',
      city: 'Kolkata',
      state: 'West Bengal',
      isDefault: false,
    },
  ]);

  const handleSetDefault = (addressId: string) => {
    setAddresses(prev =>
      prev.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId,
      })),
    );
  };

  const handleEditAddress = (addressId: string) => {
    // Navigate to edit address screen
    console.log('Edit address:', addressId);
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAddresses(prev => prev.filter(addr => addr.id !== addressId));
          },
        },
      ],
    );
  };

  const handleAddNewAddress = () => {
    // Navigate to add address screen
    console.log('Add new address');
    navigate('AddAddressScreen');
  };

  const renderAddressCard = (address: Address) => (
    <View key={address.id} style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressTypeContainer}>
          <Image
            source={address.type === 'Home' ? ICONS.solidhome : ICONS.location}
            style={styles.addressTypeIcon}
          />
          <Text style={styles.addressType}>{address.type}</Text>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <View style={styles.addressActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditAddress(address.id)}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteAddress(address.id)}
          >
            <Image source={ICONS.bin} style={styles.deleteIcon} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.addressContent}>
        <Text style={styles.addressName}>{address.name}</Text>
        <Text style={styles.addressText}>
          {address.address}, {address.city}, {address.state} - {address.pincode}
        </Text>
        {address.landmark && (
          <Text style={styles.landmarkText}>Landmark: {address.landmark}</Text>
        )}
      </View>

      {!address.isDefault && (
        <TouchableOpacity
          style={styles.setDefaultButton}
          onPress={() => handleSetDefault(address.id)}
        >
          <Text style={styles.setDefaultText}>Set as Default</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SimpleHeader title="Address" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* <Text style={styles.pageTitle}>Saved Addresses</Text> */}

          {/* Address List */}
          <View style={styles.addressList}>
            {addresses.map(renderAddressCard)}
          </View>
        </View>
      </ScrollView>

      {/* <View style={styles.buttonContainer}> */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigate('AddAddressScreen')}
      >
        <Text style={styles.cancelButtonText}>Add New Address</Text>
      </TouchableOpacity>
      {/* </View> */}
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
  content: {
    padding: 19,
  },
  pageTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: '#180000',
    lineHeight: 20,
    marginBottom: 24,
  },

  // Address List
  addressList: {
    marginBottom: 24,
  },
  addressCard: {
    backgroundColor: COLORS.lightBackground,
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressTypeIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    marginRight: 8,
  },
  addressType: {
    fontFamily: FONTS.medium,
    fontSize: 14,

    color: '#262626',
    lineHeight: 21,
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultText: {
    fontFamily: FONTS.medium,
    fontSize: 10,

    color: COLORS.white,
    lineHeight: 15,
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 16,
  },
  editText: {
    fontFamily: FONTS.medium,
    fontSize: 14,

    color: COLORS.primary,
    lineHeight: 21,
  },
  deleteIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  // Address Content
  addressContent: {
    marginBottom: 16,
  },
  addressName: {
    fontFamily: FONTS.medium,
    fontSize: 16,

    color: '#180000',
    lineHeight: 24,
    marginBottom: 4,
  },
  addressText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.charcoal,
    lineHeight: 21,
    marginBottom: 4,
  },
  landmarkText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.subtleGray,
    lineHeight: 21,
  },

  // Set Default Button
  setDefaultButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  setDefaultText: {
    fontFamily: FONTS.medium,
    fontSize: 12,

    color: COLORS.primary,
    lineHeight: 18,
  },

  // Add Address Button
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  addIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 8,
    tintColor: COLORS.white,
  },
  addAddressText: {
    fontFamily: FONTS.medium,
    fontSize: 16,

    color: COLORS.white,
    lineHeight: 24,
  },

  buttonContainer: {
    backgroundColor: COLORS.white,
    height: normalize(45),
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  cancelButton: {
    backgroundColor: COLORS.primary,
    height: normalize(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: normalize(13.5),
    color: COLORS.white,
    letterSpacing: 0.54,
    lineHeight: 30,
  },
});

export default ManageAddressScreen;
