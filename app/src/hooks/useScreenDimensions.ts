import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

interface ScreenDimensions {
  width: number;
  height: number;
  isSmallScreen: boolean;
  isVerySmallScreen: boolean;
  isExtraSmallScreen: boolean;
  isTablet: boolean;
}

export const useScreenDimensions = (): ScreenDimensions => {
  const [dimensions, setDimensions] = useState<ScreenDimensions>(() => {
    const { width, height } = Dimensions.get('window');
    return {
      width,
      height,
      isSmallScreen: width < 400,
      isVerySmallScreen: width < 350,
      isExtraSmallScreen: width < 320,
      isTablet: width >= 768,
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
      setDimensions({
        width: window.width,
        height: window.height,
        isSmallScreen: window.width < 400,
        isVerySmallScreen: window.width < 350,
        isExtraSmallScreen: window.width < 320,
        isTablet: window.width >= 768,
      });
    });

    return () => subscription?.remove();
  }, []);

  return dimensions;
};
