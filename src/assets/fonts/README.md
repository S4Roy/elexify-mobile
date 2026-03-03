# Poppins Font Setup for React Native

## Font Files Required

Place the following Poppins font files in this directory:

### Required Poppins Font Files:

- `Poppins-Thin.ttf` (100)
- `Poppins-Light.ttf` (300)
- `Poppins-Regular.ttf` (400)
- `Poppins-Medium.ttf` (500)
- `Poppins-SemiBold.ttf` (600)
- `Poppins-Bold.ttf` (700)
- `Poppins-ExtraBold.ttf` (800)
- `Poppins-Black.ttf` (900)

## Installation Steps:

1. **Download Poppins fonts** from Google Fonts: https://fonts.google.com/specimen/Poppins
2. **Extract and copy** the `.ttf` files to this `src/assets/fonts/` directory
3. **Link the fonts** by running:
   ```bash
   npx react-native-asset
   ```
   OR if using older versions:
   ```bash
   npx react-native link
   ```
4. **Clean and rebuild** the project:

   ```bash
   # Clean
   cd android && ./gradlew clean && cd ..
   npx react-native start --reset-cache

   # Rebuild
   npx react-native run-android
   npx react-native run-ios
   ```

## Usage in Components:

```tsx
import { FONTS, TYPOGRAPHY } from '../utils/constants';

// Using font families directly
<Text style={{ fontFamily: FONTS.family.regular }}>Regular Text</Text>
<Text style={{ fontFamily: FONTS.family.bold }}>Bold Text</Text>

// Using typography styles (recommended)
<Text style={TYPOGRAPHY.h1}>Main Heading</Text>
<Text style={TYPOGRAPHY.bodyMedium}>Body text</Text>
<Text style={TYPOGRAPHY.buttonLarge}>Button Text</Text>
```

## File Structure After Setup:

```
src/assets/fonts/
├── Poppins-Thin.ttf
├── Poppins-Light.ttf
├── Poppins-Regular.ttf
├── Poppins-Medium.ttf
├── Poppins-SemiBold.ttf
├── Poppins-Bold.ttf
├── Poppins-ExtraBold.ttf
└── Poppins-Black.ttf
```

## Notes:

- Font names in React Native should match the actual font family name
- For Android, font file names become the font family names
- For iOS, the font family name might be different from the file name
- Test on both platforms after installation
