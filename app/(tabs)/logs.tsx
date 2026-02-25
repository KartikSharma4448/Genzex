import { StyleSheet, Text, View, FlatList, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useNetwork } from "@/contexts/NetworkContext";
import { LogRow } from "@/components/LogRow";

const FILTERS = ["ALL", "SAFE", "SUSPICIOUS", "MALICIOUS", "BLOCKED"];

const FILTER_COLORS: Record<string, string> = {
  ALL: Colors.cyan,
  SAFE: Colors.green,
  SUSPICIOUS: Colors.yellow,
  MALICIOUS: Colors.red,
  BLOCKED: Colors.textSecondary,
};

const FILTER_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  ALL: "format-list-bulleted",
  SAFE: "shield-check",
  SUSPICIOUS: "shield-alert",
  MALICIOUS: "shield-off",
  BLOCKED: "cancel",
};

export default function LogsScreen() {
  const insets = useSafeAreaInsets();
  const { logs, logFilter, setLogFilter, stats } = useNetwork();
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  const renderHeader = () => (
    <View>
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTopPad }]}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="file-document-outline" size={22} color={Colors.cyan} />
          <Text style={styles.title}>TRAFFIC LOGS</Text>
        </View>
        <View style={styles.countWrap}>
          <Text style={styles.countLabel}>{logs.length} entries</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const isActive = logFilter === f;
          const color = FILTER_COLORS[f];
          return (
            <Pressable
              key={f}
              onPress={() => setLogFilter(f)}
              style={[
                styles.filterBtn,
                isActive && { backgroundColor: color + "22", borderColor: color },
              ]}
            >
              <MaterialCommunityIcons name={FILTER_ICONS[f]} size={12} color={isActive ? color : Colors.textDim} />
              <Text style={[styles.filterText, { color: isActive ? color : Colors.textDim }]}>
                {f}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {stats.modelActive ? (
        <View style={styles.aiInfoBar}>
          <MaterialCommunityIcons name="brain" size={12} color={Colors.cyan} />
          <Text style={styles.aiInfoText}>AI-classified</Text>
          <Text style={styles.aiInfoDot}>|</Text>
          <Text style={styles.aiInfoText}>Avg confidence: {Math.round(stats.avgConfidence * 100)}%</Text>
          {stats.blocked > 0 ? (
            <>
              <Text style={styles.aiInfoDot}>|</Text>
              <Text style={[styles.aiInfoText, { color: Colors.red }]}>{stats.blocked} blocked</Text>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <LogRow item={item} />}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === "web" ? 84 : 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="file-search-outline" size={40} color={Colors.textDim} />
            <Text style={styles.emptyText}>No logs found</Text>
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
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 2,
  },
  countWrap: {
    backgroundColor: Colors.cyanDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countLabel: {
    color: Colors.cyan,
    fontSize: 11,
    fontFamily: "Rajdhani_600SemiBold",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  filterText: {
    fontSize: 10,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.5,
  },
  aiInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  aiInfoText: {
    color: Colors.cyan,
    fontSize: 11,
    fontFamily: "Rajdhani_500Medium",
  },
  aiInfoDot: {
    color: Colors.textDim,
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: 16,
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
