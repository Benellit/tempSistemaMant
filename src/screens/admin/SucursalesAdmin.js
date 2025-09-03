import { Button, StyleSheet, Text, View } from 'react-native';

export default function SucursalesAdmin({ navigation }) {
    return (
        <View style={styles.container}>
            <Text>Home</Text>
            <Button title='Sucursal Zona Centro'  onPress={() => navigation.navigate("GestorTabs")}></Button>
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
