import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Dimensions,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, FONTS, IMAGES, ICONS } from '../../utils/constants';

const { width } = Dimensions.get('window');

import { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import normalize from '../../utils/helper/normalize';

type OTPScreenRouteProp = RouteProp<
  { params: { email?: string; phone?: string } },
  'params'
>;

interface OTPScreenProps {
  route: OTPScreenRouteProp;
  navigation: any;
}

const OTPScreen: React.FC<OTPScreenProps> = ({ route, navigation }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(119); // 01:59 in seconds
  const { email, phone } = route.params;

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  const handleOTPChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input when entering a digit
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-focus previous input when removing a digit
    else if (!value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyPress = (event: any, index: number) => {
    // Handle backspace: if current field is empty, move to previous and clear it
    if (event.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Current field is empty, move to previous field
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerifyOTP = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 4) {
      // TODO: Implement OTP verification logic
      console.log('Verify OTP:', otpCode, 'for', phone || email);
      // NavigationService.reset([{ name: 'Main' }]);
      navigation.navigate('DetailsScreen');
    }
  };

  const handleSignIn = () => {
    navigation.navigate('LoginScreen');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Content */}
          <View style={styles.container}>
            <Image
              source={IMAGES.logo}
              style={{
                height: normalize(70),
                width: normalize(170),
                resizeMode: 'contain',
              }}
            />

            {/* Heading Section */}
            <View style={styles.headingSection}>
              <Text style={styles.title}>Verify OTP</Text>
              <Text style={styles.subtitle}>
                We sent a 4-digit OTP to your mobile number
              </Text>
              <Text style={styles.phoneNumber}>{phone || '6291332961'}</Text>
            </View>

            {/* OTP Input Section */}
            <View style={styles.otpSection}>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <View key={index} style={styles.otpInputWrapper}>
                    <TextInput
                      ref={ref => {
                        inputRefs.current[index] = ref;
                      }}
                      style={styles.otpInput}
                      value={digit}
                      onChangeText={value => handleOTPChange(value, index)}
                      onKeyPress={event => handleKeyPress(event, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      placeholder="-"
                      placeholderTextColor={COLORS.placeholderGray}
                      textAlign="center"
                    />
                  </View>
                ))}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  { opacity: otp.join('').length === 4 ? 1 : 0.6 },
                ]}
                onPress={handleVerifyOTP}
                disabled={otp.join('').length !== 4}
              >
                <Text style={styles.verifyButtonText}>Verify</Text>
              </TouchableOpacity>

              {/* Timer */}
              <View style={styles.timerContainer}>
                <Image
                  source={ICONS.clock}
                  style={{
                    height: normalize(12),
                    width: normalize(12),
                    resizeMode: 'contain',
                  }}
                />
                <Text style={styles.timerText}>{formatTime(timer)}</Text>
              </View>
            </View>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
              <Text style={styles.bottomText}>
                Already have an account?{' '}
                <Text style={styles.signInText} onPress={handleSignIn}>
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
  safeArea: {
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    height: 50,
  },
  timeText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.mediumGray,
    fontFamily: 'SF Pro',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryIcon: {
    width: 21.76,
    height: 13,
    position: 'relative',
  },
  batteryBorder: {
    position: 'absolute',
    width: 19.9,
    height: 13,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    borderRadius: 4.3,
  },
  batteryCapacity: {
    position: 'absolute',
    left: 1.59,
    top: 2,
    width: 16.72,
    height: 9,
    backgroundColor: COLORS.mediumGray,
    borderRadius: 2.5,
  },
  container: {
    alignItems: 'center',
    paddingTop: normalize(20),
    paddingHorizontal: 20,
    minHeight: Dimensions.get('window').height - 100, // Ensure minimum height for scrolling
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 30,
  },
  logoPlaceholder: {
    width: 235,
    height: 67,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  headingSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 26,
    fontFamily: FONTS.semiBold,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.subtleGray,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  phoneNumber: {
    fontSize: 26,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    fontFamily: FONTS.semiBold,
    lineHeight: 20,
  },
  otpSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 60,
    paddingBottom: 60,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 343,
    marginBottom: 40,
  },
  otpInputWrapper: {
    width: 60,
    height: 60,
  },
  otpInput: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.backgroundTertiary,
    borderWidth: 1,
    borderColor: COLORS.accentLight,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.placeholderGray,
    textAlign: 'center',
    fontFamily: FONTS.medium,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.accent,
    fontFamily: FONTS.medium,
    lineHeight: 21,
    marginLeft: 10,
  },
  verifyButton: {
    width: 343,
    height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
    lineHeight: 24,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  bottomText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mutedGray,
    fontFamily: FONTS.semiBold,
    lineHeight: 24,
    textAlign: 'center',
  },
  signInText: {
    color: COLORS.primary,
  },
});

export default OTPScreen;
