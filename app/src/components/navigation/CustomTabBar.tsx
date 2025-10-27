import { View, StyleSheet, Platform } from 'react-native';
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import TabBarButton from './TabBarButton';

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { theme, colors } = useTheme();

  const primaryColor = colors.primary;
  const greyColor = theme === 'dark' ? colors.mutedForeground : '#6B7280';

  return (
    <View style={[
      styles.tabbar,
      {
        backgroundColor: theme === 'dark' 
        ? 'rgba(0, 0, 0, 0.65)' // Slightly transparent for dark theme
        : 'rgba(255, 255, 255, 0.95)', // Slightly transparent for light theme
        borderColor: 'transparent',
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation:Platform.OS === 'ios' ? 10 : 0,
      }
    ]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        if (['_sitemap', '+not-found'].includes(route.name)) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabBarButton 
            key={route.name}
            onPress={onPress}
            onLongPress={onLongPress}
            isFocused={isFocused}
            routeName={route.name}
            color={isFocused ? primaryColor : greyColor}
            label={label}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabbar: {
    position: 'absolute', 
    bottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    borderCurve: 'continuous',
    zIndex: 999, // Lower z-index than floating buttons
  },
  androidGlassmorphism: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 10,
    shadowOpacity: 0.15,
    elevation: Platform.OS === 'ios' ? 12 : 0,
  },
  iosTabbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 10,
    shadowOpacity: 0.1,
  },
  tabbarItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default CustomTabBar;
