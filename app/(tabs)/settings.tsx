import { StyleSheet, Text, View, Switch, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useNetwork } from "@/contexts/NetworkContext";

interface SettingRowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onToggle: (val: boolean) => void;
  color: string;
}

function SettingRow({ icon, title, description, value, onToggle, color }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: color + "22" }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.surfaceLight, true: color + "66" }}
        thumbColor={value ? color : Colors.textDim}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSetting, modelStatus, stats } = useNetwork();
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const modelPulse = useSharedValue(0.4);

  useEffect(() => {
    if (modelStatus?.loaded) {
      modelPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000 }),
          withTiming(0.4, { duration: 2000 })
        ),
        -1,
        false
      );
    }
  }, [modelStatus?.loaded, modelPulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: modelPulse.value,
  }));

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 + webTopPad, paddingBottom: Platform.OS === "web" ? 84 : 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons name="cog" size={22} color={Colors.cyan} />
        <Text style={styles.title}>SETTINGS</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SECURITY CONTROLS</Text>
        <View style={styles.card}>
          <SettingRow
            icon="radar"
            title="Network Monitoring"
            description="Scan and track all active network connections in real-time"
            value={settings.monitoringEnabled}
            onToggle={(val) => updateSetting("monitoringEnabled", val)}
            color={Colors.cyan}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="brain"
            title="AI Threat Detection"
            description="GenzexNet neural model for threat classification"
            value={settings.threatDetectionEnabled}
            onToggle={(val) => updateSetting("threatDetectionEnabled", val)}
            color={Colors.yellow}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="wall"
            title="Firewall Mode"
            description="Auto-block all malicious connections detected by AI"
            value={settings.firewallMode}
            onToggle={(val) => updateSetting("firewallMode", val)}
            color={Colors.red}
          />
        </View>
      </View>

      {modelStatus ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AI MODEL STATUS</Text>
          <View style={[styles.card, styles.modelCard]}>
            <View style={styles.modelHeader}>
              <View style={styles.modelIconWrap}>
                <Animated.View style={[styles.modelGlow, pulseStyle]} />
                <MaterialCommunityIcons name="brain" size={24} color={modelStatus.loaded ? Colors.cyan : Colors.textDim} />
              </View>
              <View style={styles.modelInfo}>
                <Text style={styles.modelName}>{modelStatus.name}</Text>
                <View style={styles.modelStatusRow}>
                  <View style={[styles.statusDot, { backgroundColor: modelStatus.loaded ? Colors.green : Colors.red }]} />
                  <Text style={[styles.modelStatusText, { color: modelStatus.loaded ? Colors.green : Colors.red }]}>
                    {modelStatus.loaded ? "LOADED" : "OFFLINE"}
                  </Text>
                </View>
              </View>
              <View style={[styles.versionBadge, { borderColor: modelStatus.loaded ? Colors.cyan : Colors.textDim }]}>
                <Text style={[styles.versionText, { color: modelStatus.loaded ? Colors.cyan : Colors.textDim }]}>v{modelStatus.version}</Text>
              </View>
            </View>

            <View style={styles.modelStats}>
              <ModelStat label="Size" value={formatBytes(modelStatus.size)} icon="memory" color={Colors.cyan} />
              <ModelStat label="Inferences" value={modelStatus.totalInferences.toLocaleString()} icon="chart-line" color={Colors.green} />
              <ModelStat label="Avg Latency" value={`${modelStatus.avgLatency}ms`} icon="timer-outline" color={Colors.yellow} />
              <ModelStat label="Accuracy" value={`${modelStatus.accuracy}%`} icon="target" color={Colors.cyan} />
            </View>

            {stats.avgConfidence > 0 ? (
              <View style={styles.confidenceBar}>
                <Text style={styles.confidenceLabel}>Live Confidence</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.round(stats.avgConfidence * 100)}%` }]} />
                </View>
                <Text style={styles.confidenceValue}>{Math.round(stats.avgConfidence * 100)}%</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SYSTEM INFO</Text>
        <View style={styles.card}>
          <InfoRow label="App Version" value="1.0.0" />
          <View style={styles.divider} />
          <InfoRow label="Engine" value="GX Neural Core" />
          <View style={styles.divider} />
          <InfoRow label="Model" value={modelStatus?.loaded ? modelStatus.name : "Not loaded"} />
          <View style={styles.divider} />
          <InfoRow label="Classification" value={settings.threatDetectionEnabled ? "AI-Powered" : "Disabled"} />
          <View style={styles.divider} />
          <InfoRow label="Blocked Threats" value={stats.blocked.toString()} />
        </View>
      </View>

      <View style={styles.footerCard}>
        <MaterialCommunityIcons name="shield-check" size={16} color={Colors.green} />
        <Text style={styles.footerText}>
          GenzexNet AI model is actively classifying network threats using neural network inference. Firewall mode will automatically block malicious connections.
        </Text>
      </View>
    </ScrollView>
  );
}

function ModelStat({ label, value, icon, color }: { label: string; value: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }) {
  return (
    <View style={styles.modelStatItem}>
      <MaterialCommunityIcons name={icon} size={14} color={color} />
      <Text style={styles.modelStatValue}>{value}</Text>
      <Text style={styles.modelStatLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: "Orbitron_400Regular",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  modelCard: {
    padding: 16,
  },
  modelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  modelIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.cyanDim,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  modelGlow: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.cyanGlow,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: "Rajdhani_700Bold",
  },
  modelStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modelStatusText: {
    fontSize: 10,
    fontFamily: "Orbitron_400Regular",
    letterSpacing: 1,
  },
  versionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  versionText: {
    fontSize: 10,
    fontFamily: "Orbitron_400Regular",
  },
  modelStats: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  modelStatItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 4,
  },
  modelStatValue: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: "Orbitron_700Bold",
  },
  modelStatLabel: {
    color: Colors.textDim,
    fontSize: 9,
    fontFamily: "Rajdhani_500Medium",
  },
  confidenceBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  confidenceLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: "Rajdhani_500Medium",
    width: 90,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    backgroundColor: Colors.cyan,
    borderRadius: 3,
  },
  confidenceValue: {
    color: Colors.cyan,
    fontSize: 12,
    fontFamily: "Orbitron_700Bold",
    width: 40,
    textAlign: "right",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: "Rajdhani_600SemiBold",
    marginBottom: 2,
  },
  settingDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: "Rajdhani_500Medium",
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: "Rajdhani_500Medium",
  },
  infoValue: {
    color: Colors.cyan,
    fontSize: 13,
    fontFamily: "Orbitron_400Regular",
  },
  footerCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  footerText: {
    color: Colors.textDim,
    fontSize: 12,
    fontFamily: "Rajdhani_500Medium",
    lineHeight: 18,
    flex: 1,
  },
});
