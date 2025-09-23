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
        <View style={{ flex: 1, paddingTop: 30 }}>
            <ScrollView
                contentContainerStyle={{ padding: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <Text>Sucursales del sistema</Text>
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
