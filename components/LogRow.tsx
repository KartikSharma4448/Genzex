import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import type { Connection } from "@shared/schema";

const THREAT_CONFIG = {
  SAFE: { color: Colors.green, dim: Colors.greenDim, icon: "shield-check" as const },
  SUSPICIOUS: { color: Colors.yellow, dim: Colors.yellowDim, icon: "shield-alert" as const },
  MALICIOUS: { color: Colors.red, dim: Colors.redDim, icon: "shield-off" as const },
};

export function LogRow({ item }: { item: Connection }) {
  const config = THREAT_CONFIG[item.threatLevel];
  const time = new Date(item.timestamp);
  const dateStr = `${time.getMonth() + 1}/${time.getDate()} ${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}:${time.getSeconds().toString().padStart(2, "0")}`;
  const confidencePercent = item.confidence ? Math.round(item.confidence * 100) : 0;

  return (
    <View style={[styles.row, { borderLeftColor: item.blocked ? Colors.textDim : config.color }]}>
      <View style={[styles.iconWrap, { backgroundColor: item.blocked ? Colors.redDim : config.dim }]}>
        <MaterialCommunityIcons name={item.blocked ? "cancel" : config.icon} size={16} color={item.blocked ? Colors.red : config.color} />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.appName, item.blocked && { textDecorationLine: "line-through", color: Colors.textDim }]} numberOfLines={1}>{item.appName}</Text>
          <View style={styles.threatRow}>
            {item.blocked ? (
              <View style={styles.blockedBadge}>
                <Text style={styles.blockedBadgeText}>BLOCKED</Text>
              </View>
            ) : null}
            <Text style={[styles.threat, { color: config.color }]}>{item.threatLevel}</Text>
          </View>
        </View>
        <Text style={styles.ip}>{item.ipAddress}:{item.port}</Text>
        <View style={styles.bottomRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.protocol}</Text>
          </View>
          {confidencePercent > 0 ? (
            <View style={[styles.confBadge, { backgroundColor: config.dim }]}>
              <MaterialCommunityIcons name="brain" size={9} color={config.color} />
              <Text style={[styles.confText, { color: config.color }]}>{confidencePercent}%</Text>
            </View>
          ) : null}
          <Text style={styles.timestamp}>{dateStr}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  appName: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: "Rajdhani_600SemiBold",
    flex: 1,
  },
  threatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  threat: {
    fontSize: 10,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.5,
  },
  blockedBadge: {
    backgroundColor: Colors.redDim,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  blockedBadgeText: {
    color: Colors.red,
    fontSize: 8,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.5,
  },
  ip: {
    color: Colors.cyan,
    fontSize: 12,
    fontFamily: "Orbitron_400Regular",
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.cyanDim,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagText: {
    color: Colors.cyan,
    fontSize: 10,
    fontFamily: "Rajdhani_600SemiBold",
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
  timestamp: {
    color: Colors.textDim,
    fontSize: 11,
    fontFamily: "Rajdhani_500Medium",
  },
});
