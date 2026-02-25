import { StyleSheet, Text, View, FlatList, Platform, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";
import { router } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useNetwork } from "@/contexts/NetworkContext";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/StatCard";
import { ConnectionRow } from "@/components/ConnectionRow";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { connections, stats, settings, isLoading } = useNetwork();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const scanPulse = useSharedValue(0.5);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [authLoading, isLoggedIn]);

  useEffect(() => {
    if (settings.monitoringEnabled) {
      scanPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1,
        false
      );
    }
  }, [settings.monitoringEnabled, scanPulse]);

  const scanDotStyle = useAnimatedStyle(() => ({
    opacity: scanPulse.value,
  }));

  const webTopPad = Platform.OS === "web" ? 67 : 0;

  const renderHeader = () => (
    <View>
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTopPad }]}>
        <View style={styles.logoRow}>
          <Image
            source={require("@/assets/images/genzex-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.appTitle}>GENZEX</Text>
            <Text style={styles.appSubtitle}>
              {user ? `Welcome, ${user.displayName}` : "Network Security"}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statusRow}>
            <Animated.View style={[styles.statusDot, scanDotStyle, { backgroundColor: settings.monitoringEnabled ? Colors.green : Colors.red }]} />
            <Text style={[styles.statusText, { color: settings.monitoringEnabled ? Colors.green : Colors.red }]}>
              {settings.monitoringEnabled ? "LIVE" : "OFF"}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/profile")}
            style={({ pressed }) => [styles.profileBtn, pressed && { opacity: 0.7 }]}
          >
            <MaterialCommunityIcons
              name={user?.avatar as any || "account-circle"}
              size={22}
              color={Colors.cyan}
            />
          </Pressable>
        </View>
      </View>

      {stats.modelActive ? (
        <View style={styles.aiBar}>
          <View style={styles.aiBadge}>
            <MaterialCommunityIcons name="brain" size={14} color={Colors.cyan} />
            <Text style={styles.aiBarText}>AI MODEL ACTIVE</Text>
          </View>
          <View style={styles.aiStats}>
            <Text style={styles.aiStatText}>Confidence: {Math.round(stats.avgConfidence * 100)}%</Text>
            {stats.blocked > 0 ? (
              <View style={styles.blockedBadge}>
                <MaterialCommunityIcons name="shield-lock" size={10} color={Colors.red} />
                <Text style={styles.blockedText}>{stats.blocked} blocked</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {user && user.subscription !== "free" ? (
        <View style={styles.planBar}>
          <MaterialCommunityIcons
            name={user.subscription === "enterprise" ? "shield-crown" : "shield-star"}
            size={14}
            color={user.subscription === "enterprise" ? Colors.yellow : Colors.cyan}
          />
          <Text style={[styles.planBarText, { color: user.subscription === "enterprise" ? Colors.yellow : Colors.cyan }]}>
            {user.subscription.toUpperCase()} PLAN ACTIVE
          </Text>
        </View>
      ) : null}

      <View style={styles.statsGrid}>
        <StatCard title="Total Active" value={stats.total} icon="server-network" color={Colors.cyan} glowColor={Colors.cyanDim} />
        <StatCard title="Safe" value={stats.safe} icon="shield-check" color={Colors.green} glowColor={Colors.greenDim} />
      </View>
      <View style={styles.statsGrid}>
        <StatCard title="Suspicious" value={stats.suspicious} icon="shield-alert" color={Colors.yellow} glowColor={Colors.yellowDim} />
        <StatCard title="Malicious" value={stats.malicious} icon="shield-off" color={Colors.red} glowColor={Colors.redDim} />
      </View>

      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="format-list-bulleted" size={16} color={Colors.cyan} />
        <Text style={styles.sectionTitle}>LIVE CONNECTIONS</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{connections.length}</Text>
        </View>
      </View>
    </View>
  );

  if (authLoading || isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons name="shield-search" size={48} color={Colors.cyan} />
        <Text style={styles.loadingText}>Initializing Scanner...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={connections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ConnectionRow item={item} />}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === "web" ? 84 : 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="shield-off-outline" size={40} color={Colors.textDim} />
            <Text style={styles.emptyText}>No active connections</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
  },
  appTitle: {
    color: Colors.cyan,
    fontSize: 22,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 2,
  },
  appSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontFamily: "Orbitron_400Regular",
    letterSpacing: 1,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cyanDim,
    borderWidth: 1,
    borderColor: Colors.cyan,
    alignItems: "center",
    justifyContent: "center",
  },
  aiBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.cyanDim,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cyan + "44",
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  aiBarText: {
    color: Colors.cyan,
    fontSize: 10,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 1,
  },
  aiStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiStatText: {
    color: Colors.cyan,
    fontSize: 11,
    fontFamily: "Rajdhani_600SemiBold",
  },
  blockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.redDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  blockedText: {
    color: Colors.red,
    fontSize: 10,
    fontFamily: "Rajdhani_600SemiBold",
  },
  planBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  planBarText: {
    fontSize: 10,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 1.5,
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: "Orbitron_400Regular",
    letterSpacing: 1.5,
    flex: 1,
  },
  countBadge: {
    backgroundColor: Colors.cyanDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    color: Colors.cyan,
    fontSize: 11,
    fontFamily: "Orbitron_700Bold",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  loadingText: {
    color: Colors.cyan,
    fontSize: 14,
    fontFamily: "Orbitron_400Regular",
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    color: Colors.textDim,
    fontSize: 14,
    fontFamily: "Rajdhani_500Medium",
  },
});
