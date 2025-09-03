import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Login({ navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <TextInput placeholder="Username" style={styles.input} />
            <TextInput placeholder="Password" secureTextEntry style={styles.input} />
            <Button title="Login" onPress={() => alert("Login")} />
            <TouchableOpacity style={styles.title} onPress={() => navigation.navigate("AdminTabs")}><Text>Admin</Text></TouchableOpacity>
            <TouchableOpacity style={styles.title} onPress={() => navigation.navigate("GestorTabs")}><Text>Gestor</Text></TouchableOpacity>
            <TouchableOpacity style={styles.title} onPress={() => navigation.navigate("TecnicoTabs")}><Text>Técnico</Text></TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
    input: {
        width: "100%",
        height: 40,
        borderWidth: 1,
        borderColor: "#ccc",
        marginBottom: 15,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
});
