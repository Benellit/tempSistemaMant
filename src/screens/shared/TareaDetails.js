import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import { collection, doc, getDoc, getDocs, getFirestore } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import appFirebase from '../../credenciales/Credenciales';
import { useAuth } from "../login/AuthContext";

const TareaDetails = ({ route, navigation }) => {
    const db = getFirestore(appFirebase);
    const { profile } = useAuth();
    const { id } = route.params;

    const [loading, setLoading] = useState(true);
    const [tarea, setTarea] = useState([]);
    const [creador, setCreador] = useState([]);
    const [tecnicos, setTecnicos] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, "TAREA", id);
                const responseTarea = await getDoc(docRef);
                let tareaData = null;
                if (responseTarea.exists()) {
                    tareaData = responseTarea.data();
                    setTarea(tareaData);
                }

                let creadorData = null;
                if (tareaData?.IDCreador) {
                    const creadorRef = doc(db, "USUARIO", tareaData.IDCreador.id);
                    const creadorSnap = await getDoc(creadorRef);
                    if (creadorSnap.exists()) {
                        creadorData = creadorSnap.data();
                        setCreador(creadorData);
                    }
                }

                const refTecnicos = collection(db, "TAREA", id, "Tecnicos");
                const snap = await getDocs(refTecnicos);
                const tecnicosData = await Promise.all(
                    snap.docs.map(async (d) => {
                        const data = d.data();
                        let usuario = null;
                        if (data.IDUsuario) {
                            const userSnap = await getDoc(data.IDUsuario);
                            if (userSnap.exists()) {
                                usuario = userSnap.data();
                            }
                        }
                        return { id: d.id, ...data, usuario };
                    })
                );
                setTecnicos(tecnicosData);

            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) cargarDatos();
    }, [id]);


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

        return dateObj.toLocaleString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    };


    //Funcion para cambiar de color la estado de la TAREA
    const getEstadoStyle = (estado) => {
        if (!estado) return { backgroundColor: profile.modoOscuro === true ? "white" : "black", color: profile.modoOscuro === true ? "white" : "black", };
        const status = estado;

        if (status === 'Completada') {
            return {
                backgroundColor: '#47A997',
                color: profile.modoOscuro === true ? "white" : "black",
            };
        } else if (status === 'Revisada') {
            return {
                backgroundColor: '#B383E2',
                color: profile.modoOscuro === true ? "white" : "black",
            };
        } else if (status === "Pendiente") {
            return {
                backgroundColor: '#F4C54C',
                color: profile.modoOscuro === true ? "white" : "black",
            };
        } else if (status === "En Proceso") {
            return {
                backgroundColor: '#57A7FE',
                color: profile.modoOscuro === true ? "white" : "black",
            };
        } else if (status === "No Entregada") {
            return {
                backgroundColor: '#F5615C',
                color: profile.modoOscuro === true ? "white" : "black",
            };
        }

        return {
            backgroundColor: profile.modoOscuro === true ? "white" : "black",
            color: profile.modoOscuro === true ? "white" : "black",
        };
    };

    //Funcion para cambiar de color la prioridad de la TAREA
    const getPrioridadStyle = (prioridad) => {
        if (!prioridad) return { backgroundColor: profile.modoOscuro === true ? "white" : "black", color: profile.modoOscuro === true ? "#EDEDED" : "black", };
        const status = prioridad;

        if (status === 'Alta') {
            return {
                backgroundColor: '#F5615C',
                color: profile.modoOscuro === true ? "white" : "black",
            };
        } else if (status === 'Media') {
            return {
                backgroundColor: '#F5C44C',
                color: profile.modoOscuro === true ? "white" : "black",
            };
        } else if (status === "Baja") {
            return {
                backgroundColor: '#57A6FF',
                color: profile.modoOscuro === true ? "white" : "black",
            };
        }

        return {
            backgroundColor: profile.modoOscuro === true ? "white" : "black",
            color: profile.modoOscuro === true ? "white" : "black",
        };
    };

    if (loading) {
        return (
            <View style={profile.modoOscuro === true ? styles.loaderClaro : styles.loaderOscuro}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{color: profile.modoOscuro === true ?  "black" : "#FFFF"}}>Cargando datos...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: profile.modoOscuro ? "white" : "#2C2C2C", }}>
            <View style={{ marginTop: 30, justifyContent: "space-between", flexDirection: "row" }}>
                <TouchableOpacity style={{ padding: 10 }} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={profile.modoOscuro === true ? "black" : "#FFFF"} />
                </TouchableOpacity>
                {(profile.rol === "Administrador" || profile.rol === "Gestor") ? (
                    <TouchableOpacity onPress={() => navigation.navigate("EditTarea", { id: id })} style={{ padding: 10 }}>
                        <Feather name="edit" size={24} color={profile.modoOscuro === true ? "black" : "#FFFF"} />
                    </TouchableOpacity>
                ) : (
                    <View />
                )}
            </View>
            <ScrollView style={{ paddingHorizontal: 15, paddingTop: 5, borderTopWidth: 1, borderColor: "#D9D9D9", }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View style={{ paddingRight: profile.rol === "Administrador" || profile.rol === "Gestor" ? 10 : 0 }}>
                        <Text style={profile.modoOscuro === true ? styles.nombreClaro : styles.nombreOscuro}>{tarea.nombre}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: "row", gap: 10, marginVertical: 5 }}>
                    <View>
                        <Text style={[{ color: getEstadoStyle(tarea.estado).color, fontWeight: 500, backgroundColor: getEstadoStyle(tarea.estado).backgroundColor, paddingVertical: 2, paddingHorizontal: 12, borderRadius: 6 }]}>{tarea.estado}</Text>
                    </View>
                    <View>
                        <Text style={[{ color: getPrioridadStyle(tarea.prioridad).color, fontWeight: 500, backgroundColor: getPrioridadStyle(tarea.prioridad).backgroundColor, paddingVertical: 2, paddingHorizontal: 12, borderRadius: 6 }]}>{tarea.prioridad}</Text>
                    </View>
                </View>
                <View>
                    <Text style={profile.modoOscuro === true ? styles.descripcionClaro : styles.descripcionOscuro}>{tarea.descripcion}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 7, marginTop: 10 }}>
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                        <Feather name="calendar" size={20} color={profile.modoOscuro === true ? "#7B7B7B" : "#d2d2d2ff"} />
                    </View>
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                        <Text style={profile.modoOscuro === true ? styles.numerosClaro : styles.numerosOscuro}>
                            {formatFecha(tarea.fechaCreacion)} - {formatFecha(tarea.fechaEntrega)}
                        </Text>
                    </View>
                </View>
                <View style={{ flexDirection: "row", gap: 7, marginBottom: 10 }}>
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                        <FontAwesome5 name="user-tie" size={20} color={profile.modoOscuro === true ? "#7B7B7B" : "#d2d2d2ff"} />
                    </View>
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                        <Text style={profile.modoOscuro === true ? styles.numerosClaro : styles.numerosOscuro}>
                            Por el {creador?.rol ?? ""}{" "}
                            {[
                                creador?.primerNombre ?? "",
                                creador?.segundoNombre ?? "",
                                creador?.primerApellido ?? "",
                                creador?.segundoApellido ?? ""
                            ]
                                .filter(name => name.trim() !== "")
                                .join(" ")}
                        </Text>

                    </View>
                </View>
                <View>
                    <Text style={[styles.titulo, { paddingTop: 20 }, { color: profile.modoOscuro === true ? 'black' : "white" }]}>Asignación de la Tarea</Text>
                    {tecnicos.map((tecnico) => (
                        <View key={tecnico.id}
                            style={{
                                backgroundColor: "#8BA7E6",
                                borderRadius: 11,
                                paddingLeft: 12,
                                paddingVertical: 6,
                                marginTop: 10,
                                flex: 1,
                                flexDirection: "row",
                            }}>
                            <Image
                                style={{ width: 40, height: 40, borderRadius: 100 }}
                                source={{
                                    uri: tecnico.usuario?.fotoPerfil && tecnico.usuario.fotoPerfil.trim() !== ""
                                        ? tecnico.usuario.fotoPerfil
                                        : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
                                }}
                            />
                            <View style={{ justifyContent: "center", paddingLeft: 10 }}>
                                <Text style={{ color: profile.modoOscuro === true ? "#FFFF" : "black", fontWeight: "500", fontSize: 16 }}>
                                    {[
                                        tecnico.usuario?.primerNombre ?? "",
                                        tecnico.usuario?.segundoNombre ?? "",
                                        tecnico.usuario?.primerApellido ?? "",
                                        tecnico.usuario?.segundoApellido ?? ""
                                    ]
                                        .filter(name => name.trim() !== "")
                                        .join(" ")}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView >
        </View >
    )
}

const styles = StyleSheet.create({
    loaderClaro: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white"
    },
    loaderOscuro: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#2C2C2C"
    },
    container: {
        flex: 1,
        padding: 20,
    },
    nombreClaro: {
        fontSize: 24,
        fontWeight: 800,
    },
    nombreOscuro: {
        fontSize: 24,
        fontWeight: 800,
        color: "white"
    },
    descripcionClaro: {
        fontSize: 16,
        fontWeight: 400,
    },
    descripcionOscuro: {
        fontSize: 16,
        fontWeight: 400,
        color: "white"
    },
    numerosClaro: {
        color: "#7B7B7B"
    },
    numerosOscuro: {
        color: "#d2d2d2ff"
    },
    titulo: {
        fontSize: 18,
        fontWeight: 700,
    },
})

export default TareaDetails