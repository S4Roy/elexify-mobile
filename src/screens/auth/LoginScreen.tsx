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

type LoginScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // TODO: Implement login logic
    console.log('Login with:', email, password);
    navigate('BottomTab');
  };

  const handleSignup = () => {
    // navigation.navigate('Signup');
    navigate('SignupScreen');
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
              Welcome back! Please enter your details
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

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="*****"
                    placeholderTextColor={COLORS.charcoal}
                    secureTextEntry
                  />
                  <TouchableOpacity>
                    <Image
                      source={ICONS.eye}
                      style={{
                        height: normalize(18),
                        width: normalize(18),
                        resizeMode: 'contain',
                      }}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>

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
                Don't have an account?{' '}
                <Text style={styles.signUpText} onPress={handleSignup}>
                  Sign Up
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
    marginTop: normalize(10),
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
});

export default LoginScreen;
