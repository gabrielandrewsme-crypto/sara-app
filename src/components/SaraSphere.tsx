import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { theme } from '../styles/theme';

export type SphereState = 'idle' | 'listening' | 'processing' | 'responding';

type Props = {
  state: SphereState;
  size?: number;
};

export function SaraSphere({ state, size = 220 }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scale.stopAnimation();
    rotation.stopAnimation();
    ring1.stopAnimation();
    ring2.stopAnimation();
    glow.stopAnimation();

    if (state === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.06,
            duration: 1200,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]),
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(glow, {
            toValue: 0.3,
            duration: 1200,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]),
      ).start();

      const ringLoop = (val: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(val, {
              toValue: 1,
              duration: 2200,
              useNativeDriver: true,
              easing: Easing.out(Easing.ease),
            }),
            Animated.timing(val, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        );
      ringLoop(ring1, 0).start();
      ringLoop(ring2, 1100).start();
    } else if (state === 'processing') {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
      ).start();
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(glow, {
        toValue: 0.6,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (state === 'responding') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.1,
            duration: 360,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 360,
            useNativeDriver: true,
            easing: Easing.in(Easing.ease),
          }),
        ]),
      ).start();
      Animated.timing(glow, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(glow, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }).start();
      ring1.setValue(0);
      ring2.setValue(0);
      rotation.setValue(0);
    }
  }, [state, scale, rotation, ring1, ring2, glow]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const ringScale = (v: Animated.Value) =>
    v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const ringOpacity = (v: Animated.Value) =>
    v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.55],
  });

  const wrapperSize = size * 1.9;

  return (
    <View
      style={[
        styles.wrapper,
        { width: wrapperSize, height: wrapperSize },
      ]}
    >
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: (size * 1.4) / 2,
            opacity: glowOpacity,
          },
        ]}
      />

      {state === 'listening' ? (
        <>
          <Animated.View
            style={[
              styles.ring,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                transform: [{ scale: ringScale(ring1) }],
                opacity: ringOpacity(ring1),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                transform: [{ scale: ringScale(ring2) }],
                opacity: ringOpacity(ring2),
              },
            ]}
          />
        </>
      ) : null}

      <Animated.View
        style={[
          styles.sphere,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale }, { rotate }],
          },
        ]}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: size * 0.78, height: size * 0.78 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: theme.colors.primary,
  },
  sphere: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 132, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.35)',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
});
