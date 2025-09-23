import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Platform, StatusBar, Text, TouchableOpacity, View } from "react-native";

// Contexto de auth
import { AuthProvider, useAuth } from "./src/screens/login/AuthContext";

// Screens
import Login from "./src/screens/login/Login";
// Admin
import Administradores from "./src/screens/admin/Administradores";
import HomeAdmin from "./src/screens/admin/HomeAdmin";
import RegistrarSucursalesAdmin from "./src/screens/admin/RegistrarSucursalesAdmin";
import SucursalesAdmin from "./src/screens/admin/SucursalesAdmin";
import TareasAdmin from "./src/screens/admin/TareasAdmin";
// Gestor
import HomeGestor from "./src/screens/gestor/HomeGestor";
import RegistrarTareasGestor from "./src/screens/gestor/RegistrarTareasGestor";
import RegistrarUsuariosGestor from "./src/screens/gestor/RegistrarUsuariosGestor";
import UsuariosGestor from "./src/screens/gestor/UsuariosGestor";
// Técnico
import HomeTecnico from "./src/screens/tecnico/HomeTecnico";
// Shared
import PerfilShared from "./src/screens/shared/PerfilShared";
import TareasShared from "./src/screens/shared/TareasShared";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ===================== App Root ===================== */

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Gate />
      </NavigationContainer>
    </AuthProvider>
  );
}

/* ===================== Gate: Auth vs App ===================== */

function Gate() {
  const { loading, user } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  return user ? <AppStack /> : <AuthStack />;
}

/* ===================== Stacks ===================== */

// Solo login (no navega a tabs aquí; eso lo decide Gate)
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ cardStyleInterpolator: () => ({ cardStyle: { opacity: 1 } }) }}>
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// Stack principal: tabs por rol + pantallas de registro
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ cardStyleInterpolator: () => ({ cardStyle: { opacity: 1 } }) }}>
      {/* Los tabs dependen del rol */}
      <Stack.Screen name="Tabs" component={RoleTabs} options={{ headerShown: false }} />

      {/* Rutas de registro que usas desde los tabs */}
      <Stack.Screen
        name="RegistrarTareas"
        component={RegistrarTareasGestor}
        options={{
          header: ({ navigation, back }) => (
            <LinearGradient
              colors={["#87aef0", "#9c8fc4"]}
              start={{ x: 0.5, y: 0.4 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                height: 160,
                paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 40,
                paddingHorizontal: 10,
                justifyContent: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {back && (
                  <TouchableOpacity onPress={navigation.goBack} style={{ padding: 4 }}>
                    <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={{ color: "#FFFFFF", fontSize: 26, fontWeight: 900, marginTop: 10, paddingLeft: 10 }}>
                Agregar Tarea
              </Text>
            </LinearGradient>
          ),
        }}
      />
      <Stack.Screen
        name="RegistrarSucursales"
        component={RegistrarSucursalesAdmin}
        options={{
          headerTitle: "",
          headerStyle: { backgroundColor: "#618ccfff", height: 80 },
          headerTintColor: "#fff",
        }}
      />
      <Stack.Screen
        name="RegistrarUsuarios"
        component={RegistrarUsuariosGestor}
        options={{
          headerTitle: "",
          headerStyle: { backgroundColor: "#618ccfff", height: 80 },
          headerTintColor: "#fff",
        }}
      />
    </Stack.Navigator>
  );
}

/* ===================== Tabs por rol ===================== */

function RoleTabs() {
  const { profile } = useAuth(); // viene de Firestore USUARIO/{uid}

  if (profile?.rol === "Administrador") return <AdminScreens />;
  if (profile?.rol === "Gestor")       return <GestorScreens />;
  return <TecnicoScreens />; // default
}

function AdminScreens() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"       component={HomeAdmin} />
      <Tab.Screen name="Sucursales" component={SucursalesAdmin} />
      <Tab.Screen name="Tareas"     component={TareasAdmin} />
      <Tab.Screen name="Usuarios"   component={Administradores} />
      <Tab.Screen name="Profile"    component={PerfilShared} />
    </Tab.Navigator>
  );
}

function GestorScreens() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"     component={HomeGestor} />
      <Tab.Screen name="Tareas"   component={TareasShared} />
      <Tab.Screen name="Usuarios" component={UsuariosGestor} />
      <Tab.Screen name="Profile"  component={PerfilShared} />
    </Tab.Navigator>
  );
}

function TecnicoScreens() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"    component={HomeTecnico} />
      <Tab.Screen name="Tareas"  component={TareasShared} />
      <Tab.Screen name="Profile" component={PerfilShared} />
    </Tab.Navigator>
  );
}
