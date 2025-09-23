import { StyleSheet, Text, View, Button } from 'react-native';
import { useAuth } from '../login/AuthContext'; 

export default function PerfilShared({ navigation }) {
  const { logout, user, profile } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil Shared</Text>

      {profile && (
        <>
          <Text>Email: {profile.email}</Text>
          <Text>Rol: {profile.rol}</Text>
        </>
      )}

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
});
