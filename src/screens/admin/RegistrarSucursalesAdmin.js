import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from "expo-linear-gradient";
import { addDoc, collection, getFirestore, Timestamp } from "firebase/firestore";
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import appFirebase from '../../credenciales/Credenciales';
import { useAuth } from "../login/AuthContext";

const db = getFirestore(appFirebase);

const RegistrarSucursalesAdmin = ({ navigation }) => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    
    // Estados para los campos del formulario
    const [nombre, setNombre] = useState("");
    const [dirCalle, setDirCalle] = useState("");
    const [dirColonia, setDirColonia] = useState("");
    const [dirCP, setDirCP] = useState("");

    // Validar formulario
    const validarFormulario = () => {
        if (!nombre.trim()) {
            Alert.alert("Error", "El nombre de la sucursal es obligatorio");
            return false;
        }
        if (!dirCalle.trim()) {
            Alert.alert("Error", "La calle es obligatoria");
            return false;
        }
        if (!dirColonia.trim()) {
            Alert.alert("Error", "La colonia es obligatoria");
            return false;
        }
        if (!dirCP.trim()) {
            Alert.alert("Error", "El código postal es obligatorio");
            return false;
        }
        if (dirCP.length !== 5 || isNaN(dirCP)) {
            Alert.alert("Error", "El código postal debe tener 5 dígitos");
            return false;
        }
        return true;
    };

    // Registrar sucursal
    const registrarSucursal = async () => {
        if (!validarFormulario()) return;

        try {
            setLoading(true);
            
            const nuevaSucursal = {
                nombre: nombre.trim(),
                dirCalle: dirCalle.trim(),
                dirColonia: dirColonia.trim(),
                dirCP: dirCP.trim(),
                fechaCreacion: Timestamp.now(),
                IDCreador: profile.id || 0
            };

            await addDoc(collection(db, "SUCURSAL"), nuevaSucursal);

            Alert.alert(
                "¡Éxito!",
                "Sucursal registrada correctamente",
                [
                    {
                        text: "OK",
                        onPress: () => navigation.goBack()
                    }
                ]
            );

            // Limpiar formulario
            setNombre("");
            setDirCalle("");
            setDirColonia("");
            setDirCP("");

        } catch (error) {
            console.error("Error al registrar sucursal:", error);
            Alert.alert("Error", "No se pudo registrar la sucursal. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={["#87aef0", "#9c8fc4"]}
            start={{ x: 0.5, y: 0.4 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1 }}
        >
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                {/* Header */}
                <View style={profile.modoOscuro === true ? styles.headerClaro : styles.headerOscuro}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity 
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Ionicons 
                                name="arrow-back" 
                                size={24} 
                                color={profile.modoOscuro === true ? "black" : "white"} 
                            />
                        </TouchableOpacity>
                        <Text style={profile.modoOscuro === true ? styles.tituloClaro : styles.tituloOscuro}>
                            Nueva Sucursal
                        </Text>
                    </View>
                </View>

                <ScrollView 
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.formContainer}>
                        {/* Icono principal */}
                        <View style={styles.iconHeader}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="business" size={50} color="#87aef0" />
                            </View>
                            <Text style={styles.subtitulo}>Registra una nueva sucursal</Text>
                        </View>

                        {/* Campo: Nombre */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nombre de la Sucursal *</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="storefront-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej: Sucursal Centro"
                                    value={nombre}
                                    onChangeText={setNombre}
                                    maxLength={100}
                                />
                            </View>
                        </View>

                        {/* Campo: Calle */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Calle *</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej: Av. Revolución 1234"
                                    value={dirCalle}
                                    onChangeText={setDirCalle}
                                    maxLength={150}
                                />
                            </View>
                        </View>

                        {/* Campo: Colonia */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Colonia *</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="home-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej: Zona Centro"
                                    value={dirColonia}
                                    onChangeText={setDirColonia}
                                    maxLength={100}
                                />
                            </View>
                        </View>

                        {/* Campo: Código Postal */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Código Postal *</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej: 22000"
                                    value={dirCP}
                                    onChangeText={setDirCP}
                                    keyboardType="numeric"
                                    maxLength={5}
                                />
                            </View>
                        </View>

                        {/* Botón Registrar */}
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={registrarSucursal}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="checkmark-circle" size={24} color="white" />
                            <Text style={styles.buttonText}>
                                {loading ? "Registrando..." : "Registrar Sucursal"}
                            </Text>
                        </TouchableOpacity>

                        {/* Botón Cancelar */}
                        <TouchableOpacity
                            style={styles.buttonSecondary}
                            onPress={() => navigation.goBack()}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonSecondaryText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    headerClaro: {
        paddingTop: 15,
        paddingHorizontal: 15,
        paddingBottom: 15,
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
        paddingBottom: 15,
        backgroundColor: "#2C2C2C",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
        borderBottomWidth: 2,
        borderColor: "#D9D9D9"
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    tituloClaro: {
        color: "black",
        fontSize: 24,
        fontWeight: "900",
    },
    tituloOscuro: {
        color: "white",
        fontSize: 24,
        fontWeight: "900",
    },
    formContainer: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    iconHeader: {
        alignItems: "center",
        marginBottom: 30,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#f0f5ff",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
    },
    subtitulo: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    inputIcon: {
        marginLeft: 15,
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 15,
        fontSize: 16,
        color: "#333",
    },
    button: {
        flexDirection: "row",
        backgroundColor: "#87aef0",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        gap: 10,
    },
    buttonDisabled: {
        backgroundColor: "#b0b0b0",
    },
    buttonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "700",
    },
    buttonSecondary: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
        borderWidth: 2,
        borderColor: "#87aef0",
    },
    buttonSecondaryText: {
        color: "#87aef0",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default RegistrarSucursalesAdmin;