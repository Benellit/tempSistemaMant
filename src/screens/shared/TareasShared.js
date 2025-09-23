import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import BotonRegistrar from '../../components/BotonRegistrar';
import { useAuth } from "../login/AuthContext";

import { useNavigation } from "@react-navigation/native";

export default function TareasShared({ navigation }) {
    const [refreshing, setRefreshing] = useState(false);
        navigation = useNavigation();
        const { profile } = useAuth();

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 2000); // Simula carga de datos
    };
    return (
        <View style={{ flex: 1, paddingTop: 30 }}>
            <ScrollView
                contentContainerStyle={{ padding: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View>
                    <Text>Tareas</Text>
                </View>
            </ScrollView>

            <View>
                {profile?.rol !== "Tecnico" && <BotonRegistrar />}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    }
});