import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found", headerShown: false }} />
      <View style={styles.container}>
        <MaterialCommunityIcons name="shield-off-outline" size={48} color={Colors.red} />
        <Text style={styles.title}>Route Not Found</Text>
        <Link href="/(tabs)" style={styles.link}>
          <Text style={styles.linkText}>Return to Dashboard</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.background,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: "Rajdhani_600SemiBold",
    color: Colors.text,
  },
  link: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.cyanDim,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cyan,
  },
  linkText: {
    fontSize: 14,
    color: Colors.cyan,
    fontFamily: "Orbitron_400Regular",
  },
});
