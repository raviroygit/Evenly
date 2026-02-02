import React, { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useVideoPlayer, VideoView } from 'expo-video';

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

  const player = useVideoPlayer(LOGO_VIDEO, (p) => {
    p.loop = false;
    p.muted = false; // play with audio (was true for silent logo)
    p.play();
  });

  useEffect(() => {
    const sub = player.addListener('playToEnd', onFinish);
    return () => sub.remove();
  }, [player, onFinish]);

  useEffect(() => {
    const sub = player.addListener('sourceLoad', hideSplashOnce);
    return () => sub.remove();
  }, [player, hideSplashOnce]);

  useEffect(() => {
    const sub = player.addListener('statusChange', (payload) => {
      if (payload.status === 'error') onFinish();
    });
    return () => sub.remove();
  }, [player, onFinish]);

  return (
    <View style={styles.logoContainer}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="contain"
        nativeControls={false}
        allowsFullscreen={false}
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
  },
});
