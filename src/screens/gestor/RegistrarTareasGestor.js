import AntDesign from '@expo/vector-icons/AntDesign';
import Fontisto from '@expo/vector-icons/Fontisto';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from "expo-linear-gradient";
import { collection, doc, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import appFirebase from '../../credenciales/Credenciales';
import { useAuth } from "../login/AuthContext";

const RegistrarTareasGestor = ({ navigation }) => {
    const db = getFirestore(appFirebase);
    const { profile } = useAuth();

    useEffect(() => {
        if (profile?.rol === "Tecnico") {
            navigation.navigate("Tabs");
        }
    }, [profile, navigation]);

    // CANTIDAD DE TAREAS
    const [contadorTarea, setContadorTarea] = useState([])
    const getContadorTarea = async () => {
        try {
            const docRef = doc(db, "contador", "tarea");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data().cantidad;
            } else {
                console.log("Documento 'tarea' no existe");
                return 0;
            }
        } catch (error) {
            console.error("Error obteniendo contador de tareas:", error);
            return 0;
        }
    };

    useEffect(() => {
        getContadorTarea();
    }, []);

    // USUARIOS con rol Tecnico por SUCURSAL
    const getUsersBySucursal = async (sucursalID) => {
        try {
            const sucursalRef = doc(db, "SUCURSAL", String(sucursalID));
            const usersRef = collection(db, "USUARIO");
            const q = query(usersRef, where("IDSucursal", "==", sucursalRef));
            const responseDB = await getDocs(q);

            const tecnicosArray = [];

            for (const docSnap of responseDB.docs) {
                const data = docSnap.data();

                // Filtrar por rol directamente
                if (data.rol === "Tecnico") {
                    tecnicosArray.push({
                        value: docSnap.id,
                        primerNombre: data.primerNombre || "",
                        segundoNombre: data.segundoNombre || "",
                        primerApellido: data.primerApellido || "",
                        segundoApellido: data.segundoApellido || "",
                        fotoPerfil:
                            data.fotoPerfil ||
                            "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
                        label: (
                            (data.primerNombre || "") +
                            " " +
                            (data.segundoNombre || "") +
                            " " +
                            (data.primerApellido || "") +
                            " " +
                            (data.segundoApellido || "")
                        ).trim() || "Sin nombre",
                    });
                }
            }

            setTecnicos(tecnicosArray);
        } catch (error) {
            console.error(error);
            setTecnicos([]);
        }
    };


    const [loading, setLoading] = useState(false);
    const saveTareas = async () => {
        if (loading) return;
        setLoading(true);

        console.log("Validando datos...");
        if (
            !nombre ||
            !descripcion ||
            !valuePrioridad ||
            !valueSucursal ||
            !arrayValueTecnicos ||
            arrayValueTecnicos.length === 0 ||
            !selectedDate
        ) {
            Alert.alert("Faltan campos", "Revisa los datos antes de continuar");
            setLoading(false);
            return;
        }

        console.log("Datos válidos, intentando crear tarea...");
        try {
            const contadorActual = await getContadorTarea();

            const nuevoNumero = contadorActual + 1;
            console.log("Nuevo número de tarea:", nuevoNumero);

            const docRef = doc(db, "TAREA", nuevoNumero.toString());
            await setDoc(docRef, {
                nombre,
                descripcion,
                fechaCreacion: new Date(),
                prioridad: valuePrioridad,
                estado: "Pendiente",
                fechaEntrega: selectedDate.toISOString(),
                IDCreador: doc(db, "USUARIO", profile?.id.toString()),
                IDSucursal: doc(db, "SUCURSAL", valueSucursal.toString()),
            });

            console.log("Tarea guardada");

            for (const tecnico of arrayValueTecnicos) {
                const tecnicoRef = doc(collection(docRef, "Tecnicos"));
                await setDoc(tecnicoRef, {
                    IDUsuario: doc(db, "USUARIO", tecnico.value),
                });
            }

            const contadorRef = doc(db, "contador", "tarea");
            await updateDoc(contadorRef, { cantidad: nuevoNumero });

            // let contadorUsuario_Tarea = await getContadorUSUARIO_TAREA();
            // console.log("Contador usuario_tarea:", contadorUsuario_Tarea);

            // for (const tecnico of arrayValueTecnicos) {
            //     contadorUsuario_Tarea++;
            //     const docUT = doc(db, "USUARIO_TAREA", contadorUsuario_Tarea.toString());
            //     console.log("Guardando usuario_tarea para técnico:", tecnico.value);
            //     await setDoc(docUT, {
            //         IDUsuario: doc(db, "USUARIO", tecnico.value),
            //         IDTarea: doc(db, "TAREA", nuevoNumero.toString()),
            //     });
            // }

            // const contadorUTRef = doc(db, "contador", "usuario_tarea");
            // await updateDoc(contadorUTRef, { cantidad: contadorUsuario_Tarea });

            // Alert.alert("Éxito", "Tarea creada correctamente");

            setNombre("");
            setDescripcion("");
            setValuePrioridad(null);
            setSelectedDate(null);
            setValueSucursal(null);
            setArrayValueTecnicos([]);
            setValueTecnicos(null);

            Alert.alert("Éxito", "Tarea creada correctamente");
        } catch (error) {
            console.error("Error creando tarea:", error);
            Alert.alert("Error", "No se pudo crear la tarea");
        } finally {
            setLoading(false);
        }
    };

    // Desplegar el combo box de SUCURSAL
    const [openSucursal, setOpenSucursal] = useState(false);
    const [valueSucursal, setValueSucursal] = useState(null);
    const [sucursal, setSucursal] = useState([]);
    const obtenerSucursales = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "SUCURSAL"));
            const data = querySnapshot.docs.map(doc => ({
                label: doc.data().nombre,
                value: doc.id,
            }));
            setSucursal(data);

        } catch (error) {
            console.error("Error obteniendo sucursales:", error);
        }
    };

    useEffect(() => {
        obtenerSucursales();
    }, []);

    useEffect(() => {
        if (valueSucursal) {
            getUsersBySucursal(valueSucursal);
        } else {
            setTecnicos([]);
        }
    }, [valueSucursal]);

    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");

    const [openPrioridad, setOpenPrioridad] = useState(false);
    const [valuePrioridad, setValuePrioridad] = useState(null);
    const [prioridad, setPrioridad] = useState([
        { label: "🔵 Baja", value: "Baja" },
        { label: "🟡 Media", value: "Media" },
        { label: "🔴 Alta", value: "Alta" },
    ]);

    const [openTecnicos, setOpenTecnicos] = useState(false);
    const [valueTecnicos, setValueTecnicos] = useState(null);
    const [arrayValueTecnicos, setArrayValueTecnicos] = useState([]);
    const [tecnicos, setTecnicos] = useState([]);

    const [isVisible, setIsVisible] = useState(false);
    const [mode, setMode] = useState("datetime");
    const [selectedDate, setSelectedDate] = useState(null);

    const handleConfirm = (date) => {
        const now = new Date();
        if (date < now) {
            Alert.alert("Error", "No puedes seleccionar una fecha/hora pasada.");
            return;
        }
        setSelectedDate(date);
        setIsVisible(false);
    };

    // ACOMODAR ARRAY TECNICOS
    const acomodarArrayConTecnicos = () => {
        if (!valueTecnicos || valueTecnicos === "") {
            alert("Tienes que seleccionar un técnico primero");
            return;
        }

        const tecnicoSeleccionado = tecnicos.find(t => t.value === valueTecnicos);
        if (!tecnicoSeleccionado) {
            alert("El técnico seleccionado no existe");
            return;
        }

        setArrayValueTecnicos((prev) => {
            const yaExiste = prev.some(t => t.value === tecnicoSeleccionado.value);
            if (yaExiste) {
                alert("Ese técnico ya fue agregado");
                setValueTecnicos(null);
                return prev;
            }

            const nuevoArray = [...prev, tecnicoSeleccionado];
            console.log("Nuevo array:", nuevoArray);
            setValueTecnicos(null);
            return nuevoArray;
        });

        console.log("4 Array", arrayValueTecnicos);
    };

    const tecnicosDisponibles = tecnicos.filter(
        (t) => !arrayValueTecnicos.some((sel) => sel.value === t.value)
    );

    // DESPLEGAR LOS DIFERENTES COMBO BOX
    const handleOpenSucursal = () => {
        setOpenSucursal(true);
        setOpenPrioridad(false);
        setOpenTecnicos(false);
    };

    const handleOpenPrioridad = () => {
        setOpenPrioridad(true);
        setOpenSucursal(false);
        setOpenTecnicos(false);
    };

    const handleOpenTecnicos = () => {
        setOpenTecnicos(true);
        setOpenSucursal(false);
        setOpenPrioridad(false);
    };

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={["#87aef0", "#9c8fc4"]}
                start={{ x: 0.5, y: 0.4 }}
                end={{ x: 0.5, y: 1 }}
                style={{
                    height: 155,
                }}
            >
                <View style={{ paddingTop: 40, paddingLeft: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                            <Ionicons name="chevron-back" size={24} color={profile.modoOscuro === true ? "#FFFF" : "black"} />
                        </TouchableOpacity>
                    </View>

                    <Text
                        style={{
                            color: profile.modoOscuro ? "white" : "#2C2C2C",
                            fontSize: 26,
                            fontWeight: "900",
                            marginTop: 5,
                            paddingLeft: 10,
                        }}
                    >
                        Agregar Tarea
                    </Text>
                </View>
            </LinearGradient>
            <View style={profile.modoOscuro === true ? styles.containerClaro : styles.containerOscuro}>
                <ScrollView style={{ paddingHorizontal: 15, borderTopRightRadius: 35, borderTopLeftRadius: 35, paddingBottom: 0 }} nestedScrollEnabled={true}>
                    <View>
                        <Text style={[styles.titulo, { paddingTop: 20 }, { color: profile.modoOscuro === true ? 'black' : "white" }]}>Datos de la Tarea</Text>
                        <View style={styles.containerInputs}>
                            <Text style={profile.modoOscuro === true ? styles.labelClaro : styles.labelOscuro}>Nombre</Text>
                            <TextInput style={profile.modoOscuro === true ? styles.inputClaro : styles.inputOscuro}
                                placeholder='Escribe el nombre'
                                placeholderTextColor={"#606368"}
                                value={nombre}
                                onChangeText={setNombre}
                            />
                        </View>
                        <View style={styles.containerInputs}>
                            <Text style={profile.modoOscuro === true ? styles.labelClaro : styles.labelOscuro}>Descripción</Text>
                            <TextInput style={[profile.modoOscuro === true ? styles.inputClaro : styles.inputOscuro, styles.descripcion]}
                                placeholder='Escribe la descripción'
                                placeholderTextColor={"#606368"}
                                multiline={true}
                                textAlignVertical="top"
                                value={descripcion}
                                onChangeText={setDescripcion}
                            />
                        </View>
                        <View style={styles.containerInputs}>
                            <Text style={profile.modoOscuro === true ? styles.labelClaro : styles.labelOscuro}>Prioridad</Text>
                            <DropDownPicker
                                open={openPrioridad}
                                value={valuePrioridad}
                                items={prioridad}
                                setOpen={setOpenPrioridad}
                                setValue={setValuePrioridad}
                                setItems={setPrioridad}
                                placeholder="Selecciona prioridad"
                                style={[
                                    profile.modoOscuro ? styles.inputClaro : styles.inputOscuro,
                                    styles.box
                                ]}
                                listMode="SCROLLVIEW"
                                dropDownContainerStyle={{
                                    borderColor: "#F2F3F5",
                                    borderWidth: 2,
                                    backgroundColor: profile.modoOscuro ? "white" : "#2C2C2C",
                                    borderRadius: 8,
                                }}
                                placeholderStyle={{
                                    color: "#606368",
                                    fontSize: 16,
                                }}
                                textStyle={{
                                    color: profile.modoOscuro ? "black" : "#D1D1D1",
                                    fontSize: 16,
                                }}
                                zIndex={1000}
                                zIndexInverse={3000}
                                ArrowDownIconComponent={() => (
                                    <MaterialIcons name="keyboard-arrow-down" size={24} color={profile.modoOscuro ? "black" : "white"} />

                                )}
                                ArrowUpIconComponent={() => (
                                    <MaterialIcons name="keyboard-arrow-down" size={24} color={profile.modoOscuro ? "black" : "white"} />

                                )}
                                onOpen={handleOpenPrioridad}
                            />
                        </View>

                        <View style={styles.containerInputs}>
                            <Text style={profile.modoOscuro === true ? styles.labelClaro : styles.labelOscuro}>Fecha de entrega</Text>
                            <TouchableOpacity onPress={() => setIsVisible(true)} style={profile.modoOscuro === true ? styles.inputClaro : styles.inputOscuro}>
                                <View style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}>
                                    <View>
                                        {
                                            selectedDate ?
                                                <Text style={{ fontSize: 16, color: profile.modoOscuro ? "black" : "#D1D1D1", }}>
                                                    {selectedDate ? selectedDate.toLocaleString() : "Selecciona fecha y hora"}
                                                </Text>
                                                :
                                                <Text style={{ fontSize: 16, color: selectedDate ? "#000" : "#606368" }}>
                                                    {selectedDate ? selectedDate.toLocaleString() : "Selecciona fecha y hora"}
                                                </Text>
                                        }
                                    </View>
                                    <View style={{ marginRight: 10 }}>
                                        <Fontisto name="date" size={20} color={profile.modoOscuro === true ? "black" : "#FFFF"} />
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <DateTimePickerModal
                                isVisible={isVisible}
                                mode={mode}
                                onConfirm={handleConfirm}
                                onCancel={() => setIsVisible(false)}
                                minimumDate={new Date()}
                                style={profile.modoOscuro === true ? styles.inputClaro : styles.inputOscuro}
                                zIndex={500}
                                zIndexInverse={1500}
                            />
                        </View>

                        <View style={styles.containerInputs}>
                            <Text style={profile.modoOscuro === true ? styles.labelClaro : styles.labelOscuro}>Sucursal</Text>
                            <DropDownPicker
                                open={openSucursal}
                                value={valueSucursal}
                                items={sucursal}
                                setOpen={setOpenSucursal}
                                setValue={setValueSucursal}
                                setItems={setSucursal}
                                placeholder="Selecciona sucursal"
                                style={profile.modoOscuro === true ? styles.inputClaro : styles.inputOscuro}
                                listMode="SCROLLVIEW"
                                dropDownContainerStyle={{
                                    borderColor: "#F2F3F5",
                                    borderWidth: 2,
                                    backgroundColor: profile.modoOscuro ? "white" : "#2C2C2C",
                                    borderRadius: 8,
                                }}
                                placeholderStyle={{
                                    color: "#606368",
                                    fontSize: 16,
                                }}
                                textStyle={{
                                    color: profile.modoOscuro ? "black" : "#D1D1D1",
                                    fontSize: 16,
                                }}
                                zIndex={100}
                                zIndexInverse={100}
                                ArrowDownIconComponent={() => (
                                    <MaterialIcons name="keyboard-arrow-down" size={24} color={profile.modoOscuro ? "black" : "white"} />

                                )}
                                ArrowUpIconComponent={() => (
                                    <MaterialIcons name="keyboard-arrow-down" size={24} color={profile.modoOscuro ? "black" : "white"} />

                                )}
                                onOpen={handleOpenSucursal}
                            />
                        </View>
                    </View>
                    <View style={{ marginTop: 20 }}>
                        <Text style={[styles.titulo, { color: profile.modoOscuro === true ? 'black' : "white" }]}>Asignación de la Tarea</Text>
                        <View style={{ flexDirection: "row" }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[profile.modoOscuro === true ? styles.labelClaro : styles.labelOscuro, { zIndex: 20 }]}>Asignación</Text>
                                <DropDownPicker
                                    open={openTecnicos}
                                    value={valueTecnicos}
                                    items={tecnicosDisponibles}
                                    setOpen={setOpenTecnicos}
                                    setValue={setValueTecnicos}
                                    placeholder="Selecciona técnico"
                                    style={[profile.modoOscuro === true ? styles.inputClaro : styles.inputOscuro, styles.inputTecnicos]}
                                    listMode="SCROLLVIEW"
                                    searchable={true}
                                    searchPlaceholder="Buscar técnico"
                                    searchContainerStyle={{
                                        borderBottomColor: "#ccc",
                                        borderBottomWidth: 1,
                                    }}
                                    searchTextInputStyle={{
                                        height: 40,
                                        fontSize: 16,
                                    }}
                                    zIndex={1}
                                    dropDownContainerStyle={{
                                        borderColor: "#F2F3F5",
                                        borderWidth: 2,
                                        backgroundColor: profile.modoOscuro ? "white" : "#2C2C2C",
                                        borderRadius: 8,
                                    }}
                                    placeholderStyle={{
                                        color: "#606368",
                                        fontSize: 16,
                                    }}
                                    textStyle={{
                                        color: profile.modoOscuro ? "black" : "#D1D1D1",
                                        fontSize: 16,
                                    }}
                                    ArrowDownIconComponent={() => (
                                        <MaterialIcons name="keyboard-arrow-down" size={24} color={profile.modoOscuro ? "black" : "white"} />

                                    )}
                                    ArrowUpIconComponent={() => (
                                        <MaterialIcons name="keyboard-arrow-down" size={24} color={profile.modoOscuro ? "black" : "white"} />

                                    )}
                                    onOpen={handleOpenTecnicos}
                                />
                            </View>
                            <View style={{ marginTop: 15 }}>
                                <TouchableOpacity style={styles.masTecnicos} onPress={acomodarArrayConTecnicos}><AntDesign name="plus" size={20} color={profile.modoOscuro === true ? "#FFFF" : "black"} /></TouchableOpacity>
                            </View>
                        </View>
                        <View>
                            {arrayValueTecnicos.map((tecnico, index) => (
                                <View key={tecnico.value || index} style={{ flexDirection: "row" }}>
                                    <View
                                        style={{
                                            backgroundColor: "#8BA7E6",
                                            borderTopLeftRadius: 11,
                                            borderBottomLeftRadius: 11,
                                            paddingLeft: 12,
                                            paddingVertical: 6,
                                            marginTop: 10,
                                            flex: 1,
                                            flexDirection: "row",
                                        }}
                                    >
                                        <Image
                                            style={{ width: 40, height: 40, borderRadius: 100 }}
                                            source={{ uri: tecnico.fotoPerfil }}
                                        />
                                        <View style={{ justifyContent: "center", paddingLeft: 10 }}>
                                            <Text style={{ color: profile.modoOscuro ? "white" : "black", fontWeight: "500", fontSize: 16 }}>
                                                {`${tecnico.primerNombre} ${tecnico.segundoNombre} ${tecnico.primerApellido} ${tecnico.segundoApellido}`}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Botón eliminar */}
                                    <TouchableOpacity
                                        onPress={() =>
                                            setArrayValueTecnicos((prev) =>
                                                prev.filter((t) => t.value !== tecnico.value)
                                            )
                                        }
                                        style={{
                                            marginTop: 10,
                                            justifyContent: "center",
                                            alignItems: "center",
                                            backgroundColor: "#9c8fc4",
                                            padding: 8,
                                            borderTopRightRadius: 8,
                                            borderBottomRightRadius: 8,
                                        }}
                                    >
                                        <AntDesign name="close" size={20} color={profile.modoOscuro === true ? "#FFFF" : "black"} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                        <View style={{ paddingTop: 15, marginBottom: 20 }}>
                            <TouchableOpacity
                                style={[styles.botonSumit, loading && { opacity: 0.1 }]}
                                onPress={saveTareas}
                            >
                                <Text style={profile.modoOscuro === true ? { color: 'white', fontWeight: 800, fontSize: 20 } : { color: "black", fontWeight: 800, fontSize: 20 }}>Crear Tarea</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    containerClaro: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderTopRightRadius: 35,
        borderTopLeftRadius: 35,
        marginTop: -30,
        paddingBottom: 0,
        marginBottom: 0,
    },
    containerOscuro: {
        flex: 1,
        backgroundColor: "#2C2C2C",
        borderTopRightRadius: 35,
        borderTopLeftRadius: 35,
        marginTop: -30,
        paddingBottom: 0,
        marginBottom: 0,
    },
    titulo: {
        fontSize: 18,
        fontWeight: 700,
    },
    containerInputs: {
        marginTop: 10
    },
    labelClaro: {
        position: "absolute",
        left: 10,
        backgroundColor: "white",
        padding: 4,
        backgroundColor: "white",
        zIndex: 200,
        fontWeight: 700,
        color: "#898C91",
        fontSize: 16
    },
    labelOscuro: {
        position: "absolute",
        left: 10,
        backgroundColor: "white",
        padding: 4,
        backgroundColor: "#2C2C2C",
        zIndex: 200,
        fontWeight: 700,
        color: "#b4b8c0ff",
        fontSize: 16
    },
    inputClaro: {
        color: "black",
        marginTop: 15,
        borderWidth: 2,
        borderColor: "#F2F3F5",
        borderRadius: 8,
        paddingLeft: 12,
        height: 60,
        justifyContent: "center",
        fontSize: 16
    },
    inputOscuro: {
        color: "white",
        marginTop: 15,
        borderWidth: 2,
        borderColor: "#F2F3F5",
        borderRadius: 8,
        paddingLeft: 12,
        height: 60,
        justifyContent: "center",
        fontSize: 16,
        backgroundColor: "#2C2C2C",
    },
    descripcion: {
        height: 90,
        textAlignVertical: "top",
    },
    botonSumit: {
        backgroundColor: "#3D67CD",
        height: 60,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 13
    },
    box: {
        zIndex: 10
    },
    inputTecnicos: {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },
    masTecnicos: {
        padding: 8,
        backgroundColor: "#8BA7E6",
        color: "white",
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        height: 60,
        justifyContent: "center"
    }
});

export default RegistrarTareasGestor