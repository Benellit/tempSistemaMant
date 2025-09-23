import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import BotonRegistrar from '../../components/BotonRegistrar';

const Administradores = ({ navigation }) => {
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 2000); // Simula carga de datos
    };

    return (
        <View style={styles.container}>
            <Text>Administradores</Text>
            <ScrollView
                            contentContainerStyle={{ padding: 20 }}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                            }
                        >

                        </ScrollView>
            <BotonRegistrar />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 50,
    }
});

export default Administradores