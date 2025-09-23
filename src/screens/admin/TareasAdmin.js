import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from "expo-linear-gradient";
import { collection, getDocs, getFirestore, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Dimensions, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BotonRegistrar from '../../components/BotonRegistrar';
import appFirebase from '../../credenciales/Credenciales';

export default function TareasAdmin({ navigation }) {
    const db = getFirestore(appFirebase);
    const screenHeight = Dimensions.get("window").height;

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
            getTareas();
        }, 2000);
    };

    // Conseguir TAREAS
    //
    const [tareas, setTareas] = useState([]);
    const getTareas = async () => {
        try {
            const tareasCollection = collection(db, "TAREA");
            const q = query(tareasCollection, orderBy("fechaCreacion", "desc"));

            const responseTareas = await getDocs(q);
            const tareaList = responseTareas.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setTareas(tareaList)
        } catch (error) {
            console.error("Error consiguiendo las Tareas:", error)
        }
    }

    useEffect(() => {
        getTareas();
    }, []);

    const [busqueda, setBusqueda] = useState("")

    const formatFecha = (fecha) => {
        if (!fecha) return "";

        let dateObj;

        // Caso Firestore Timestamp
        if (typeof fecha.toDate === "function") {
            dateObj = fecha.toDate();
        }
        // Caso string ISO
        else if (typeof fecha === "string") {
            dateObj = new Date(fecha);
        }
        // Caso Date nativo
        else if (fecha instanceof Date) {
            dateObj = fecha;
        } else {
            return "";
        }

        return dateObj.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };


    //Funcion para cambiar de color la estado de la TAREA
    const getEstadoStyle = (estado) => {
        if (!estado) return { backgroundColor: '#9E9E9E', color: 'white' };
        const status = estado;

        if (status === 'Completada') {
            return {
                backgroundColor: '#47A997',
                color: 'white',
            };
        } else if (status === 'Revisada') {
            return {
                backgroundColor: '#B383E2',
                color: 'white'
            };
        } else if (status === "Pendiente") {
            return {
                backgroundColor: '#F4C54C',
                color: 'white'
            };
        } else if (status === "En Proceso") {
            return {
                backgroundColor: '#57A7FE',
                color: 'white'
            };
        } else if (status === "No Entregada") {
            return {
                backgroundColor: '#F5615C',
                color: 'white'
            };
        }

        return {
            backgroundColor: '#9E9E9E',
            color: "white"
        };
    };

    //Funcion para cambiar de color la prioridad de la TAREA
    const getPrioridadStyle = (prioridad) => {
        if (!prioridad) return { backgroundColor: '#9E9E9E', color: 'white' };
        const status = prioridad;

        if (status === 'Alta') {
            return {
                backgroundColor: '#F5615C',
                color: 'white',
            };
        } else if (status === 'Media') {
            return {
                backgroundColor: '#F5C44C',
                color: 'white'
            };
        } else if (status === "Baja") {
            return {
                backgroundColor: '#57A6FF',
                color: 'white'
            };
        }

        return {
            backgroundColor: '#9E9E9E',
            color: "white"
        };
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
                <View style={{
                    paddingTop: 15, paddingHorizontal: 15, paddingBottom: 20, backgroundColor: "white", shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                    elevation: 6,
                    borderBottomWidth: 2,
                    borderColor: "#D9D9D9"
                }}>
                    <View>
                        <Text style={styles.titulo}>Tareas</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ marginBottom: 0, marginTop: 10, flex: 1 }}>
                            <TextInput
                                placeholder="Buscar"
                                style={styles.inputBusqueda}
                                value={busqueda}
                                onChangeText={setBusqueda}
                            />
                            <View style={{ position: "absolute", right: 15, top: 16 }}>
                                <FontAwesome6 name="magnifying-glass" size={18} color="black" />
                            </View>
                        </View>
                        <View style={{ marginTop: 10, justifyContent: "center", alignContent: "center" }}>
                            <TouchableOpacity style={styles.opciones}>
                                <Ionicons name="options-outline" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <ScrollView
                    style={{
                        flex: 1,
                        paddingHorizontal: 15,
                        paddingVertical: 5,

                    }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {tareas.map((tarea) => (
                        <TouchableOpacity key={tarea.id} style={{ backgroundColor: "white", borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, marginBottom: 10, elevation: 30 }}>
                            <View>
                                <Text style={{ fontSize: 18, fontWeight: 700 }}>{tarea.nombre}</Text>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignContent: "center" }}>
                                    <View style={{ flexDirection: "row", gap: 10, marginBottom: 15, marginTop: 5 }}>
                                        <View>
                                            <Text style={[{ color: getEstadoStyle(tarea.estado).color, fontWeight: 500, backgroundColor: getEstadoStyle(tarea.estado).backgroundColor, paddingVertical: 2, paddingHorizontal: 12, borderRadius: 6 }]}>{tarea.estado}</Text>
                                        </View>
                                        <View>
                                            <Text style={[{ color: getPrioridadStyle(tarea.prioridad).color, fontWeight: 500, backgroundColor: getPrioridadStyle(tarea.prioridad).backgroundColor, paddingVertical: 2, paddingHorizontal: 12, borderRadius: 6 }]}>{tarea.prioridad}</Text>
                                        </View>
                                    </View>
                                    <View style={{ justifyContent: "center" }}>
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <View style={{ flexDirection: "row", gap: 6 }}>
                                                <Feather name="camera" size={18} color="#7B7B7B" />
                                                <Text style={{ color: "#7B7B7B" }}>0</Text>
                                            </View>
                                            <View style={{ flexDirection: "row", gap: 6 }}>
                                                <AntDesign name="book" size={18} color="#7B7B7B" />
                                                <Text style={{ color: "#7B7B7B" }}>0</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignContent: "center" }}>
                                    <View style={{ flexDirection: "row", gap: 7 }}>
                                        <View style={{ alignItems: "center", justifyContent: "center" }}>
                                            <Feather name="calendar" size={20} color="#7B7B7B" />
                                        </View>
                                        <View style={{ alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ color: "#7B7B7B" }}>
                                                {formatFecha(tarea.fechaCreacion)} - {formatFecha(tarea.fechaEntrega)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row' }}>
                                        <View style={{ position: "relative", right: -10 }}>
                                            <Image
                                                style={{ width: 27, height: 27, borderRadius: 100, borderWidth: 1, borderColor: "#7B7B7B" }}
                                                source={{ uri: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" }}
                                            />
                                        </View>
                                        <View style={{ position: "relative", right: -5 }}>
                                            <Image
                                                style={{ width: 27, height: 27, borderRadius: 100, borderWidth: 1, borderColor: "#7B7B7B" }}
                                                source={{ uri: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" }}
                                            />
                                        </View>
                                        <View style={{ position: "relative", right: 0 }}>
                                            <Image
                                                style={{ width: 27, height: 27, borderRadius: 100, borderWidth: 1, borderColor: "#7B7B7B" }}
                                                source={{ uri: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" }}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <BotonRegistrar />

            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        fontSize: 18,
    },
    opciones: {
        padding: 10,
        borderRadius: 9,
        borderColor: "#D9D9D9",
        borderWidth: 2,
    },
    estadoYPrioridad: {
        marginBottom: 10,
        flexDirection: "row",
        gap: 7,
    }
});
