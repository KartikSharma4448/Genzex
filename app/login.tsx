import { useState, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, Image, Platform, ActivityIndicator, KeyboardAvoidingView, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeInUp, FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, isLoggedIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const glowPulse = useSharedValue(0.3);
  const scanLine = useSharedValue(0);

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/(tabs)");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      false
    );
    scanLine.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0, { duration: 3000 })
      ),
      -1,
      false
    );
  }, [glowPulse, scanLine]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    top: `${scanLine.value * 100}%`,
  }));

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(username.trim(), password.trim());
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Login failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    }
  };

  const webTopPad = Platform.OS === "web" ? 67 : 0;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 + webTopPad, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.glowOrb, styles.glowOrb1, glowStyle]} />
        <Animated.View style={[styles.glowOrb, styles.glowOrb2, glowStyle]} />

        <Animated.View entering={FadeInDown.duration(600)} style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/genzex-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Animated.View style={[styles.scanLine, scanLineStyle]} />
          </View>
          <Text style={styles.appTitle}>GENZEX</Text>
          <Text style={styles.appSubtitle}>NETWORK SECURITY SYSTEM</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.formCard}>
          <View style={styles.formHeader}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={Colors.cyan} />
            <Text style={styles.formTitle}>SECURE LOGIN</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={Colors.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="account-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={Colors.textDim}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor={Colors.textDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
              <MaterialCommunityIcons
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color={Colors.textDim}
              />
            </Pressable>
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.loginBtn,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              loading && { opacity: 0.6 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="shield-check" size={18} color={Colors.background} />
                <Text style={styles.loginBtnText}>AUTHENTICATE</Text>
              </>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={() => router.push("/register")}
            style={({ pressed }) => [
              styles.registerBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <MaterialCommunityIcons name="account-plus-outline" size={16} color={Colors.cyan} />
            <Text style={styles.registerBtnText}>CREATE NEW ACCOUNT</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Text style={styles.footerText}>Protected by GX Neural Core v1.0</Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  glowOrb: {
    position: "absolute",
    borderRadius: 200,
  },
  glowOrb1: {
    width: 300,
    height: 300,
    backgroundColor: Colors.cyanGlow,
    top: -100,
    right: -100,
  },
  glowOrb2: {
    width: 200,
    height: 200,
    backgroundColor: Colors.redGlow,
    bottom: 50,
    left: -80,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cyanGlow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  logo: {
    width: 60,
    height: 60,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.cyanGlow,
  },
  appTitle: {
    color: Colors.cyan,
    fontSize: 28,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 4,
  },
  appSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 3,
    marginTop: 4,
  },
  formCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 24,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    justifyContent: "center",
  },
  formTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: "Orbitron_400Regular",
    letterSpacing: 2,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.redDim,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.red,
    fontSize: 13,
    fontFamily: "Rajdhani_500Medium",
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: Colors.text,
    fontSize: 15,
    fontFamily: "Rajdhani_500Medium",
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.cyan,
    borderRadius: 10,
    height: 48,
    marginTop: 4,
  },
  loginBtnText: {
    color: Colors.background,
    fontSize: 14,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 1.5,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.cardBorder,
  },
  dividerText: {
    color: Colors.textDim,
    fontSize: 11,
    fontFamily: "Rajdhani_500Medium",
  },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.cyan,
    borderRadius: 10,
    height: 44,
  },
  registerBtnText: {
    color: Colors.cyan,
    fontSize: 12,
    fontFamily: "Orbitron_400Regular",
    letterSpacing: 1,
  },
  footerText: {
    color: Colors.textDim,
    fontSize: 11,
    fontFamily: "Rajdhani_500Medium",
    textAlign: "center",
    letterSpacing: 1,
  },
});
