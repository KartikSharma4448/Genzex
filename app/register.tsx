import { useState, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, Platform, ActivityIndicator, KeyboardAvoidingView, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeInUp, FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register, isLoggedIn } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const glowPulse = useSharedValue(0.3);

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/(tabs)");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      false
    );
  }, [glowPulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const handleRegister = async () => {
    if (!displayName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    setError("");
    const result = await register(username.trim(), email.trim(), password, displayName.trim());
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Registration failed");
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 + webTopPad, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.glowOrb, glowStyle]} />

        <Animated.View entering={FadeInDown.duration(500)} style={styles.headerSection}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.cyan} />
          </Pressable>
          <View style={styles.headerCenter}>
            <MaterialCommunityIcons name="shield-plus" size={28} color={Colors.cyan} />
            <Text style={styles.title}>CREATE ACCOUNT</Text>
            <Text style={styles.subtitle}>Join the GX Security Network</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.formCard}>
          {error ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={Colors.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="badge-account-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Your display name"
              placeholderTextColor={Colors.textDim}
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

          <Text style={styles.fieldLabel}>USERNAME</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="account-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Choose a username"
              placeholderTextColor={Colors.textDim}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.fieldLabel}>EMAIL</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={Colors.textDim}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.fieldLabel}>PASSWORD</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Create a password"
              placeholderTextColor={Colors.textDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
              <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={18} color={Colors.textDim} />
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-check-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor={Colors.textDim}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          <Pressable
            onPress={handleRegister}
            disabled={loading}
            style={({ pressed }) => [
              styles.registerBtn,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              loading && { opacity: 0.6 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="rocket-launch" size={18} color={Colors.background} />
                <Text style={styles.registerBtnText}>INITIALIZE ACCOUNT</Text>
              </>
            )}
          </Pressable>
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
  },
  glowOrb: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Colors.cyanGlow,
    top: -80,
    left: -60,
  },
  headerSection: {
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerCenter: {
    alignItems: "center",
    gap: 6,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 2,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 1,
  },
  formCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignSelf: "center",
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
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontFamily: "Orbitron_400Regular",
    letterSpacing: 1.5,
    marginBottom: 6,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 46,
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Rajdhani_500Medium",
  },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.cyan,
    borderRadius: 10,
    height: 48,
    marginTop: 8,
  },
  registerBtnText: {
    color: Colors.background,
    fontSize: 13,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 1,
  },
});
