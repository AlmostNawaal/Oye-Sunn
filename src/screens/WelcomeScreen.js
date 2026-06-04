import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../theme/colors';
import { Typography, Spacing } from '../theme/typography';

const { width, height } = Dimensions.get('window');

/**
 * WelcomeScreen — Animated splash screen.
 * Plays the sun animation + tagline, then navigates to Login.
 * Only shown when the user is not logged in.
 */
export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // Animations
  const sunScale = useRef(new Animated.Value(0.5)).current;
  const sunRotate = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Phase 1: Sun spins in
      Animated.parallel([
        Animated.spring(sunScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(sunRotate, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: App name slides up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      // Phase 3: Tagline fades in
      Animated.timing(taglineFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Phase 4: Short pause before navigating
      Animated.delay(600),
    ]).start(() => {
      navigation.replace('Login');
    });
  }, []);

  const spin = sunRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Decorative background circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      <View style={styles.content}>
        {/* Sun Illustration */}
        <Animated.View
          style={[
            styles.sunContainer,
            {
              transform: [{ scale: sunScale }, { rotate: spin }],
            },
          ]}
        >
          <View style={styles.sunOuter}>
            <View style={styles.sunInner}>
              <Text style={styles.sunEmoji}>☀️</Text>
            </View>
            {/* Sun rays */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <View
                key={i}
                style={[
                  styles.sunRay,
                  {
                    transform: [
                      { rotate: `${angle}deg` },
                      { translateY: -55 },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* App name */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={styles.appName}>Oye Sunn!</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={{ opacity: taglineFade }}>
          <Text style={styles.tagline}>
            Location based reminders{'\n'}that never let you forget.
          </Text>

          <View style={styles.bottomRow}>
            <Ionicons name="location" size={14} color={Colors.greenSoft} />
            <Text style={styles.bottomText}>
              Set it. Forget it. We'll remind you.
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },

  // Decorative bg circles
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(74, 95, 74, 0.15)',
    top: -80,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(74, 95, 74, 0.1)',
    bottom: 100,
    left: -60,
  },
  bgCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(232, 113, 58, 0.08)',
    top: 200,
    left: 50,
  },

  // Sun
  sunContainer: {
    marginBottom: Spacing.xxxl,
  },
  sunOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(232, 113, 58, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E2B1E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  sunEmoji: {
    fontSize: 36,
  },
  sunRay: {
    position: 'absolute',
    width: 3,
    height: 14,
    backgroundColor: Colors.accentOrange,
    borderRadius: 2,
    top: '50%',
    left: '50%',
    marginLeft: -1.5,
    marginTop: -7,
  },

  // Text
  appName: {
    ...Typography.brand,
    fontSize: 38,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  tagline: {
    ...Typography.body,
    color: Colors.greenSoft,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
    lineHeight: 24,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomText: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.greenSoft,
    marginLeft: Spacing.xs,
  },
});
