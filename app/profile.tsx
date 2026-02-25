import { StyleSheet, Text, View, Pressable, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const PLAN_LABELS: Record<string, { label: string; color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  free: { label: "FREE", color: Colors.textSecondary, icon: "shield-outline" },
  pro: { label: "PRO", color: Colors.cyan, icon: "shield-star" },
  enterprise: { label: "ENTERPRISE", color: Colors.yellow, icon: "shield-crown" },
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  if (!user) return null;

  const plan = PLAN_LABELS[user.subscription];
  const joinDate = new Date(user.joinDate);
  const joinStr = `${joinDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace("/login");
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
        <Text style={styles.topTitle}>PROFILE</Text>
        <View style={{ width: 36 }} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name={user.avatar as any} size={40} color={Colors.cyan} />
          </View>
          <View style={[styles.planBadge, { backgroundColor: plan.color + "22", borderColor: plan.color }]}>
            <MaterialCommunityIcons name={plan.icon} size={12} color={plan.color} />
            <Text style={[styles.planBadgeText, { color: plan.color }]}>{plan.label}</Text>
          </View>
        </View>
        <Text style={styles.displayName}>{user.displayName}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.joinDate}>Member since {joinStr}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)}>
        <Text style={styles.sectionLabel}>SECURITY STATS</Text>
        <View style={styles.statsRow}>
          <StatBlock value={user.threatsBlocked} label="Threats Blocked" icon="shield-check" color={Colors.red} />
          <StatBlock value={user.scansCompleted} label="Scans Done" icon="radar" color={Colors.cyan} />
          <StatBlock value={user.uptimeHours} label="Uptime (hrs)" icon="clock-check" color={Colors.green} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(500)}>
        <Text style={styles.sectionLabel}>ACTIONS</Text>
        <View style={styles.actionsCard}>
          <Pressable
            onPress={() => router.push("/subscription")}
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.cyanDim }]}>
              <MaterialCommunityIcons name="crown" size={18} color={Colors.cyan} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Subscription</Text>
              <Text style={styles.actionDesc}>Current plan: {plan.label}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textDim} />
          </Pressable>

          <View style={styles.actionDivider} />

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.redDim }]}>
              <MaterialCommunityIcons name="logout" size={18} color={Colors.red} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: Colors.red }]}>Sign Out</Text>
              <Text style={styles.actionDesc}>End current session</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textDim} />
          </Pressable>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function StatBlock({ value, label, icon, color }: { value: number; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }) {
  return (
    <View style={styles.statBlock}>
      <View style={[styles.statIconWrap, { backgroundColor: color + "22" }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    marginBottom: 24,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 14,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.cyanDim,
    borderWidth: 2,
    borderColor: Colors.cyan,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  planBadgeText: {
    fontSize: 10,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 1,
  },
  displayName: {
    color: Colors.text,
    fontSize: 22,
    fontFamily: "Rajdhani_700Bold",
    marginBottom: 2,
  },
  username: {
    color: Colors.cyan,
    fontSize: 14,
    fontFamily: "Orbitron_400Regular",
    marginBottom: 4,
  },
  email: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: "Rajdhani_500Medium",
    marginBottom: 4,
  },
  joinDate: {
    color: Colors.textDim,
    fontSize: 12,
    fontFamily: "Rajdhani_500Medium",
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: "Orbitron_400Regular",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statBlock: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Orbitron_700Bold",
    marginBottom: 2,
  },
  statLabel: {
    color: Colors.textDim,
    fontSize: 10,
    fontFamily: "Rajdhani_500Medium",
    textAlign: "center",
  },
  actionsCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: "Rajdhani_600SemiBold",
  },
  actionDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: "Rajdhani_500Medium",
  },
  actionDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 14,
  },
});
