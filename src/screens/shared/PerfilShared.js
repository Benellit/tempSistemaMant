import { useEffect, useState } from "react";
import { 
  ActivityIndicator, 
  Alert, 
  Image, 
  ScrollView, 
  StyleSheet, 
  Switch, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
} from "react-native";
import { useAuth } from "../login/AuthContext";
import { doc, updateDoc, getFirestore } from "firebase/firestore";
import appFirebase from "../../credenciales/Credenciales";
import { cloudinaryConfig } from "../../credenciales/Credenciales";
import * as ImagePicker from 'expo-image-picker';
import Feather from '@expo/vector-icons/Feather';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';

const db = getFirestore(appFirebase);

export default function PerfilShared({ navigation }) {
  const { logout, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para los campos del perfil
  const [userData, setUserData] = useState({
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    email: "",
    numTel: "",
    fotoPerfil: "",
    rol: "",
    estado: "",
    modoOscuro: false,
    IDSucursal: null,
    fechaRegistro: null
  });

  // Cargar datos del usuario desde el profile del contexto
  useEffect(() => {
    if (profile) {
      setUserData({
        primerNombre: profile.primerNombre || "",
        segundoNombre: profile.segundoNombre || "",
        primerApellido: profile.primerApellido || "",
        segundoApellido: profile.segundoApellido || "",
        email: profile.email || "",
        numTel: profile.numTel || "",
        fotoPerfil: profile.fotoPerfil || "",
        rol: profile.rol || "",
        estado: profile.estado || "",
        modoOscuro: profile.modoOscuro || false,
        IDSucursal: profile.IDSucursal || null,
        fechaRegistro: profile.fechaRegistro || null
      });
      setLoading(false);
    }
  }, [profile]);

  // Función para subir imagen a Cloudinary
  const uploadImageToCloudinary = async (uri) => {
    try {
      const formData = new FormData();
      
      // Crear el objeto de archivo para React Native
      const file = {
        uri,
        type: 'image/jpeg',
        name: `profile_${Date.now()}.jpg`,
      };

      formData.append('file', file);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);
      formData.append('cloud_name', cloudinaryConfig.cloudName);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error('No se recibió URL de la imagen');
      }
    } catch (error) {
      console.error('Error subiendo a Cloudinary:', error);
      throw error;
    }
  };

  // Función para seleccionar imagen de la galería
  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita permiso para acceder a la galería');
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
        setUserData(prev => ({ ...prev, fotoPerfil: imageUrl }));
        Alert.alert('Éxito', 'Imagen cargada correctamente');
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo cargar la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  // Función para tomar foto con la cámara
  const takePhotoWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita permiso para acceder a la cámara');
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
        setUserData(prev => ({ ...prev, fotoPerfil: imageUrl }));
        Alert.alert('Éxito', 'Foto tomada correctamente');
      }
    } catch (error) {
      console.error('Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    } finally {
      setUploadingImage(false);
    }
  };

  // Mostrar opciones para cambiar foto
  const handleChangePhoto = () => {
    Alert.alert(
      'Cambiar foto de perfil',
      'Selecciona una opción',
      [
        {
          text: 'Tomar foto',
          onPress: takePhotoWithCamera,
        },
        {
          text: 'Elegir de galería',
          onPress: pickImageFromGallery,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Guardar cambios en Firestore
  const handleSave = async () => {
    if (!profile?.id) return;

    // Validación básica
    if (!userData.primerNombre.trim() || !userData.primerApellido.trim()) {
      Alert.alert("Error", "El nombre y apellido son obligatorios");
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, "USUARIO", profile.id);
      await updateDoc(userRef, {
        primerNombre: userData.primerNombre.trim(),
        segundoNombre: userData.segundoNombre.trim(),
        primerApellido: userData.primerApellido.trim(),
        segundoApellido: userData.segundoApellido.trim(),
        numTel: userData.numTel.trim(),
        fotoPerfil: userData.fotoPerfil.trim(),
        modoOscuro: userData.modoOscuro
      });

      Alert.alert("Éxito", "Perfil actualizado correctamente");
      setIsEditing(false);
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      Alert.alert("Error", "No se pudo actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const toggleSwitch = (value) => {
    setUserData(prev => ({ ...prev, modoOscuro: value }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>No hay sesión activa</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil</Text>
        <TouchableOpacity 
          onPress={() => setIsEditing(!isEditing)}
          style={styles.editButton}
        >
          <Feather name={isEditing ? "x" : "edit-2"} size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Foto de perfil */}
      <View style={styles.photoContainer}>
        <View style={styles.photoWrapper}>
          {userData.fotoPerfil ? (
            <Image 
              source={{ uri: userData.fotoPerfil }} 
              style={styles.profilePhoto}
            />
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

        {isEditing && !uploadingImage && (
          <TouchableOpacity 
            style={styles.changePhotoButton}
            onPress={handleChangePhoto}
          >
            <Ionicons name="camera" size={20} color="#007AFF" />
            <Text style={styles.changePhotoText}>Cambiar foto</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Campos editables */}
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos personales</Text>
          <View style={styles.fieldRow}>
            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Primer Nombre *</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={userData.primerNombre}
                onChangeText={(text) => setUserData(prev => ({ ...prev, primerNombre: text }))}
                editable={isEditing}
                placeholder="Ingrese primer nombre"
              />
            </View>

            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Segundo Nombre</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={userData.segundoNombre}
                onChangeText={(text) => setUserData(prev => ({ ...prev, segundoNombre: text }))}
                editable={isEditing}
                placeholder="Ingrese segundo nombre"
              />
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Primer Apellido *</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={userData.primerApellido}
                onChangeText={(text) => setUserData(prev => ({ ...prev, primerApellido: text }))}
                editable={isEditing}
                placeholder="Ingrese primer apellido"
              />
            </View>

            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Segundo Apellido</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={userData.segundoApellido}
                onChangeText={(text) => setUserData(prev => ({ ...prev, segundoApellido: text }))}
                editable={isEditing}
                placeholder="Ingrese segundo apellido"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de contacto</Text>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={userData.numTel}
              onChangeText={(text) => setUserData(prev => ({ ...prev, numTel: text }))}
              editable={isEditing}
              placeholder="663-123-4567"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={userData.email}
              editable={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del sistema</Text>
          <View style={styles.fieldRow}>
            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Rol</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={userData.rol}
                editable={false}
              />
            </View>

            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Estado</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={userData.estado}
                editable={false}
              />
            </View>
          </View>

          <View style={[styles.switchContainer, !isEditing && styles.switchDisabled]}>
            <Text style={styles.label}>Modo oscuro</Text>
            <Switch
              value={userData.modoOscuro}
              onValueChange={toggleSwitch}
              disabled={!isEditing}
            />
          </View>
        </View>
      </View>

      {/* Botones de acción */}
      {isEditing && (
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={logout}
      >
        <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  editButton: {
    padding: 8,
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
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
  },
  changePhotoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  form: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  fieldHalf: {
    flexBasis: "48%",
  
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
  inputDisabled: {
    backgroundColor: "#f9f9f9",
    color: "#666",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
  },
   switchDisabled: {
    opacity: 0.7,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#d9534f",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});