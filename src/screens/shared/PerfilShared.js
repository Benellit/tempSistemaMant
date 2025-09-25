import { useEffect, useState } from "react";
import { Button, StyleSheet, Switch, Text, View } from "react-native";
import { useAuth } from "../login/AuthContext";

export default function PerfilShared({ navigation }) {
  const { logout, profile, updateProfile } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);

  // Inicializar el switch según profile.modoOscuro
  useEffect(() => {
    if (profile) {
      setIsEnabled(profile.modoOscuro);
    }
  }, [profile]);

  const toggleSwitch = async (value) => {
    setIsEnabled(value);
    if (profile) {
      await updateProfile({ ...profile, modoOscuro: value });
    }
  };

  if (!profile) return null; // opcional: mostrar loader o pantalla vacía mientras carga

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil Shared</Text>

      <Text>Email: {profile.email}</Text>
      <Text>Rol: {profile.rol}</Text>

      <View style={styles.modoContainer}>
        <Text>{isEnabled ? "Modo Claro" : "Modo Oscuro"}</Text>
        <Switch
          value={isEnabled}
          onValueChange={toggleSwitch}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
        />
      </View>

      <View style={styles.logoutBtn}>
        <Button title="Cerrar sesión" color="#d9534f" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: "600",
  },
  logoutBtn: {
    marginTop: 30,
  },
  modoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
});
