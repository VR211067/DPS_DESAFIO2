import "react-native-gesture-handler";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DateTimePicker from "@react-native-community/datetimepicker";

const STORAGE_KEY = "@appointments_v1";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeModel(model) {
  return model.trim().toLowerCase();
}

function sameMinute(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate() &&
    da.getHours() === db.getHours() &&
    da.getMinutes() === db.getMinutes()
  );
}

function formatDate(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt);
  }
}

const initialState = { items: [], loaded: false };

function reducer(state, action) {
  switch (action.type) {
    case "LOAD":
      return { items: action.payload, loaded: true };
    case "ADD": {
      const next = [action.payload, ...state.items];
      return { ...state, items: next };
    }
    case "UPDATE": {
      const next = state.items.map((it) =>
        it.id === action.payload.id ? action.payload : it
      );
      return { ...state, items: next };
    }
    case "REMOVE": {
      const next = state.items.filter((it) => it.id !== action.payload);
      return { ...state, items: next };
    }
    default:
      return state;
  }
}

async function saveToStorage(items) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("Error saving:", e);
  }
}

async function loadFromStorage() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Error loading:", e);
    return [];
  }
}

const Stack = createNativeStackNavigator();

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      const items = await loadFromStorage();
      dispatch({ type: "LOAD", payload: items });
    })();
  }, []);

  useEffect(() => {
    if (state.loaded) saveToStorage(state.items);
  }, [state.items, state.loaded]);

  const actions = useMemo(
    () => ({
      add: (appt) => dispatch({ type: "ADD", payload: appt }),
      update: (appt) => dispatch({ type: "UPDATE", payload: appt }),
      remove: (id) => dispatch({ type: "REMOVE", payload: id }),
    }),
    []
  );

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.purple },
          headerTintColor: "#fff",
          contentStyle: { backgroundColor: COLORS.bg },
        }}
      >
        <Stack.Screen name="Inicio" options={{ title: "Citas" }}>
          {(props) => (
            <HomeScreen {...props} items={state.items} actions={actions} />
          )}
        </Stack.Screen>
        <Stack.Screen name="Agregar" options={{ title: "Agregar Cita" }}>
          {(props) => (
            <UpsertScreen
              {...props}
              mode="add"
              items={state.items}
              onSubmit={(appt) => actions.add(appt)}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Editar" options={{ title: "Editar Cita" }}>
          {(props) => (
            <UpsertScreen
              {...props}
              mode="edit"
              items={state.items}
              onSubmit={(appt) => actions.update(appt)}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function HomeScreen({ navigation, items, actions }) {
  const { width, height } = useWindowDimensions();
  const numColumns = width > height ? 2 : 1; // 2 columnas horizontal, 1 vertical

  const confirmDelete = (id) => {
    Alert.alert(
      "Eliminar cita",
      "¿Seguro que deseas eliminar esta cita?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => actions.remove(id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Citas registradas</Text>
        <TouchableOpacity
          accessibilityLabel="Agregar cita"
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("Agregar")}
        >
          <Text style={styles.primaryBtnText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            No hay citas aún. ¡Agrega la primera!
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          key={numColumns} 
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
          renderItem={({ item }) => (
            <View style={[styles.card, { flex: 1 }]}> 
              <Text style={styles.cardTitle}>{item.clientName}</Text>
              <Text style={styles.cardLine}>Vehículo: {item.vehicleModel}</Text>
              <Text style={styles.cardLine}>Fecha/Hora: {formatDate(item.dateTime)}</Text>
              {item.description ? (
                <Text style={styles.cardDescription}>{item.description}</Text>
              ) : null}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => navigation.navigate("Editar", { id: item.id })}
                >
                  <Text style={styles.secondaryBtnText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dangerBtn}
                  onPress={() => confirmDelete(item.id)}
                >
                  <Text style={styles.dangerBtnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function UpsertScreen({ navigation, route, mode, items, onSubmit }) {
  const editingId = route.params?.id ?? null;
  const editingItem = items.find((it) => it.id === editingId) || null;

  const [clientName, setClientName] = useState(editingItem?.clientName ?? "");
  const [vehicleModel, setVehicleModel] = useState(
    editingItem?.vehicleModel ?? ""
  );
  const [description, setDescription] = useState(
    editingItem?.description ?? ""
  );
  const [date, setDate] = useState(
    editingItem ? new Date(editingItem.dateTime) : new Date(Date.now() + 5 * 60 * 1000)
  );
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  // Merge date + time updates from the pickers
  const onChangeDate = (event, selectedDate) => {
    setShowDate(false);
    if (selectedDate) {
      const d = new Date(date);
      d.setFullYear(selectedDate.getFullYear());
      d.setMonth(selectedDate.getMonth());
      d.setDate(selectedDate.getDate());
      setDate(d);
    }
  };

  const onChangeTime = (event, selectedTime) => {
    setShowTime(false);
    if (selectedTime) {
      const d = new Date(date);
      d.setHours(selectedTime.getHours());
      d.setMinutes(selectedTime.getMinutes());
      d.setSeconds(0);
      d.setMilliseconds(0);
      setDate(d);
    }
  };

  const validate = () => {
    const nameOk = clientName.trim().length >= 3;
    if (!nameOk) return { ok: false, msg: "El nombre debe tener al menos 3 caracteres." };

    const now = new Date();
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return { ok: false, msg: "Selecciona una fecha y hora válidas." };
    }
    if (date <= now) {
      return { ok: false, msg: "La fecha y hora deben ser posteriores al momento actual." };
    }

    // Duplicados: misma fecha/hora y mismo modelo de vehículo
    const normalized = normalizeModel(vehicleModel);
    const exists = items.some((it) => {
      if (editingId && it.id === editingId) return false; 
      return normalizeModel(it.vehicleModel) === normalized && sameMinute(it.dateTime, date);
    });
    if (exists) {
      return { ok: false, msg: "Ya existe una cita para ese vehículo en esa fecha/hora." };
    }

    return { ok: true };
  };

  const handleSubmit = () => {
    const v = validate();
    if (!v.ok) {
      Alert.alert("Validación", v.msg);
      return;
    }

    const payload = {
      id: editingItem?.id ?? uid(),
      clientName: clientName.trim(),
      vehicleModel: vehicleModel.trim(),
      description: description.trim(),
      dateTime: date.toISOString(),
    };

    onSubmit(payload);
    navigation.goBack();
  };

  const headerText = mode === "add" ? "Nueva cita" : "Editar cita";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.formContainer}>
        <Text style={styles.formHeader}>{headerText}</Text>

        <FormField label="Nombre del cliente" required>
          <TextInput
            placeholder="Ej. Juan Pérez"
            value={clientName}
            onChangeText={setClientName}
            style={styles.input}
            maxLength={100}
          />
          <HelpText>Al menos 3 caracteres.</HelpText>
        </FormField>

        <FormField label="Modelo del vehículo" required>
          <TextInput
            placeholder="Ej. Toyota Corolla 2016"
            value={vehicleModel}
            onChangeText={setVehicleModel}
            style={styles.input}
            maxLength={120}
          />
        </FormField>

        <FormField label="Fecha y hora" required>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={() => setShowDate(true)}>
              <Text style={styles.secondaryBtnText}>Seleccionar fecha</Text>
            </TouchableOpacity>
            <View style={{ width: 8 }} />
            <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={() => setShowTime(true)}>
              <Text style={styles.secondaryBtnText}>Seleccionar hora</Text>
            </TouchableOpacity>
          </View>
          <HelpText>Actual: {formatDate(date)}</HelpText>

          {showDate && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={onChangeDate}
              minimumDate={new Date()}
            />
          )}
          {showTime && (
            <DateTimePicker
              value={date}
              mode="time"
              is24Hour
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onChangeTime}
            />
          )}
        </FormField>

        <FormField label="Descripción (opcional)">
          <TextInput
            placeholder="Describe el problema brevemente"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, { height: 100, textAlignVertical: "top" }]}
            multiline
            maxLength={500}
          />
        </FormField>

        <View style={{ height: 8 }} />
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
          <Text style={styles.primaryBtnText}>
            {mode === "add" ? "Guardar cita" : "Guardar cambios"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function FormField({ label, children, required }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>
        {label} {required ? <Text style={{ color: COLORS.orange }}>*</Text> : null}
      </Text>
      {children}
    </View>
  );
}

function HelpText({ children }) {
  return <Text style={styles.help}>{children}</Text>;
}

/*Styles */
const COLORS = {
  bg: "#0f0f12",
  card: "#1a1b20",
  purple: "#6D28D9", 
  orange: "#F97316", 
  text: "#F3F4F6",
  muted: "#9CA3AF",
  danger: "#EF4444",
};

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2b33",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardLine: {
    color: COLORS.text,
    opacity: 0.9,
    marginBottom: 4,
  },
  cardDescription: {
    color: COLORS.muted,
    marginTop: 4,
    fontStyle: "italic",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  primaryBtn: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  dangerBtn: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  dangerBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  formContainer: {
    padding: 16,
    gap: 8,
  },
  formHeader: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  label: {
    color: COLORS.text,
    marginBottom: 6,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#111217",
    borderColor: "#2a2b33",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
  },
  help: {
    color: COLORS.muted,
    marginTop: 6,
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
