import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDecay,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface ImageViewerProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  imageUrl,
  onClose,
}) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetTransform = () => {
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const handleClose = () => {
    resetTransform();
    onClose();
  };

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      // Limit zoom between 1x and 5x
      if (scale.value < 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
      } else if (scale.value > 5) {
        scale.value = withTiming(5);
        savedScale.value = 5;
      } else {
        savedScale.value = scale.value;
      }
    });

  // Pan gesture for dragging (only when zoomed)
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (savedScale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd((event) => {
      if (savedScale.value > 1) {
        // Add momentum decay
        translateX.value = withDecay({
          velocity: event.velocityX,
          clamp: [
            -(SCREEN_WIDTH * savedScale.value - SCREEN_WIDTH) / 2,
            (SCREEN_WIDTH * savedScale.value - SCREEN_WIDTH) / 2,
          ],
        });
        translateY.value = withDecay({
          velocity: event.velocityY,
          clamp: [
            -(SCREEN_HEIGHT * savedScale.value - SCREEN_HEIGHT) / 2,
            (SCREEN_HEIGHT * savedScale.value - SCREEN_HEIGHT) / 2,
          ],
        });
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
    });

  // Double tap to zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.value > 1) {
        // Zoom out
        runOnJS(resetTransform)();
      } else {
        // Zoom in to 2.5x
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
      }
    });

  // Compose gestures
  const composedGestures = Gesture.Simultaneous(
    doubleTapGesture,
    Gesture.Race(pinchGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  React.useEffect(() => {
    if (!visible) {
      resetTransform();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Close button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Image with gestures */}
        <GestureDetector gesture={composedGestures}>
          <Animated.View style={[styles.imageContainer, animatedStyle]}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>
        </GestureDetector>

        {/* Instructions */}
        <View style={styles.footer}>
          <View style={styles.instructionContainer}>
            <Ionicons name="hand-left-outline" size={16} color="#FFFFFF" />
            <View style={styles.instructionTextContainer}>
              <View style={styles.instructionRow}>
                <Ionicons name="resize-outline" size={14} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.instructionTextLabel}>Pinch to zoom</Text>
              </View>
              <View style={styles.instructionRow}>
                <Ionicons name="move-outline" size={14} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.instructionTextLabel}>Drag when zoomed</Text>
              </View>
              <View style={styles.instructionRow}>
                <Ionicons name="hand-right-outline" size={14} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.instructionTextLabel}>Double tap to toggle</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.98)',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  instructionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  instructionTextContainer: {
    flex: 1,
    gap: 8,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionTextLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
  },
});
