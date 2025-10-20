import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { collection, doc, getDocs, getFirestore, query, setDoc, where } from "firebase/firestore";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import appFirebase, { cloudinaryConfig } from "../../credenciales/Credenciales";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";

const db = getFirestore(appFirebase);
const auth = getAuth(appFirebase);

const RegistrarUsuariosGestor = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(true);
  const [showRolModal, setShowRolModal] = useState(false);
  const [showSucursalModal, setShowSucursalModal] = useState(false);
  const [showEstadoModal, setShowEstadoModal] = useState(false);

  const roles = ["Tecnico"];
  const estados = ["Activo", "Inactivo"];

  const [formData, setFormData] = useState({
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    email: "",
    password: "",
    confirmPassword: "",
    numTel: "",
    fotoPerfil: "",
    rol: "Tecnico",
    IDSucursal: null,
    sucursalNombre: "",
    estado: "Activo",
    modoOscuro: false,
  });

  // Cargar sucursales disponibles
  useEffect(() => {
    const loadSucursales = async () => {
      try {
        const sucursalesSnapshot = await getDocs(collection(db, "SUCURSAL"));
        const sucursalesData = sucursalesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSucursales(sucursalesData);
      } catch (error) {
        console.error("Error cargando sucursales:", error);
        Alert.alert("Error", "No se pudieron cargar las sucursales");
      } finally {
        setLoadingSucursales(false);
      }
    };

    loadSucursales();
  }, []);

  // Función para subir imagen a Cloudinary
  const uploadImageToCloudinary = async (uri) => {
    try {
      const formDataImg = new FormData();

      const file = {
        uri,
        type: "image/jpeg",
        name: `user_${Date.now()}.jpg`,
      };

      formDataImg.append("file", file);
      formDataImg.append("upload_preset", cloudinaryConfig.uploadPreset);
      formDataImg.append("cloud_name", cloudinaryConfig.cloudName);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: "POST",
          body: formDataImg,
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error("No se recibió URL de la imagen");
      }
    } catch (error) {
      console.error("Error subiendo a Cloudinary:", error);
      throw error;
    }
  };

  // Función para seleccionar imagen
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se necesita permiso para acceder a la galería");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const imageUrl = await uploadImageToCloudinary(result.assets[0].uri);
        setFormData((prev) => ({ ...prev, fotoPerfil: imageUrl }));
        Alert.alert("Éxito", "Imagen cargada correctamente");
      }
    } catch (error) {
      console.error("Error seleccionando imagen:", error);
      Alert.alert("Error", "No se pudo cargar la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  // Función para tomar foto
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se necesita permiso para acceder a la cámara");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const imageUrl = await uploadImageToCloudinary(result.assets[0].uri);
        setFormData((prev) => ({ ...prev, fotoPerfil: imageUrl }));
        Alert.alert("Éxito", "Foto tomada correctamente");
      }
    } catch (error) {
      console.error("Error tomando foto:", error);
      Alert.alert("Error", "No se pudo tomar la foto");
    } finally {
      setUploadingImage(false);
    }
  };

  // Mostrar opciones para foto
  const handleAddPhoto = () => {
    Alert.alert(
      "Agregar foto de perfil",
      "Selecciona una opción",
      [
        {
          text: "Tomar foto",
          onPress: takePhoto,
        },
        {
          text: "Elegir de galería",
          onPress: pickImage,
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  // Validar formulario
  const validateForm = () => {
    if (!formData.primerNombre.trim()) {
      Alert.alert("Error", "El primer nombre es obligatorio");
      return false;
    }
    if (!formData.primerApellido.trim()) {
      Alert.alert("Error", "El primer apellido es obligatorio");
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert("Error", "El email es obligatorio");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert("Error", "El email no es válido");
      return false;
    }
    if (!formData.password) {
      Alert.alert("Error", "La contraseña es obligatoria");
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return false;
    }
    if (!formData.IDSucursal) {
      Alert.alert("Error", "Debe seleccionar una sucursal");
      return false;
    }
    return true;
  };

  // Registrar usuario
  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Verificar si el email ya existe
      const usersQuery = query(
        collection(db, "USUARIO"),
        where("email", "==", formData.email.toLowerCase())
      );
      const existingUsers = await getDocs(usersQuery);

      if (!existingUsers.empty) {
        Alert.alert("Error", "Ya existe un usuario con este email");
        setLoading(false);
        return;
      }

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Crear referencia a la sucursal
      const sucursalRef = doc(db, "SUCURSAL", formData.IDSucursal);

      // Guardar en Firestore
      await setDoc(doc(db, "USUARIO", userCredential.user.uid), {
        primerNombre: formData.primerNombre.trim(),
        segundoNombre: formData.segundoNombre.trim(),
        primerApellido: formData.primerApellido.trim(),
        segundoApellido: formData.segundoApellido.trim(),
        email: formData.email.trim().toLowerCase(),
        numTel: formData.numTel.trim(),
        fotoPerfil: formData.fotoPerfil,
        rol: formData.rol,
        IDSucursal: sucursalRef,
        estado: formData.estado,
        modoOscuro: formData.modoOscuro,
        fechaRegistro: new Date(),
      });

      Alert.alert("Éxito", "Usuario registrado correctamente", [
        {
          text: "OK",
          onPress: () => {
            // Resetear formulario
            setFormData({
              primerNombre: "",
              segundoNombre: "",
              primerApellido: "",
              segundoApellido: "",
              email: "",
              password: "",
              confirmPassword: "",
              numTel: "",
              fotoPerfil: "",
              rol: "Tecnico",
              IDSucursal: null,
              sucursalNombre: "",
              estado: "Activo",
              modoOscuro: false,
            });
            // Navegar atrás si es necesario
            if (navigation?.goBack) {
              navigation.goBack();
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Error registrando usuario:", error);
      let errorMessage = "No se pudo registrar el usuario";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "El email ya está en uso";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "El email no es válido";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "La contraseña es muy débil";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingSucursales) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registrar Usuario</Text>
      </View>

      {/* Foto de perfil */}
      <View style={styles.photoContainer}>
        <View style={styles.photoWrapper}>
          {formData.fotoPerfil ? (
            <Image source={{ uri: formData.fotoPerfil }} style={styles.profilePhoto} />
          ) : (
            <View style={[styles.profilePhoto, styles.photoPlaceholder]}>
              <AntDesign name="user" size={60} color="#999" />
            </View>
          )}

          {uploadingImage && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={handleAddPhoto}
          disabled={uploadingImage}
        >
          <Ionicons name="camera" size={20} color="#007AFF" />
          <Text style={styles.addPhotoText}>
            {formData.fotoPerfil ? "Cambiar foto" : "Agregar foto"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Formulario */}
      <View style={styles.form}>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Primer Nombre *</Text>
          <TextInput
            style={styles.input}
            value={formData.primerNombre}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, primerNombre: text }))}
            placeholder="Ingrese primer nombre"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Segundo Nombre</Text>
          <TextInput
            style={styles.input}
            value={formData.segundoNombre}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, segundoNombre: text }))}
            placeholder="Ingrese segundo nombre"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Primer Apellido *</Text>
          <TextInput
            style={styles.input}
            value={formData.primerApellido}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, primerApellido: text }))}
            placeholder="Ingrese primer apellido"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Segundo Apellido</Text>
          <TextInput
            style={styles.input}
            value={formData.segundoApellido}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, segundoApellido: text }))}
            placeholder="Ingrese segundo apellido"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
            placeholder="ejemplo@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Contraseña *</Text>
          <TextInput
            style={styles.input}
            value={formData.password}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, password: text }))}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Confirmar Contraseña *</Text>
          <TextInput
            style={styles.input}
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, confirmPassword: text }))}
            placeholder="Repita la contraseña"
            secureTextEntry
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={formData.numTel}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, numTel: text }))}
            placeholder="663-123-4567"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Rol *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowRolModal(true)}
          >
            <Text style={styles.selectButtonText}>{formData.rol}</Text>
            <Feather name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Sucursal *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowSucursalModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {formData.sucursalNombre || "Seleccione una sucursal"}
            </Text>
            <Feather name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Estado *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowEstadoModal(true)}
          >
            <Text style={styles.selectButtonText}>{formData.estado}</Text>
            <Feather name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Botón de registro */}
      <TouchableOpacity
        style={[styles.registerButton, loading && styles.registerButtonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Feather name="user-plus" size={20} color="#fff" />
            <Text style={styles.registerButtonText}>Registrar Usuario</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      {/* Modal para seleccionar Rol */}
      <Modal
        visible={showRolModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRolModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Rol</Text>
            {roles.map((rol) => (
              <TouchableOpacity
                key={rol}
                style={styles.modalOption}
                onPress={() => {
                  setFormData((prev) => ({ ...prev, rol }));
                  setShowRolModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{rol}</Text>
                {formData.rol === rol && (
                  <Feather name="check" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRolModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para seleccionar Sucursal */}
      <Modal
        visible={showSucursalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSucursalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Sucursal</Text>
            <ScrollView style={styles.modalScroll}>
              {sucursales.map((sucursal) => (
                <TouchableOpacity
                  key={sucursal.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData((prev) => ({
                      ...prev,
                      IDSucursal: sucursal.id,
                      sucursalNombre: sucursal.nombre || sucursal.id,
                    }));
                    setShowSucursalModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>
                    {sucursal.nombre || sucursal.id}
                  </Text>
                  {formData.IDSucursal === sucursal.id && (
                    <Feather name="check" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSucursalModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para seleccionar Estado */}
      <Modal
        visible={showEstadoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEstadoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Estado</Text>
            {estados.map((estado) => (
              <TouchableOpacity
                key={estado}
                style={styles.modalOption}
                onPress={() => {
                  setFormData((prev) => ({ ...prev, estado }));
                  setShowEstadoModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{estado}</Text>
                {formData.estado === estado && (
                  <Feather name="check" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowEstadoModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
  },
  photoContainer: {
    alignItems: "center",
    marginVertical: 30,
  },
  photoWrapper: {
    position: "relative",
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e0e0e0",
  },
  photoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  addPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
  },
  addPhotoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  form: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  selectButtonText: {
    fontSize: 16,
    color: "#333",
  },
  registerButton: {
    flexDirection: "row",
    backgroundColor: "#28a745",
    marginHorizontal: 20,
    marginTop: 30,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
});

export default RegistrarUsuariosGestor;