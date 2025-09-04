import { StyleSheet, Text, View } from 'react-native';

export default function HomeGestor ({ navigation }) {
    return (
        <View style={style.container}>
            <Text>Home de los gestores</Text>
        </View>
    )
}

const style = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 30,
        padding: 20,
    }
});
