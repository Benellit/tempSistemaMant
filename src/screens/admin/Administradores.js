import { StyleSheet, Text, View } from 'react-native';

const Administradores = () => {
    return (
        <View style={styles.container}>
            <Text>Administradores</Text>
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