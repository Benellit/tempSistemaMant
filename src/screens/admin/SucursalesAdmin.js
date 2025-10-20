import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from "expo-linear-gradient";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BotonRegistrar from '../../components/BotonRegistrar';
import appFirebase from '../../credenciales/Credenciales';
import { useAuth } from "../login/AuthContext";

const db = getFirestore(appFirebase);

export default function SucursalesAdmin({ navigation }) {
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const { profile } = useAuth();
    const [busqueda, setBusqueda] = useState("");
    const [sucursales, setSucursales] = useState([]);

    // Cargar sucursales
    const cargarSucursales = async () => {
        try {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, "SUCURSAL"));
            const sucursalesData = [];
            
            querySnapshot.forEach((doc) => {
                sucursalesData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Ordenar por fecha de creación (más reciente primero)
            sucursalesData.sort((a, b) => {
                if (a.fechaCreacion && b.fechaCreacion) {
                    return b.fechaCreacion.toDate() - a.fechaCreacion.toDate();
                }
                return 0;
            });
            
            setSucursales(sucursalesData);
        } catch (error) {
            console.error("Error al cargar sucursales:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarSucursales();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await cargarSucursales();
        setRefreshing(false);
    };

    // Filtrar sucursales según búsqueda
    const sucursalesFiltradas = sucursales.filter(sucursal => 
        sucursal.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        sucursal.dirColonia?.toLowerCase().includes(busqueda.toLowerCase()) ||
        sucursal.dirCalle?.toLowerCase().includes(busqueda.toLowerCase())
    );

    // Formatear fecha
    const formatearFecha = (fecha) => {
        if (!fecha) return "Sin fecha";
        const date = fecha.toDate();
        return date.toLocaleDateString('es-MX', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
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
                        <Text style={profile.modoOscuro === true ? styles.tituloClaro : styles.tituloOscuro}>Sucursales</Text>
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
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#fff" />
                            <Text style={styles.loadingText}>Cargando sucursales...</Text>
                        </View>
                    ) : (
                        <ScrollView
                            contentContainerStyle={{ padding: 20 }}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                            }
                        >
                            {sucursalesFiltradas.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="business-outline" size={60} color="#fff" />
                                    <Text style={styles.emptyText}>
                                        {busqueda ? "No se encontraron sucursales" : "No hay sucursales registradas"}
                                    </Text>
                                </View>
                            ) : (
                                sucursalesFiltradas.map((sucursal) => (
                                    <TouchableOpacity 
                                        key={sucursal.id} 
                                        style={styles.card}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.cardHeader}>
                                            <View style={styles.iconContainer}>
                                                <Ionicons name="business" size={24} color="#87aef0" />
                                            </View>
                                            <View style={styles.cardHeaderText}>
                                                <Text style={styles.cardTitle}>{sucursal.nombre}</Text>
                                                <Text style={styles.cardDate}>
                                                    Creada: {formatearFecha(sucursal.fechaCreacion)}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.cardBody}>
                                            <View style={styles.infoRow}>
                                                <Ionicons name="location-outline" size={16} color="#666" />
                                                <Text style={styles.infoText}>
                                                    {sucursal.dirCalle}, {sucursal.dirColonia}
                                                </Text>
                                            </View>
                                            <View style={styles.infoRow}>
                                                <Ionicons name="mail-outline" size={16} color="#666" />
                                                <Text style={styles.infoText}>CP: {sucursal.dirCP}</Text>
                                            </View>
                                            <View style={styles.infoRow}>
                                                <Ionicons name="person-outline" size={16} color="#666" />
                                                <Text style={styles.infoText}>
                                                    Creador ID: {sucursal.IDCreador}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    )}
                </View>
                <BotonRegistrar />
            </View>
        </LinearGradient>
    );
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
        fontWeight: "900",
        marginTop: 10,
    },
    tituloOscuro: {
        color: "white",
        fontSize: 26,
        fontWeight: "900",
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        color: "#fff",
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 100,
    },
    emptyText: {
        marginTop: 20,
        color: "#fff",
        fontSize: 18,
        textAlign: "center",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#f0f5ff",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    cardHeaderText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 4,
    },
    cardDate: {
        fontSize: 12,
        color: "#999",
    },
    cardBody: {
        gap: 8,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        color: "#666",
        flex: 1,
    },
});