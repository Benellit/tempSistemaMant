import { StyleSheet, Text, View } from 'react-native';

export default function PerfilShared ({ navigation }) {
    return (
        <View style={styles.container}>
            <Text>Perfil Shared</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        padding: 20,
    }
});