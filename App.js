import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "./src/screens/login/Login";

// TODAS LAS PANTALLAS
// Admin
import Administradores from "./src/screens/admin/Administradores";
import HomeAdmin from "./src/screens/admin/HomeAdmin";
import RegistrarSucursalesAdmin from "./src/screens/admin/RegistrarSucursalesAdmin";
import SucursalesAdmin from "./src/screens/admin/SucursalesAdmin";
// Gestor
import HomeGestor from "./src/screens/gestor/HomeGestor";
import RegistrarTareasGestor from "./src/screens/gestor/RegistrarTareasGestor";
import RegistrarUsuariosGestor from "./src/screens/gestor/RegistrarUsuariosGestor";
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
      <Stack.Navigator initialRouteName="Login" screenOptions={{
        cardStyleInterpolator: () => ({ cardStyle: { opacity: 1 } })
      }}>
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="AdminTabs" component={AdminScreens} options={{ headerShown: false }} />
        <Stack.Screen name="GestorTabs" component={GestorScreens} options={{ headerShown: false }} />
        <Stack.Screen name="TecnicoTabs" component={TecnicoScreens} options={{ headerShown: false }} />
        <Stack.Screen name="RegistrarTareas" component={RegistrarTareasGestor} options={{
          headerTitle: "",
          headerStyle: {
            backgroundColor: "#618ccfff",
            height: 80,
          },
          headerTintColor: "#fff",
        }} />
        <Stack.Screen name="RegistrarSucursales" component={RegistrarSucursalesAdmin}
          options={{
            headerTitle: "",
            headerStyle: {
              backgroundColor: "#618ccfff", // cambiar el color :)
              height: 80,
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen name="RegistrarUsuarios" component={RegistrarUsuariosGestor}
          options={{
            headerTitle: "",
            headerStyle: {
              backgroundColor: "#618ccfff", // cambiar el color :)
              height: 80,
            },
            headerTintColor: "#fff",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AdminScreens() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeAdmin} />
      <Tab.Screen name="Sucursales" component={SucursalesAdmin} />
      <Tab.Screen name="Admins" component={Administradores} />
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
