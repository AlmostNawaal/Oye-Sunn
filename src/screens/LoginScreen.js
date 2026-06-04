import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../theme/colors';
import { Typography, Spacing, BorderRadius, Shadows } from '../theme/typography';
import { FormInput } from '../components/FormElements';
import { ActionButton } from '../components/Buttons';
import { useApp } from '../context/AppContext';

export default function LoginScreen({ navigation }) {
  const { login } = useApp();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    setErrorMsg('');
    if (!username.trim()) {
      setErrorMsg('Please enter your username.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password);
      // Navigation is handled automatically by the App.js auth pattern
      // (isLoggedIn becomes true → Home stack is shown)
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials')) {
        setErrorMsg('Wrong username or password. Please try again.');
      } else if (msg.includes('Email not confirmed')) {
        setErrorMsg('Account not confirmed. Check your email.');
      } else {
        setErrorMsg(msg || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Decorative background circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.inner,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Logo */}
            <View style={styles.logoRow}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>☀️</Text>
              </View>
              <Text style={styles.appName}>Oye Sunn!</Text>
            </View>

            <Text style={styles.heading}>Welcome back 👋</Text>
            <Text style={styles.subheading}>Log in to your account to continue.</Text>

            {/* Form card */}
            <View style={[styles.card, Shadows.strong]}>
              <FormInput
                label="Username"
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  setErrorMsg('');
                }}
                placeholder="Enter your username"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />

              <FormInput
                label="Password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setErrorMsg('');
                }}
                placeholder="Enter your password"
                secureTextEntry
                maxLength={72}
              />

              {/* Inline error */}
              {!!errorMsg && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <ActionButton
                title={isLoading ? 'Logging in…' : 'Log In'}
                icon="log-in-outline"
                onPress={handleLogin}
                disabled={isLoading}
                style={{ marginTop: Spacing.md }}
              />
            </View>

            {/* Sign up link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup')}
              style={styles.linkRow}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>Don't have an account? </Text>
              <Text style={styles.linkAction}>Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  kav: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.section,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
  },

  // Decorative bg
  bgCircle1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(74, 95, 74, 0.15)',
    top: -100,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(74, 95, 74, 0.1)',
    bottom: 60,
    left: -60,
  },
  bgCircle3: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(232, 113, 58, 0.08)',
    top: 220,
    left: 40,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    ...Shadows.medium,
  },
  logoEmoji: {
    fontSize: 22,
  },
  appName: {
    ...Typography.brand,
    fontSize: 28,
    color: Colors.textLight,
  },

  // Headings
  heading: {
    ...Typography.h1,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subheading: {
    ...Typography.body,
    color: Colors.greenSoft,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },

  // Card
  card: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    marginBottom: Spacing.xl,
  },

  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 75, 75, 0.1)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Typography.small,
    color: Colors.danger,
    marginLeft: Spacing.xs,
    flex: 1,
  },

  // Sign-up link
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    ...Typography.body,
    color: Colors.greenSoft,
  },
  linkAction: {
    ...Typography.bodyBold,
    color: Colors.accentOrange,
  },
});
