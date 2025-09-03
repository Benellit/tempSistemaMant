import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "./src/screens/login/Login";

// TODAS LAS PANTALLAS
  // Admin
  import HomeAdmin from "./src/screens/admin/HomeAdmin";
  import SucursalesAdmin from "./src/screens/admin/SucursalesAdmin";
  // Gestor
  import HomeGestor from "./src/screens/gestor/HomeGestor";
  import UsuariosGestor from "./src/screens/gestor/UsuariosGestor";
  // Tecnico
  import HomeTecnico from "./src/screens/tecnico/HomeTecnico";
  // Shared
  import PerfilShared from "./src/screens/shared/PerfilShared";
  import TareasShared from "./src/screens/shared/TareasShared";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="AdminTabs" component={AdminScreens} />
        <Stack.Screen name="GestorTabs" component={GestorScreens} />
        <Stack.Screen name="TecnicoTabs" component={TecnicoScreens} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AdminScreens() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeAdmin} />
      <Tab.Screen name="Sucursales" component={SucursalesAdmin} />
      <Tab.Screen name="Profile" component={PerfilShared} />
    </Tab.Navigator>
  );
}

function GestorScreens() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeGestor} />
      <Tab.Screen name="Tareas" component={TareasShared} />
      <Tab.Screen name="Usuarios" component={UsuariosGestor} />
      <Tab.Screen name="Profile" component={PerfilShared} />
    </Tab.Navigator>
  );
}

function TecnicoScreens() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeTecnico} />
      <Tab.Screen name="Tareas" component={TareasShared} />
      <Tab.Screen name="Profile" component={PerfilShared} />
    </Tab.Navigator>
  );
}
