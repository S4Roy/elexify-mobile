import Toast from 'react-native-simple-toast';

// Define types for the function parameters
export default function ToastAlert(
  message: string,
  isLong: boolean = false,
): void {
  Toast.showWithGravity(message, isLong ? Toast.LONG : Toast.SHORT, Toast.TOP);
}
