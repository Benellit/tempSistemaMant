import { useState } from "react";
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import BotonRegistrar from '../../components/BotonRegistrar';

export default function UsuariosGestor({ navigation }) {
        const [refreshing, setRefreshing] = useState(false);
        
        const onRefresh = () => {
            setRefreshing(true);
            setTimeout(() => {
                setRefreshing(false);
            }, 2000);
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
            </ScrollView>
            <View>
                <BotonRegistrar />
            </View>
        </View>
    )
}
