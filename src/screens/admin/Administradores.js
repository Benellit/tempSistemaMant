import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from "expo-linear-gradient";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BotonRegistrar from '../../components/BotonRegistrar';
import appFirebase from '../../credenciales/Credenciales';
import { useAuth } from "../login/AuthContext";

const db = getFirestore(appFirebase);

const UsuariosGestor = ({ navigation }) => {
    const [busqueda, setBusqueda] = useState("");
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const { profile } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    // Función para obtener usuarios de Firebase
    const obtenerUsuarios = async () => {
        try {
            const usuariosRef = collection(db, 'USUARIO');
            const snapshot = await getDocs(usuariosRef);
            const usuariosData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsuarios(usuariosData);
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        obtenerUsuarios();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await obtenerUsuarios();
        setRefreshing(false);
    };

    // Filtrar usuarios por búsqueda
    const usuariosFiltrados = usuarios.filter(usuario => {
        const nombreCompleto = `${usuario.primerNombre || ''} ${usuario.segundoNombre || ''} ${usuario.primerApellido || ''} ${usuario.segundoApellido || ''}`.toLowerCase();
        const termino = busqueda.toLowerCase();
        return nombreCompleto.includes(termino) || 
               usuario.email?.toLowerCase().includes(termino) ||
               usuario.rol?.toLowerCase().includes(termino);
    });

    // Navegar al perfil del usuario seleccionado
    const verPerfilUsuario = (usuario) => {
        navigation.navigate('PerfilUsuarioShared', { userId: usuario.id });
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
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#fff" />
                                <Text style={styles.loadingText}>Cargando usuarios...</Text>
                            </View>
                        ) : usuariosFiltrados.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    {busqueda ? "No se encontraron usuarios" : "No hay usuarios registrados"}
                                </Text>
                            </View>
                        ) : (
                            usuariosFiltrados.map((usuario) => (
                                <TouchableOpacity 
                                    key={usuario.id} 
                                    style={profile.modoOscuro === true ? styles.tarjetaClaro : styles.tarjetaOscuro}
                                    onPress={() => verPerfilUsuario(usuario)}
                                >
                                    <Image 
                                        source={{ uri: usuario.fotoPerfil || 'https://via.placeholder.com/60' }}
                                        style={styles.fotoPerfil}
                                    />
                                    <View style={styles.infoUsuario}>
                                        <Text style={profile.modoOscuro === true ? styles.nombreClaro : styles.nombreOscuro}>
                                            {usuario.primerNombre} {usuario.segundoNombre} {usuario.primerApellido} {usuario.segundoApellido}
                                        </Text>
                                        <Text style={styles.email}>{usuario.email}</Text>
                                        <View style={styles.detallesContainer}>
                                            <View style={[
                                                styles.badge, 
                                                { backgroundColor: usuario.rol === 'Gestor' ? '#4CAF50' : '#2196F3' }
                                            ]}>
                                                <Text style={styles.badgeText}>{usuario.rol}</Text>
                                            </View>
                                            <View style={[
                                                styles.badge,
                                                { backgroundColor: usuario.estado === 'Activo' ? '#4CAF50' : '#F44336' }
                                            ]}>
                                                <Text style={styles.badgeText}>{usuario.estado}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.iconoFlecha}>
                                        <Ionicons 
                                            name="chevron-forward" 
                                            size={24} 
                                            color={profile.modoOscuro === true ? "#666" : "#ccc"} 
                                        />
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </View>
                <BotonRegistrar />
            </View>
        </LinearGradient>
    );
};

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
        paddingRight: 45,
        paddingVertical: 12,
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
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    tarjetaClaro: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tarjetaOscuro: {
        backgroundColor: '#2C2C2C',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    fotoPerfil: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
    },
    infoUsuario: {
        flex: 1,
    },
    nombreClaro: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 4,
    },
    nombreOscuro: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
    },
    detallesContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    iconoFlecha: {
        marginLeft: 10,
    },
});

export default UsuariosGestor;