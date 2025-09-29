import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BotonRegistrar from '../../components/BotonRegistrar';
import { useAuth } from "../login/AuthContext";

const UsuariosGestor = ({ navigation }) => {
    const [busqueda, setBusqueda] = useState("")
    const { profile } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 2000); // Simula carga de datos
    };

    return (
        <LinearGradient
            colors={["#87aef0", "#9c8fc4"]}
            start={{ x: 0.5, y: 0.4 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1 }}
        >
            <View style={{ flex: 1 }}>
                {/* Header */}
                <View style={profile.modoOscuro === true ? styles.headerClaro : styles.headerOscuro}>
                    <View>
                        <Text style={profile.modoOscuro === true ? styles.tituloClaro : styles.tituloOscuro}>Usuarios</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ marginBottom: 0, marginTop: 5, flex: 1 }}>
                            <TextInput
                                placeholder="Buscar"
                                placeholderTextColor={profile.modoOscuro === true ? "black" : "#FFFF"}
                                style={styles.inputBusqueda}
                                value={busqueda}
                                onChangeText={setBusqueda}
                            />
                            <View style={{ position: "absolute", right: 15, top: 14 }}>
                                <FontAwesome6 name="magnifying-glass" size={18} color={profile.modoOscuro === true ? "black" : "#FFFF"} />
                            </View>
                        </View>
                        <View style={{ marginTop: 5, justifyContent: "center", alignContent: "center" }}>
                            <TouchableOpacity style={styles.opciones}>
                                <Ionicons name="options-outline" size={22} color={profile.modoOscuro === true ? "black" : "#FFFF"} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                <View style={styles.container}>
                    <ScrollView
                        contentContainerStyle={{ padding: 20 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    >

                    </ScrollView>
                </View>
                <BotonRegistrar />
            </View>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerClaro: {
        paddingTop: 15,
        paddingHorizontal: 15,
        paddingBottom: 10,
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
        borderBottomWidth: 2,
        borderColor: "#D9D9D9"
    },
    headerOscuro: {
        paddingTop: 15,
        paddingHorizontal: 15,
        paddingBottom: 10,
        backgroundColor: "#2C2C2C",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
        borderBottomWidth: 2,
        borderColor: "#D9D9D9"
    },
    tituloClaro: {
        color: "black",
        fontSize: 26,
        fontWeight: 900,
        marginTop: 10,
    },
    tituloOscuro: {
        color: "white",
        fontSize: 26,
        fontWeight: 900,
        marginTop: 10,
    },
    titulo: {
        color: "black",
        fontSize: 26,
        fontWeight: 900,
        marginTop: 10,
    },
    inputBusqueda: {
        paddingLeft: 15,
        borderRadius: 20,
        borderColor: "#D9D9D9",
        borderWidth: 2,
        fontSize: 16,
    },
    opciones: {
        padding: 10,
        borderRadius: 9,
        borderColor: "#D9D9D9",
        borderWidth: 2,
    },
});

export default UsuariosGestor