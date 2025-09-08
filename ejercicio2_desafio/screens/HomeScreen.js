import React from "react";
import { FlatList, Text, StyleSheet, SafeAreaView, useWindowDimensions } from "react-native";
import PlatilloCard from "../components/PlatilloCard";
import { PLATILLOS } from "./data";

const HomeScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const numColumns = isLandscape ? 2 : 1;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text style={styles.header}>Platillos Típicos</Text>
      <FlatList
        data={PLATILLOS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlatilloCard
            item={item}
            onPress={() => navigation.navigate("Detail", { platillo: item })}
          />
        )}
        numColumns={numColumns}
        key={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.rowWrapper : null}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  header: {
    fontSize: 26,
    fontWeight: "bold",
    margin: 14,
    color: "#E91E63",
  },
  rowWrapper: { justifyContent: "space-between" },
});
