import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import BotonRegistrar from '../../components/BotonRegistrar';

export default function TareasAdmin({ navigation }) {
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    };

    return (
        <View style={{ flex: 1, paddingTop: 30 }}>
            <ScrollView
                contentContainerStyle={{ padding: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <Text>Tareas del sistema</Text>
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
