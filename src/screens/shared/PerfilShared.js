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
  const { logout, profile, updateProfile } = useAuth();
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

  const handleToggleDarkMode = async () => {
    if (!profile) return;

    const previousValue = userData.modoOscuro;
    const nextValue = !previousValue;

    setUserData(prev => ({ ...prev, modoOscuro: nextValue }));

    try {
      await updateProfile({ ...profile, modoOscuro: nextValue });
    } catch (error) {
      console.error("Error actualizando modo oscuro:", error);
      Alert.alert("Error", "No se pudo actualizar el modo oscuro");
      setUserData(prev => ({ ...prev, modoOscuro: previousValue }));
    }
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            style={[styles.editButton, isEditing && styles.editButtonActive]}
          >
            <Feather name={isEditing ? "x" : "edit-2"} size={18} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.darkModeToggle,
              userData.modoOscuro && styles.darkModeToggleActive
            ]}
            onPress={handleToggleDarkMode}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={userData.modoOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            <Ionicons
              name={userData.modoOscuro ? "moon" : "sunny"}
              size={18}
              color={userData.modoOscuro ? "#fff" : "#1f2937"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Foto de perfil */}
      <View style={styles.photoSection}>
        <View style={styles.photoCard}>
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
      </View>

      {/* Campos editables */}
      <View style={styles.form}>
  <View style={styles.cardCombined}>
    {/* --- Datos personales --- */}
    <Text style={styles.sectionTitle}>Datos personales</Text>

    <View style={styles.fieldRow}>
      <View style={[styles.fieldContainer, styles.fieldHalf]}>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          value={userData.primerNombre}
          onChangeText={(text) => setUserData(p => ({ ...p, primerNombre: text }))}
          editable={isEditing}
          placeholder="Ingrese primer nombre"
        />
      </View>

      <View style={[styles.fieldContainer, styles.fieldHalf]}>
        <Text style={styles.label}>Segundo Nombre</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          value={userData.segundoNombre}
          onChangeText={(text) => setUserData(p => ({ ...p, segundoNombre: text }))}
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
          onChangeText={(text) => setUserData(p => ({ ...p, primerApellido: text }))}
          editable={isEditing}
          placeholder="Ingrese primer apellido"
        />
      </View>

      <View style={[styles.fieldContainer, styles.fieldHalf]}>
        <Text style={styles.label}>Segundo Apellido</Text>
        <TextInput
          style={[styles.input, !isEditing && styles.inputDisabled]}
          value={userData.segundoApellido}
          onChangeText={(text) => setUserData(p => ({ ...p, segundoApellido: text }))}
          editable={isEditing}
          placeholder="Ingrese segundo apellido"
        />
      </View>
    </View>

    {/* Divider */}
    <View style={styles.sectionDivider} />

    {/* --- Datos de contacto --- */}
    <Text style={styles.sectionTitle}>Datos de contacto</Text>

    <View style={styles.fieldContainer}>
      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        style={[styles.input, !isEditing && styles.inputDisabled]}
        value={userData.numTel}
        onChangeText={(text) => setUserData(p => ({ ...p, numTel: text }))}
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

    {/* Divider */}
    <View style={styles.sectionDivider} />

    {/* --- Información del sistema --- */}
    <Text style={styles.sectionTitle}>Información del sistema</Text>

    <View style={styles.fieldRow}>
      <View style={[styles.fieldContainer, styles.fieldHalf]}>
        <Text style={styles.label}>Rol</Text>
        <TextInput style={[styles.input, styles.inputDisabled]} value={userData.rol} editable={false} />
      </View>

      <View style={[styles.fieldContainer, styles.fieldHalf]}>
        <Text style={styles.label}>Estado</Text>
        <TextInput style={[styles.input, styles.inputDisabled]} value={userData.estado} editable={false} />
      </View>
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
    backgroundColor: "#f1f3f6",
  },
  contentContainer: {
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f3f6",
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#f4f7ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  editButtonActive: {
    backgroundColor: "#e0ecff",
    borderColor: "#bcd4ff",
  },
  darkModeToggle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  darkModeToggleActive: {
    backgroundColor: "#1f2937",
    borderColor: "#1f2937",
  },
  photoSection: {
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 2,
  },
  photoCard: {
    backgroundColor: "#e9ecef",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d0d5db",
  },
  photoWrapper: {
    position: "relative",
    marginBottom: 0,
  },
  profilePhoto: {
    width: 130,
    height: 130,
    borderRadius: 60,
    backgroundColor: "#d1d5db",
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
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: "#fff",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  changePhotoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  form: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 18,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  fieldHalf: {
    width: "48%",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  labelIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
  },
  modeSummary: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f6",
  },
  modeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modeIconWrapActive: {
    backgroundColor: "#1f2937",
    borderColor: "#1f2937",
  },
  modeSummaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  modeSummarySubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#6b7280",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  inputDisabled: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
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
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cardCombined: {
  backgroundColor: "#fff",
  borderRadius: 20,
  padding: 20,
  borderWidth: 1,
  borderColor: "#e5e7eb",
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 8,
  elevation: 2,
},

sectionTitle: {
  fontSize: 18,
  fontWeight: "700",
  color: "#1f2937",
  marginBottom: 14,
},

sectionDivider: {
  height: 1,
  backgroundColor: "#eef2f7",
  marginVertical: 10,      // compacta separación entre secciones
  borderRadius: 1,
},

});