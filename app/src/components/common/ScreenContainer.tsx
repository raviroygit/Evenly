import React from 'react';
import { ScrollView, StyleSheet, Platform, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: any;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  contentContainerStyle,
  refreshing = false,
  onRefresh,
}) => {
  const { colors, theme } = useTheme();

  const containerStyle = [
    styles.container,
    { backgroundColor: colors.background },
  ];

  // Android-specific safe area handling
  const safeAreaEdges: Edge[] = Platform.OS === 'android' 
    ? ['top'] // Only top for Android to avoid navigation bar issues
    : ['top', 'bottom']; // Full safe area for iOS

  if (scrollable) {
    return (
      <>
        <StatusBar 
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
          translucent={Platform.OS === 'android'}
        />
        <SafeAreaView style={containerStyle} edges={safeAreaEdges}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[
              styles.contentContainer, 
              Platform.OS === 'android' && styles.androidContentContainer,
              contentContainerStyle
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            bounces={Platform.OS === 'ios'}
            alwaysBounceVertical={Platform.OS === 'ios'}
            // Custom pull-to-refresh will be handled by individual screens
          >
            {children}
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <StatusBar 
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={Platform.OS === 'android'}
      />
      <SafeAreaView style={containerStyle} edges={safeAreaEdges}>
        {children}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 20,
    // Remove justifyContent: 'center' to prevent centering content
  },
  androidContentContainer: {
    paddingBottom: Platform.OS === 'android' ? 40 : 20, // Extra padding for Android navigation
  },
});
