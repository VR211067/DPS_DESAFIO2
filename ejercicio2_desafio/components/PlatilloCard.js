import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

const PlatilloCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    <Image source={{ uri: item.foto }} style={styles.cardImage} />
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.nombre}
      </Text>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {item.descripcion}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.price}>${item.precio.toFixed(2)}</Text>
        <Text style={styles.category}>{item.categoria}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default PlatilloCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 8,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F8BBD0",
  },
  cardImage: { width: 100, height: 100 },
  cardContent: { flex: 1, padding: 10 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#880E4F" },
  cardDesc: { fontSize: 13, color: "#555", marginTop: 4 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  price: { color: "#D81B60", fontWeight: "bold" },
  category: { fontSize: 12, color: "#6A1B9A" },
});
