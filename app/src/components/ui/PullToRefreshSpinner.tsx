import React from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface PullToRefreshSpinnerProps {
  refreshing: boolean;
}

export const PullToRefreshSpinner: React.FC<PullToRefreshSpinnerProps> = ({ refreshing }) => {
  const { colors } = useTheme();

  if (!refreshing) {
    return null;
  }

  return (
    <View style={[styles.topSpinner, { backgroundColor: 'transparent' }]}>
      <View style={[styles.spinnerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator 
          size="small" 
          color={colors.primary} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topSpinner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 15 : 50, // Higher position on iOS
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  spinnerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
