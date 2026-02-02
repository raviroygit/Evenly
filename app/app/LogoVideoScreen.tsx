import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

const LOGO_VIDEO = require('../assets/logo-animation.mp4.mp4');

export interface LogoVideoScreenProps {
  onFinish: () => void;
}

export default function LogoVideoScreen({ onFinish }: LogoVideoScreenProps) {
  const splashHidden = useRef(false);

  const hideSplashOnce = useCallback(() => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish && !status.isLooping) {
        onFinish();
      }
    },
    [onFinish]
  );

  return (
    <View style={styles.logoContainer}>
      <Video
        source={LOGO_VIDEO}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        onLoad={hideSplashOnce}
        onReadyForDisplay={hideSplashOnce}
        onError={() => onFinish()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web' ? { objectFit: 'contain' as const } : {}),
  },
});
