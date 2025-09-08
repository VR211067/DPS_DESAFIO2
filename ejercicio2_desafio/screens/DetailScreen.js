import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, SafeAreaView } from "react-native";

const DetailScreen = ({ route }) => {
  const { platillo } = route.params;
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        <Image source={{ uri: platillo.foto }} style={styles.detailImage} />
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{platillo.nombre}</Text>
          <Text style={styles.meta}>Región: {platillo.region}</Text>
          <Text style={styles.meta}>Categoría: {platillo.categoria}</Text>
          <Text style={styles.meta}>Precio: ${platillo.precio.toFixed(2)}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.sectionText}>{platillo.descripcion}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredientes</Text>
          {platillo.ingredientes.map((ing, idx) => (
            <Text key={idx} style={styles.sectionText}>
              • {ing}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DetailScreen;

const styles = StyleSheet.create({
  detailImage: { width: "100%", height: 230 },
  detailHeader: { padding: 12 },
  detailTitle: { fontSize: 24, fontWeight: "bold", color: "#AD1457" },
  meta: { fontSize: 14, color: "#444", marginVertical: 2 },
  section: { padding: 12, borderTopWidth: 1, borderTopColor: "#F48FB1" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#E91E63" },
  sectionText: { fontSize: 15, marginVertical: 4, color: "#333" },
});
