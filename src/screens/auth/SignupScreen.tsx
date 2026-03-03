import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { COLORS, FONTS, ICONS, IMAGES } from '../../utils/constants';

import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { navigate } from '../../utils/helper/RootNavigation';
import normalize from '../../utils/helper/normalize';

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
};

type SignupScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = () => {
    // TODO: Implement login logic
    // console.log('Login with:', email, password);
    navigate('OTPScreen', { email, phone });
  };

  const handleSignup = () => {
    // navigation.navigate('Signup');
    navigate('LoginScreen');
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password logic
    console.log('Forgot password');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Content */}
          <View style={styles.content}>
            <Image
              source={IMAGES.logo}
              style={{
                height: normalize(70),
                width: normalize(170),
                resizeMode: 'contain',
              }}
            />

            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>
              Welcome ! Please enter your details
            </Text>

            {/* Form Container */}
            <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="example@gmail.com"
                    placeholderTextColor={COLORS.placeholderGray}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Phone Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.phoneContainer}>
                    <View style={styles.countryCode}>
                      <Image
                        source={IMAGES.flag}
                        style={{
                          height: normalize(16),
                          width: normalize(16),
                          resizeMode: 'contain',
                        }}
                      />
                      <Text style={styles.countryCodeText}>+91</Text>
                      <Image
                        source={ICONS.arrowdown}
                        style={{
                          height: normalize(12),
                          width: normalize(12),
                          resizeMode: 'contain',
                        }}
                      />
                    </View>
                    <View style={styles.verticalLine} />
                    <TextInput
                      style={styles.phoneInput}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Add"
                      placeholderTextColor={COLORS.placeholderGray}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleLogin}
              >
                <View style={styles.buttonContent}>
                  <View style={styles.buttonIconLeft} />
                  <Text style={styles.buttonText}>Continue</Text>
                  <View style={styles.buttonIconRight} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text style={styles.signUpText} onPress={handleSignup}>
                  Sign In
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    height: 30,
  },
  timeText: {
    fontFamily: 'SF Pro',
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryContainer: {
    width: 22,
    height: 13,
  },
  battery: {
    width: 20,
    height: 13,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    borderRadius: 4,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  batteryLevel: {
    position: 'absolute',
    left: 1.5,
    top: 1.5,
    width: 17,
    height: 9,
    backgroundColor: COLORS.mediumGray,
    borderRadius: 2.5,
  },
  content: {
    alignItems: 'center',
    paddingTop: normalize(20),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 47,
  },
  logoPlaceholder: {
    width: 235,
    height: 67,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 46,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: normalize(19),
    color: COLORS.black,
    textAlign: 'center',
    marginTop: normalize(10),
    marginBottom: normalize(4),
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.subtleGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    // marginBottom: 29,
    width: '85%',
    marginTop: normalize(10),
  },
  inputGroup: {
    // marginBottom: 30,
    marginTop: normalize(20),
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.accent,
    marginBottom: 12,
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 1,
    borderColor: COLORS.accentLight,
    borderRadius: 12,
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.charcoal,
    lineHeight: 20,
  },
  eyeIcon: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.lightGray,
  },
  forgotPassword: {
    fontFamily: FONTS.medium,
    fontSize: normalize(12),
    color: COLORS.red,
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 42,
    marginTop: 10,
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.red,
    textDecorationStyle: 'solid',
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: normalize(30),
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIconLeft: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  buttonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    lineHeight: 24,
  },
  buttonIconRight: {
    width: 24,
    height: 24,
    marginLeft: 16,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 29,
  },
  footerText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.subtleGray,
    textAlign: 'center',
    lineHeight: 24,
  },
  signUpText: {
    color: COLORS.primary,
  },

  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  flagPlaceholder: {
    width: 18,
    height: 18,
    backgroundColor: COLORS.lightestGray,
    borderRadius: 9,
    marginRight: 8,
  },
  countryCodeText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(0, 0, 0, 0.53)',
    marginHorizontal: normalize(5),
  },
  dropdownArrow: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.lightestGray,
  },
  verticalLine: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    marginHorizontal: 8,
  },
  phoneInput: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    flex: 1,
  },
});

export default SignupScreen;
