import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, ICONS } from '../../utils/constants';
import SimpleHeader from '../../components/common/SimpleHeader';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  type: 'toggle' | 'navigation';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

const ManageAppScreen: React.FC = () => {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    locationAccess: true,
    biometricAuth: false,
    autoUpdate: true,
    dataSync: true,
  });

  const handleToggleChange = (
    settingKey: keyof typeof settings,
    value: boolean,
  ) => {
    setSettings(prev => ({
      ...prev,
      [settingKey]: value,
    }));
  };

  const settingSections = [
    {
      id: 'push',
      title: 'Push Notifications',
      subtitle: 'Receive push notifications',
      icon: ICONS.notification,
      type: 'toggle' as const,
      value: settings.pushNotifications,
      onToggle: (value: boolean) =>
        handleToggleChange('pushNotifications', value),
    },
    {
      id: 'email',
      title: 'Product Notify',
      subtitle: 'Receive email updates',
      icon: ICONS.comment,
      type: 'toggle' as const,
      value: settings.emailNotifications,
      onToggle: (value: boolean) =>
        handleToggleChange('emailNotifications', value),
    },
    {
      id: 'email',
      title: 'Allow offer nofitication',
      subtitle: 'Receive email updates',
      icon: ICONS.comment,
      type: 'toggle' as const,
      value: settings.emailNotifications,
      onToggle: (value: boolean) =>
        handleToggleChange('emailNotifications', value),
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.type === 'navigation' ? item.onPress : undefined}
      activeOpacity={item.type === 'navigation' ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{
              false: COLORS.lightGray,
              true: COLORS.accentLight,
            }}
            thumbColor={item.value ? COLORS.primary : COLORS.white}
            ios_backgroundColor={COLORS.lightGray}
          />
        ) : (
          <Image source={ICONS.arrownext} style={styles.arrowIcon} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SimpleHeader title="Manage App" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {settingSections.map((item, itemIndex) => (
            <View key={item.id}>
              {renderSettingItem(item)}
              {/* {itemIndex < settingSections.length - 1 && (
                <View style={styles.separator} />
              )} */}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 16,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.primary,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textTertiary,
  },
  settingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.textTertiary,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 68,
  },
});

export default ManageAppScreen;
