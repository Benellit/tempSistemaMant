import AntDesign from '@expo/vector-icons/AntDesign';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from "expo-linear-gradient";
import { collection, collectionGroup, doc, getDoc, getDocs, getFirestore, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useState, useCallback } from "react";
import { Dimensions, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ModalFiltrosAdmin from '../../components/admin/ModalFiltrosAdmin';
import BotonRegistrar from '../../components/BotonRegistrar';
import appFirebase from '../../credenciales/Credenciales';
import { useAuth } from "../login/AuthContext";
import { useFocusEffect } from '@react-navigation/native';

export default function TareasShared({ navigation }) {
    const db = getFirestore(appFirebase);
    const { profile } = useAuth();
    const screenHeight = Dimensions.get("window").height;
    const [refreshing, setRefreshing] = useState(false);
    const [tareas, setTareas] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [openFiltros, setOpenFiltros] = useState(false);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
            getTareas();
        }, 1000);
    };

    useEffect(() => {
        console.log("TareasShared montado");
        return () => console.log("TareasShared desmontado");
    }, []);

    // Conseguir TAREAS
    useEffect(() => {
        getTareas();
    }, []);

    const getTareas = async () => {
        try {
            let tareaList = [];

            // Obtener tareas según el rol
            if (profile.rol === "Administrador") {
                const baseQuery = busqueda
                    ? query(
                        collection(db, "TAREA"),
                        orderBy("fechaCreacion", "desc"),
                        where("nombre", ">=", busqueda),
                        where("nombre", "<=", busqueda + '\uf8ff')
                    )
                    : query(collection(db, "TAREA"), orderBy("fechaCreacion", "desc"));
                const response = await getDocs(baseQuery);
                tareaList = response.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            } else if (profile.rol === "Gestor") {
                const baseQuery = busqueda
                    ? query(
                        collection(db, "TAREA"),
                        where("IDSucursal", "==", profile.IDSucursal),
                        where("nombre", ">=", busqueda),
                        where("nombre", "<=", busqueda + '\uf8ff'),
                        orderBy("fechaCreacion", "desc")
                    )
                    : query(
                        collection(db, "TAREA"),
                        where("IDSucursal", "==", profile.IDSucursal),
                        orderBy("fechaCreacion", "desc")
                    );
                const response = await getDocs(baseQuery);
                tareaList = response.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            } else if (profile.rol === "Tecnico") {
                const userRef = doc(db, "USUARIO", profile.id);
                const q = query(collectionGroup(db, "Tecnicos"), where("IDUsuario", "==", userRef));
                const response = await getDocs(q);

                tareaList = await Promise.all(
                    response.docs.map(async (docSnap) => {
                        const tecnicoData = docSnap.data();
                        const tareaRef = docSnap.ref.parent.parent;
                        const tareaSnap = await getDoc(tareaRef);

                        return {
                            id: tareaRef.id,
                            ...tareaSnap.data(),
                            tecnico: { id: docSnap.id, ...tecnicoData },
                        };
                    })
                );
            } else {
                navigation.navigate("Tabs");
                return;
            }

            const tareasConTodo = await Promise.all(
                tareaList.map(async (tarea) => {
                    const tareaRef = doc(db, "TAREA", tarea.id);

                    // --- Cargar Técnicos ---
                    const tecnicosSnap = await getDocs(collection(tareaRef, "Tecnicos"));
                    const tecnicos = await Promise.all(
                        tecnicosSnap.docs.map(async (t) => {
                            const data = t.data();
                            let usuario = null;
                            if (data.IDUsuario) {
                                try {
                                    const userSnap = await getDoc(data.IDUsuario);
                                    if (userSnap.exists()) usuario = userSnap.data();
                                } catch (err) {
                                    console.error("Error cargando usuario:", err);
                                }
                            }
                            return { id: t.id, ...data, usuario };
                        })
                    );

                    // --- Cargar Reportes y Evidencias ---
                    const [repSnap, eviSnap] = await Promise.all([
                        getDocs(collection(tareaRef, "Reportes")),
                        getDocs(collection(tareaRef, "Evidencias"))
                    ]);

                    return {
                        ...tarea,
                        tecnicos,
                        totalReportes: repSnap.size,
                        totalEvidencias: eviSnap.size
                    };
                })
            );

            tareasConTodo.sort((a, b) => b.fechaCreacion.toMillis() - a.fechaCreacion.toMillis());
            setTareas(tareasConTodo);

        } catch (error) {
            console.error("Error consiguiendo las Tareas:", error);
        }
    };

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
        if (!estado) return { backgroundColor: '#9E9E9E', color: profile.modoOscuro === true ? "#EDEDED" : "black", };
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
            backgroundColor: '#9E9E9E',
            color: profile.modoOscuro === true ? "white" : "black",
        };
    };

    //Funcion para cambiar de color la prioridad de la TAREA
    const getPrioridadStyle = (prioridad) => {
        if (!prioridad) return { backgroundColor: '#9E9E9E', color: profile.modoOscuro === true ? "#EDEDED" : "black", };
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
            backgroundColor: '#9E9E9E',
            color: profile.modoOscuro === true ? "white" : "black",
        };
    };

    const navegarMas = (tareaID) => {
        navigation.navigate("TareaDetails", {
            id: tareaID,
            onGoBack: () => onRefresh(), // nombre más claro
        });
    };


    useEffect(() => {
        if (busqueda === "") {
            onRefresh();
        }
    }, [busqueda]);

    return (
        <LinearGradient
            colors={["#87aef0", "#9c8fc4"]}
            start={{ x: 0.5, y: 0.4 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1 }}
        >
            <View style={{ flex: 1 }}>
                {/* Header */}
                <View style={profile.modoOscuro ? styles.headerOscuro : styles.headerClaro}>
                    <View>
                        <Text style={profile.modoOscuro ? styles.tituloOscuro : styles.tituloClaro}>Tareas</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10, marginBottom: 5 }}>
                        <View style={{ marginBottom: 0, marginVertical: 5, flex: 1 }}>
                            <TextInput
                                placeholder="Buscar"
                                placeholderTextColor={profile.modoOscuro ? "#BDBDBD" : "#6B7280"}
                                style={[styles.inputBusqueda, { color: profile.modoOscuro ? "#FFFFFF" : "#111827" }]}
                                value={busqueda}
                                onChangeText={setBusqueda}
                            />
                            {busqueda !== "" && (
                                <TouchableOpacity
                                    disabled={refreshing}
                                    onPress={() => {
                                        setBusqueda("");
                                    }}

                                    style={{
                                        position: "absolute",
                                        top: 3,
                                        right: 38,
                                        padding: 4,
                                        opacity: refreshing ? 0.5 : 1,
                                    }}
                                >
                                    <EvilIcons name="close" size={24} color={profile.modoOscuro ? "#FFFFFF" : "#111827"} />

                                </TouchableOpacity>
                            )}


                            <TouchableOpacity refreshing={refreshing} onPress={onRefresh} style={{ position: "absolute", right: 0, top: 0, backgroundColor: "#87aef0", padding: 10, borderTopRightRadius: 20, borderBottomRightRadius: 20 }}>
                                <FontAwesome6 name="magnifying-glass" size={16} color={profile.modoOscuro === true ? "#FFFF" : "black"} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ marginTop: 5, justifyContent: "center", alignContent: "center" }}>
                            <TouchableOpacity style={styles.opciones} onPress={() => { setOpenFiltros(true) }}>
                                <Ionicons name="options-outline" size={24} color={profile.modoOscuro === true ? "#FFFF" : "black"} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* <View>
                        <ScrollView horizontal={true} style={{}} showsHorizontalScrollIndicator={false}>
                            <TouchableOpacity>
                                <Text style={styles.item}>Todas</Text>
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Text style={styles.item}>Normales</Text>
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Text style={styles.item}>Repetitivas</Text>
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Text style={styles.item}>Jerarquicas</Text>
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Text style={styles.item}>Archivadas</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View> */}
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
                        <TouchableOpacity
                            onPress={() => navegarMas(tarea.id)}
                            key={tarea.id}
                            style={profile.modoOscuro ? styles.cardsTareasOscuro : styles.cardsTareasClaro}

                        >
                            <View>
                                <Text style={profile.modoOscuro ? styles.tituloCardOscuro : styles.tituloCardClaro}>
                                    {tarea.nombre}
                                </Text>

                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignContent: "center" }}>
                                    <View style={{ flexDirection: "row", gap: 10, marginBottom: 15, marginTop: 5 }}>
                                        <Text style={[{
                                            color: getEstadoStyle(tarea.estado).color,
                                            fontWeight: 500,
                                            fontSize: 13,
                                            backgroundColor: getEstadoStyle(tarea.estado).backgroundColor,
                                            paddingVertical: 1,
                                            paddingHorizontal: 12,
                                            borderRadius: 6
                                        }]}>
                                            {tarea.estado}
                                        </Text>
                                        <Text style={[{
                                            color: getPrioridadStyle(tarea.prioridad).color,
                                            fontWeight: 500,
                                            fontSize: 13,
                                            backgroundColor: getPrioridadStyle(tarea.prioridad).backgroundColor,
                                            paddingVertical: 1,
                                            paddingHorizontal: 12,
                                            borderRadius: 6
                                        }]}>
                                            {tarea.prioridad}
                                        </Text>
                                    </View>

                                    {/* 📸 Reportes y evidencias */}
                                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                                        <View style={{ flexDirection: "row", gap: 3 }}>
                                    <Feather name="camera" size={16} color={profile.modoOscuro ? "#EDEDED" : "#353335"} />
                                            <Text style={profile.modoOscuro ? styles.numerosOscuro : styles.numerosClaro}>

                                                {tarea.totalEvidencias}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: "row", gap: 3 }}>
                                    <AntDesign name="book" size={16} color={profile.modoOscuro ? "#EDEDED" : "#353335"} />
                                            <Text style={profile.modoOscuro ? styles.numerosOscuro : styles.numerosClaro}>

                                                {tarea.totalReportes}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* 👨‍🔧 Técnicos */}
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignContent: "center" }}>
                                    <View style={{ flexDirection: "row", gap: 7 }}>
                                        <Feather name="calendar" size={20} color={profile.modoOscuro ? "#EDEDED" : "#7B7B7B"} />

                                        <Text style={profile.modoOscuro ? styles.fechaOscuro : styles.fechaClaro}>

                                            {formatFecha(tarea.fechaCreacion)} - {formatFecha(tarea.fechaEntrega)}
                                        </Text>
                                    </View>

                                    {/* Avatares técnicos */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {tarea.tecnicos.slice(0, 3).map((tecnico, index) => (
                                            <Image
                                                key={tecnico.id}
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 100,
                                                    borderWidth: 1,
                                                    borderColor: "#353335",
                                                    marginLeft: index === 0 ? 0 : -5,
                                                }}
                                                source={{
                                                    uri:
                                                        tecnico.usuario?.fotoPerfil && tecnico.usuario.fotoPerfil.trim() !== ""
                                                            ? tecnico.usuario.fotoPerfil
                                                            : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
                                                }}
                                            />
                                        ))}

                                        {tarea.tecnicos.length > 3 && (
                                            <View
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 100,
                                                    borderWidth: 1,
                                                    borderColor: "#353335",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    backgroundColor: "#FFFFFF",
                                                    marginLeft: -5,
                                                }}
                                            >
                                                <Text style={{ color: "#353335", fontSize: 12, fontWeight: "500" }}>
                                                    +{tarea.tecnicos.length - 3}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}

                </ScrollView>

                {/* boton para registrar tareas NO PERMITIDO PARA TECNICOS */}
                {profile.rol === "Tecnico" ? <View></View> : <BotonRegistrar />}

                <>
                    {openFiltros ? (
                        <ModalFiltrosAdmin open={openFiltros} setOpenFiltros={setOpenFiltros} />
                    ) : (
                        <View />
                    )}
                </>


            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerClaro: {
        paddingTop: 16,
        paddingHorizontal: 15,
        paddingBottom: 8,
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 16,
        borderBottomWidth: 1,
        borderColor: "#D9D9D9",
        marginBottom: 6,
    },
    headerOscuro: {
        paddingTop: 16,
        paddingHorizontal: 15,
        paddingBottom: 8,
        backgroundColor: "#2C2C2C",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 16,
        borderBottomWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        marginBottom: 6,
    },
    tituloClaro: {
        color: "black",
        fontSize: 26,
        fontWeight: 900,
        marginTop: 16,
        marginBottom: 4,
    },
    tituloOscuro: {
        color: "white",
        fontSize: 26,
        fontWeight: 900,
        marginTop: 16,
        marginBottom: 4,
    },
    inputBusqueda: {
        paddingLeft: 15,
        borderRadius: 20,
        borderColor: "#D9D9D9",
        borderWidth: 1,
        fontSize: 16,
        paddingBottom: 7,
        paddingTop: 7.
    },
    opciones: {
        padding: 7,
        borderRadius: 9,
        backgroundColor: "#87aef0"
    },
    estadoYPrioridad: {
        marginBottom: 10,
        flexDirection: "row",
        gap: 7,
    },
    cardsTareasClaro: {
        backgroundColor: "white",
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 10,
        elevation: 30
    },
    cardsTareasOscuro: {
        backgroundColor: "#2C2C2C",
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 10,
        elevation: 30
    },
    tituloCardClaro: {
        fontSize: 16,
        fontWeight: 700,
    },
    tituloCardOscuro: {
        color: "white",
        fontSize: 16,
        fontWeight: 700,
    },
    numerosClaro: {
        fontSize: 14,
        color: "#353335",
        fontWeight: 500,
    },
    numerosOscuro: {
        fontSize: 14,
        color: "#EDEDED",
        fontWeight: 500,
    },
    fechaClaro: {
        fontSize: 14,
        color: "#7B7B7B",
        fontWeight: 500,
    },
    fechaOscuro: {
        fontSize: 14,
        color: "#EDEDED",
        fontWeight: 500,
    },
    item: {
        padding: 1,
        marginRight: 10,
        borderRadius: 5,
        fontSize: 14,
        width: "auto",
        fontWeight: '600',
        color: 'gray'
    },
});
