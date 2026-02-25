import { View, Text, StyleSheet } from "react-native";
import { useEffect } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, FadeIn } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import type { Connection } from "@shared/schema";

const THREAT_CONFIG = {
  SAFE: { color: Colors.green, glow: Colors.greenGlow, dim: Colors.greenDim, icon: "shield-check" as const },
  SUSPICIOUS: { color: Colors.yellow, glow: Colors.yellowGlow, dim: Colors.yellowDim, icon: "shield-alert" as const },
  MALICIOUS: { color: Colors.red, glow: Colors.redGlow, dim: Colors.redDim, icon: "shield-off" as const },
};

export function ConnectionRow({ item }: { item: Connection }) {
  const config = THREAT_CONFIG[item.threatLevel];
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (item.threatLevel === "MALICIOUS") {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        false
      );
    } else if (item.threatLevel === "SUSPICIOUS") {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1200 }),
          withTiming(0.4, { duration: 1200 })
        ),
        -1,
        false
      );
    }
  }, [item.threatLevel, pulseOpacity]);

  const badgeGlow = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const time = new Date(item.timestamp);
  const timeStr = `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}:${time.getSeconds().toString().padStart(2, "0")}`;
  const confidencePercent = item.confidence ? Math.round(item.confidence * 100) : 0;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[styles.row, { borderLeftColor: item.blocked ? Colors.textDim : config.color }, item.blocked && styles.blockedRow]}>
      <View style={styles.leftSection}>
        <View style={styles.appRow}>
          <MaterialCommunityIcons name="application" size={14} color={item.blocked ? Colors.textDim : Colors.cyan} />
          <Text style={[styles.appName, item.blocked && { color: Colors.textDim }]} numberOfLines={1}>{item.appName}</Text>
          {item.blocked ? (
            <View style={styles.blockedTag}>
              <MaterialCommunityIcons name="cancel" size={10} color={Colors.red} />
              <Text style={styles.blockedText}>BLOCKED</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.ip, item.blocked && { color: Colors.textDim }]}>{item.ipAddress}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.tag, item.blocked && { backgroundColor: Colors.redDim }]}>
            <Text style={[styles.tagText, item.blocked && { color: Colors.red }]}>{item.protocol}</Text>
          </View>
          <Text style={styles.port}>:{item.port}</Text>
          <Text style={styles.time}>{timeStr}</Text>
          {confidencePercent > 0 ? (
            <View style={[styles.confBadge, { backgroundColor: config.dim }]}>
              <MaterialCommunityIcons name="brain" size={9} color={config.color} />
              <Text style={[styles.confText, { color: config.color }]}>{confidencePercent}%</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Animated.View style={[styles.badge, { backgroundColor: config.dim }, badgeGlow]}>
        <MaterialCommunityIcons name={config.icon} size={14} color={config.color} />
        <Text style={[styles.badgeText, { color: config.color }]}>{item.threatLevel}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  blockedRow: {
    opacity: 0.6,
    borderStyle: "dashed",
  },
  leftSection: {
    flex: 1,
    marginRight: 10,
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  appName: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Rajdhani_600SemiBold",
    flex: 1,
  },
  blockedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.redDim,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  blockedText: {
    color: Colors.red,
    fontSize: 8,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.5,
  },
  ip: {
    color: Colors.cyan,
    fontSize: 13,
    fontFamily: "Orbitron_400Regular",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.cyanDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: Colors.cyan,
    fontSize: 10,
    fontFamily: "Rajdhani_600SemiBold",
  },
  port: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: "Rajdhani_500Medium",
  },
  time: {
    color: Colors.textDim,
    fontSize: 11,
    fontFamily: "Rajdhani_500Medium",
  },
  confBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  confText: {
    fontSize: 9,
    fontFamily: "Rajdhani_700Bold",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.5,
  },
});
