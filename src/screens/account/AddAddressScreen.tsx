import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, ICONS } from '../../utils/constants';
import SimpleHeader from '../../components/common/SimpleHeader';
import normalize from '../../utils/helper/normalize';
import { navigate } from '../../utils/helper/RootNavigation';

interface FormData {
  contactType: 'myself' | 'other';
  addressType: string;
  address: string;
  landmark: string;
  state: string;
  city: string;
  zipCode: string;
  isDefault: boolean;
}

const AddAddressScreen: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    contactType: 'myself',
    addressType: '',
    address: '',
    landmark: '',
    state: '',
    city: '',
    zipCode: '',
    isDefault: false,
  });

  const [showAddressTypeDropdown, setShowAddressTypeDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const addressTypes = ['Home', 'Office', 'Other'];
  const states = [
    'West Bengal',
    'Delhi',
    'Maharashtra',
    'Karnataka',
    'Tamil Nadu',
  ];
  const cities = ['Kolkata', 'Delhi', 'Mumbai', 'Bangalore', 'Chennai'];

  const handleContactTypeChange = (type: 'myself' | 'other') => {
    setFormData({ ...formData, contactType: type });
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean,
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    if (
      !formData.address ||
      !formData.state ||
      !formData.city ||
      !formData.zipCode
    ) {
      console.log('Please fill all required fields');
      return;
    }
    console.log('Form submitted:', formData);
  };

  const renderRadioButton = (
    value: 'myself' | 'other',
    label: string,
    isSelected: boolean,
  ) => (
    <TouchableOpacity
      style={styles.radioContainer}
      onPress={() => handleContactTypeChange(value)}
    >
      <View style={styles.radioButton}>
        <View
          style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}
        >
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderDropdown = (
    label: string,
    value: string,
    placeholder: string,
    options: string[],
    isOpen: boolean,
    onToggle: () => void,
    onSelect: (option: string) => void,
    isRequired: boolean = false,
  ) => (
    <View style={styles.inputGroup}>
      <View style={styles.labelContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        {isRequired && <Text style={styles.required}>*</Text>}
      </View>
      <TouchableOpacity style={styles.dropdownContainer} onPress={onToggle}>
        <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Image source={ICONS.arrowdown} style={styles.dropdownIcon} />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdownOptions}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.dropdownOption}
              onPress={() => {
                onSelect(option);
                onToggle();
              }}
            >
              <Text style={styles.dropdownOptionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderTextInput = (
    label: string,
    value: string,
    placeholder: string,
    onChangeText: (text: string) => void,
    isRequired: boolean = false,
  ) => (
    <View style={styles.inputGroup}>
      <View style={styles.labelContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        {isRequired && <Text style={styles.required}>*</Text>}
      </View>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholderGray}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SimpleHeader title="Add Address" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.radioGroup}>
              {renderRadioButton(
                'myself',
                'My self',
                formData.contactType === 'myself',
              )}
              {renderRadioButton(
                'other',
                'Other',
                formData.contactType === 'other',
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>

            {renderDropdown(
              'Address Type',
              formData.addressType,
              'Home/Office/Other',
              addressTypes,
              showAddressTypeDropdown,
              () => setShowAddressTypeDropdown(!showAddressTypeDropdown),
              option => handleInputChange('addressType', option),
            )}

            {renderTextInput(
              'Address',
              formData.address,
              'Street name and number',
              text => handleInputChange('address', text),
              true,
            )}

            {renderTextInput(
              'Landmark',
              formData.landmark,
              'Nearest landmark',
              text => handleInputChange('landmark', text),
            )}

            {renderDropdown(
              'State/Province',
              formData.state,
              'State/Province',
              states,
              showStateDropdown,
              () => setShowStateDropdown(!showStateDropdown),
              option => handleInputChange('state', option),
              true,
            )}

            {renderDropdown(
              'City',
              formData.city,
              'City',
              cities,
              showCityDropdown,
              () => setShowCityDropdown(!showCityDropdown),
              option => handleInputChange('city', option),
              true,
            )}

            {renderTextInput(
              'Post/Zip Code',
              formData.zipCode,
              'Post/Zip code',
              text => handleInputChange('zipCode', text),
              true,
            )}

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() =>
                handleInputChange('isDefault', !formData.isDefault)
              }
            >
              <View
                style={[
                  styles.checkbox,
                  formData.isDefault && styles.checkboxSelected,
                ]}
              >
                {formData.isDefault && (
                  <Image source={ICONS.check} style={styles.checkIcon} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                Set as default shipping address
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
          <Text style={styles.addButtonText}>Add Address</Text>
        </TouchableOpacity>
      </View> */}

      <TouchableOpacity
        style={styles.cancelButton}
        // onPress={() => navigate('AddAddressScreen')}
      >
        <Text style={styles.cancelButtonText}>Add Address</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioButton: {
    marginRight: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.placeholderGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  required: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.error,
    marginLeft: 4,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  dropdownContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
  },
  dropdownText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.placeholderGray,
  },
  dropdownIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.shuttleGray,
  },
  dropdownOptions: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  dropdownOptionText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkIcon: {
    width: 12,
    height: 12,
    tintColor: COLORS.white,
  },
  checkboxLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  addButton: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.white,
  },
});

export default AddAddressScreen;
