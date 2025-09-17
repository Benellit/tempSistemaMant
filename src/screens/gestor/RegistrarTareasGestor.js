import AntDesign from '@expo/vector-icons/AntDesign';
import Fontisto from '@expo/vector-icons/Fontisto';
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const RegistrarTareasGestor = () => {
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");

    const [openPrioridad, setOpenPrioridad] = useState(false);
    const [valuePrioridad, setValuePrioridad] = useState(null);
    const [prioridad, setPrioridad] = useState([
        { label: "🔵 Baja", value: "Baja" },
        { label: "🟡 Media", value: "Media" },
        { label: "🔴 Alta", value: "Alta" },
    ]);

    const [openSucursal, setOpenSucursal] = useState(false);
    const [valueSucursal, setValueSucursal] = useState(null);
    const [sucursal, setSucursal] = useState([
        { label: "Zona Centro", value: "Zona Centro" },
        { label: "KFC", value: "KFC" },
        { label: "RFC", value: "RFC" },
    ]);

    const [openTecnicos, setOpenTecnicos] = useState(false);
    const [valueTecnicos, setValueTecnicos] = useState(null);
    const [tecnicos, setTecnicos] = useState([
        { label: "Elias Jair Gomez Cueva", value: "Elias Jair Gomez Cueva" },
        { label: "Mario Yair Morales Anacleto", value: "Mario Yair Morales Anacleto" },
        { label: "Luis Ignacio Diaz Reyes", value: "Luis Ignacio Diaz Reyes" },
    ]);

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


    return (
        <View style={styles.container}>
            <ScrollView nestedScrollEnabled={true}>
                <View>
                    <Text style={styles.titulo}>Datos de la Tarea</Text>
                    <TextInput style={styles.input}
                        placeholder='Nombre'
                        value={nombre}
                        onChangeText={setNombre}
                    />
                    <TextInput style={[styles.input, styles.descripcion]}
                        placeholder='Descripción'
                        multiline={true}
                        textAlignVertical="top"
                        value={descripcion}
                        onChangeText={setDescripcion}
                    />
                    <DropDownPicker
                        open={openPrioridad}
                        value={valuePrioridad}
                        items={prioridad}
                        setOpen={setOpenPrioridad}
                        setValue={setValuePrioridad}
                        setItems={setPrioridad}
                        placeholder="Selecciona prioridad"
                        style={[styles.input, styles.box]}
                        listMode="SCROLLVIEW"
                        dropDownContainerStyle={{
                            borderColor: "#F2F3F5",
                            borderWidth: 2,
                            backgroundColor: "#fff",
                            borderRadius: 8,
                        }}
                        placeholderStyle={{ color: "#999" }}
                    />

                    <TouchableOpacity onPress={() => setIsVisible(true)} style={styles.input}>
                        <View style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}>
                            <View>
                                <Text style={{ color: selectedDate ? "#000" : "#999" }}>
                                    {selectedDate ? selectedDate.toLocaleString() : "Selecciona fecha y hora"}
                                </Text>
                            </View>
                            <View style={{ marginRight: 10 }}>
                                <Fontisto name="date" size={20} color="black" />
                            </View>
                        </View>
                    </TouchableOpacity>

                    <DateTimePickerModal
                        isVisible={isVisible}
                        mode={mode}
                        onConfirm={handleConfirm}
                        onCancel={() => setIsVisible(false)}
                        minimumDate={new Date()}
                        style={styles.input}
                    />

                    <DropDownPicker
                        open={openSucursal}
                        value={valueSucursal}
                        items={sucursal}
                        setOpen={setOpenSucursal}
                        setValue={setValueSucursal}
                        setItems={setSucursal}
                        placeholder="Selecciona sucursal"
                        style={styles.input}
                        listMode="SCROLLVIEW"
                        dropDownContainerStyle={{
                            borderColor: "#F2F3F5",
                            borderWidth: 2,
                            backgroundColor: "#fff",
                            borderRadius: 8,
                        }}
                        placeholderStyle={{ color: "#999" }}
                    />
                </View>
                <View style={{ marginTop: 20 }}>
                    <Text style={styles.titulo}>Asignación de la Tarea</Text>
                    <View style={{ flexDirection: "row" }}>
                        <View style={{ flex: 1 }}>
                            <DropDownPicker
                                open={openTecnicos}
                                value={valueTecnicos}
                                items={tecnicos}
                                setOpen={setOpenTecnicos}
                                setValue={setValueTecnicos}
                                setItems={setTecnicos}
                                placeholder="Selecciona técnico"
                                style={[styles.input, styles.inputTecnicos]}
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
                                zIndex={1000}
                                dropDownContainerStyle={{
                                    borderColor: "#F2F3F5",
                                    borderWidth: 2,
                                    backgroundColor: "#fff",
                                    borderRadius: 8,
                                }}
                                placeholderStyle={{ color: "#999" }}
                            />
                        </View>
                        <View style={{ marginTop: 15 }}>
                            <TouchableOpacity style={styles.masTecnicos}><AntDesign name="plus" size={20} color="white" /></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
            <View>
                <TouchableOpacity
                    style={styles.botonSumit}
                >
                    <Text style={{ color: 'white', fontWeight: 800, fontSize: 20 }}>Crear Tarea</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#FFFFFF"
    },
    titulo: {
        fontSize: 18,
        fontWeight: 700,
    },
    input: {
        marginTop: 15,
        borderWidth: 2,
        borderColor: "#F2F3F5",
        borderRadius: 8,
        paddingLeft: 12,
        height: 50,
        justifyContent: "center"
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
        height: 50,
        justifyContent: "center"
    }
});

export default RegistrarTareasGestor