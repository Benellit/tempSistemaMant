import { useState } from "react";
import { Button, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import BotonRegistrar from '../../components/BotonRegistrar';

export default function SucursalesAdmin({ navigation }) {
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 2000); // Simula carga de datos
    };

    return (
        <View style={{ flex: 1, marginTop: 30 }}>
            <ScrollView
                contentContainerStyle={{ padding: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <Text>Home</Text>
                <Button
                    title="Sucursal Zona Centro"
                    onPress={() => navigation.navigate("GestorTabs")}
                />
            </ScrollView>

            <View>
                <BotonRegistrar />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
