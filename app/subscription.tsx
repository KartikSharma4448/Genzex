import { useEffect } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeInDown, FadeInUp } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

interface PlanInfo {
  id: "free" | "pro" | "enterprise";
  name: string;
  price: string;
  period: string;
  color: string;
  glowColor: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  features: string[];
  popular?: boolean;
}

const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    color: Colors.textSecondary,
    glowColor: "rgba(139, 156, 182, 0.15)",
    icon: "shield-outline",
    features: [
      "Basic network monitoring",
      "Up to 50 connections",
      "Standard threat detection",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9.99",
    period: "/month",
    color: Colors.cyan,
    glowColor: Colors.cyanDim,
    icon: "shield-star",
    popular: true,
    features: [
      "Advanced AI threat detection",
      "Unlimited connections",
      "Real-time alerts",
      "Priority support",
      "Custom firewall rules",
      "Export reports",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$29.99",
    period: "/month",
    color: Colors.yellow,
    glowColor: Colors.yellowDim,
    icon: "shield-crown",
    features: [
      "Military-grade protection",
      "Unlimited everything",
      "Neural network classifier",
      "24/7 dedicated support",
      "API access",
      "Multi-device sync",
      "Audit trail & compliance",
    ],
  },
];

function PlanCard({ plan, isActive, onSelect }: { plan: PlanInfo; isActive: boolean; onSelect: () => void }) {
  const glowPulse = useSharedValue(0.4);

  useEffect(() => {
    if (plan.popular || isActive) {
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1500 }),
          withTiming(0.4, { duration: 1500 })
        ),
        -1,
        false
      );
    }
  }, [plan.popular, isActive, glowPulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.planCard,
        { borderColor: isActive ? plan.color : Colors.cardBorder },
        isActive && { borderWidth: 2 },
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      ]}
    >
      {plan.popular ? (
        <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      ) : null}

      <Animated.View style={[styles.planGlow, { backgroundColor: plan.glowColor }, glowStyle]} />

      <View style={styles.planHeader}>
        <View style={[styles.planIconWrap, { backgroundColor: plan.glowColor }]}>
          <MaterialCommunityIcons name={plan.icon} size={24} color={plan.color} />
        </View>
        <View>
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
            <Text style={styles.planPeriod}>{plan.period}</Text>
          </View>
        </View>
      </View>

      <View style={styles.featureList}>
        {plan.features.map((feat, i) => (
          <View key={i} style={styles.featureRow}>
            <MaterialCommunityIcons name="check-circle" size={14} color={plan.color} />
            <Text style={styles.featureText}>{feat}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.selectBtn, { backgroundColor: isActive ? plan.color : "transparent", borderColor: plan.color }]}>
        {isActive ? (
          <>
            <MaterialCommunityIcons name="check" size={16} color={Colors.background} />
            <Text style={[styles.selectBtnText, { color: Colors.background }]}>CURRENT PLAN</Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons name="arrow-right" size={16} color={plan.color} />
            <Text style={[styles.selectBtnText, { color: plan.color }]}>SELECT PLAN</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateSubscription } = useAuth();
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  if (!user) return null;

  const handleSelect = async (planId: "free" | "pro" | "enterprise") => {
    if (planId === user.subscription) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateSubscription(planId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 + webTopPad, paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.cyan} />
        </Pressable>
        <Text style={styles.topTitle}>SUBSCRIPTION</Text>
        <View style={{ width: 36 }} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.heroSection}>
        <MaterialCommunityIcons name="rocket-launch" size={36} color={Colors.cyan} />
        <Text style={styles.heroTitle}>Upgrade Your Shield</Text>
        <Text style={styles.heroDesc}>
          Choose the protection level that fits your network security needs
        </Text>
      </Animated.View>

      {PLANS.map((plan, index) => (
        <Animated.View key={plan.id} entering={FadeInUp.delay(200 + index * 100).duration(500)}>
          <PlanCard
            plan={plan}
            isActive={user.subscription === plan.id}
            onSelect={() => handleSelect(plan.id)}
          />
        </Animated.View>
      ))}

      <View style={styles.footer}>
        <MaterialCommunityIcons name="information-outline" size={14} color={Colors.textDim} />
        <Text style={styles.footerText}>
          This is a simulation. No real charges will be made.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  },
  topTitle: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 2,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  heroTitle: {
    color: Colors.text,
    fontSize: 22,
    fontFamily: "Rajdhani_700Bold",
  },
  heroDesc: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: "Rajdhani_500Medium",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  planCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 14,
    overflow: "hidden",
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  popularText: {
    color: Colors.background,
    fontSize: 9,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 1,
  },
  planGlow: {
    position: "absolute",
    top: -30,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  planIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  planName: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: "Rajdhani_700Bold",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  planPrice: {
    fontSize: 22,
    fontFamily: "Orbitron_700Bold",
  },
  planPeriod: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: "Rajdhani_500Medium",
  },
  featureList: {
    gap: 8,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: "Rajdhani_500Medium",
    flex: 1,
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectBtnText: {
    fontSize: 11,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
  },
  footerText: {
    color: Colors.textDim,
    fontSize: 12,
    fontFamily: "Rajdhani_500Medium",
  },
});
