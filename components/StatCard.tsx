import { View, Text, StyleSheet } from "react-native";
import { useEffect } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface StatCardProps {
  title: string;
  value: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  glowColor: string;
}

export function StatCard({ title, value, icon, color, glowColor }: StatCardProps) {
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      false
    );
  }, [pulseOpacity]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={[styles.card, { borderColor: glowColor }]}>
      <Animated.View style={[styles.glowOverlay, { backgroundColor: glowColor }, glowStyle]} />
      <View style={styles.iconRow}>
        <View style={[styles.iconContainer, { backgroundColor: glowColor }]}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.value, { color }]}>{value}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    overflow: "hidden",
    minWidth: 0,
  },
  glowOverlay: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 24,
    fontFamily: "Orbitron_700Bold",
  },
  title: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: "Rajdhani_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
