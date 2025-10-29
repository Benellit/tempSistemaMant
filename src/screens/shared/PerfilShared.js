import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { useAuth } from "../login/AuthContext";
import { doc, updateDoc, getFirestore } from "firebase/firestore";
import appFirebase from "../../credenciales/Credenciales";
import { cloudinaryConfig } from "../../credenciales/Credenciales";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";

const db = getFirestore(appFirebase);

// ========= TEMAS =========
// ========= TEMAS (frío-neutro) =========
const themeLight = {
  name: "light",
  // Bases
  bg: "#F5F6F8",            // más neutro que #f1f3f6
  card: "#FFFFFF",
  cardAlt: "#F0F2F5",
  // Texto
  text: "#1F242B",          // gris neutro frío (menos azulado)
  textMuted: "#7E8792",
  // Bordes / divisores
  border: "#E6E8EB",
  borderSubtle: "#ECEFF2",
  divider: "#EDEFf2",
  // Inputs
  inputBg: "#FAFBFC",
  inputDisabledBg: "#F2F4F6",
  inputText: "#151A20",
  placeholder: "#9AA1AA",
  // Accento
  primary: "#3A7AFE",       // azul más sobrio que #007AFF
  danger: "#D9534F",
  // UI chips / toggles
  chipBg: "#F7F9FC",
  chipBorder: "#E3E8EF",
  chipActiveBg: "#EBF2FF",
  chipActiveBorder: "#D7E4FF",
  toggleBg: "#FFFFFF",
  toggleBorder: "#E6E8EB",
  toggleIcon: "#1F242B",
  // Sombra
  shadow: 0.08,
};

const themeDark = {
  name: "dark",
  // Bases
  bg: "#121418",            // neutro frío (menos azulado que #0b1220)
  card: "#171A20",
  cardAlt: "#1B1F26",
  // Texto
  text: "#E6EAF0",
  textMuted: "#9AA4B0",
  // Bordes / divisores
  border: "rgba(255,255,255,0.12)",
  borderSubtle: "rgba(255,255,255,0.08)",
  divider: "rgba(255,255,255,0.10)",
  // Inputs
  inputBg: "#151A20",
  inputDisabledBg: "#14181E",
  inputText: "#E6EAF0",
  placeholder: "#8F98A3",
  // Accento
  primary: "#5B86FF",       // azul más neutro, no tan celeste
  danger: "#EF4444",
  // UI chips / toggles
  chipBg: "#1A1F26",
  chipBorder: "rgba(255,255,255,0.10)",
  chipActiveBg: "rgba(255,255,255,0.08)",
  chipActiveBorder: "rgba(255,255,255,0.22)",
  toggleBg: "#20242B",
  toggleBorder: "#20242B",
  toggleIcon: "#FFFFFF",
  // Sombra
  shadow: 0.22,
};



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
    fechaRegistro: null,
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
        fechaRegistro: profile.fechaRegistro || null,
      });
      setLoading(false);
    }
  }, [profile]);

  // Tema actual (se recalcula cuando cambia modoOscuro)
  const theme = useMemo(
  () => (userData.modoOscuro ? themeDark : themeLight),
  [userData.modoOscuro]
);


  const styles = useMemo(() => createStyles(theme), [theme]);

  // Subir imagen a Cloudinary
  const uploadImageToCloudinary = async (uri) => {
    try {
      const formData = new FormData();

      const file = {
        uri,
        type: "image/jpeg",
        name: `profile_${Date.now()}.jpg`,
      };

      formData.append("file", file);
      formData.append("upload_preset", cloudinaryConfig.uploadPreset);
      formData.append("cloud_name", cloudinaryConfig.cloudName);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        }
      );

      const data = await response.json();

      if (data.secure_url) return data.secure_url;
      throw new Error("No se recibió URL de la imagen");
    } catch (error) {
      console.error("Error subiendo a Cloudinary:", error);
      throw error;
    }
  };

  // Galería
  const pickImageFromGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Se necesita permiso para acceder a la galería"
        );
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
        const imageUrl = await uploadImageToCloudinary(
          result.assets[0].uri
        );
        setUserData((prev) => ({ ...prev, fotoPerfil: imageUrl }));
        Alert.alert("Éxito", "Imagen cargada correctamente");
      }
    } catch (error) {
      console.error("Error seleccionando imagen:", error);
      Alert.alert("Error", "No se pudo cargar la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  // Cámara
  const takePhotoWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Se necesita permiso para acceder a la cámara"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const imageUrl = await uploadImageToCloudinary(
          result.assets[0].uri
        );
        setUserData((prev) => ({ ...prev, fotoPerfil: imageUrl }));
        Alert.alert("Éxito", "Foto tomada correctamente");
      }
    } catch (error) {
      console.error("Error tomando foto:", error);
      Alert.alert("Error", "No se pudo tomar la foto");
    } finally {
      setUploadingImage(false);
    }
  };

  // Cambiar foto
  const handleChangePhoto = () => {
    Alert.alert("Cambiar foto de perfil", "Selecciona una opción", [
      { text: "Tomar foto", onPress: takePhotoWithCamera },
      { text: "Elegir de galería", onPress: pickImageFromGallery },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!profile?.id) return;

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
        modoOscuro: userData.modoOscuro,
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
    const prev = userData.modoOscuro;
    const next = !prev;
    setUserData((p) => ({ ...p, modoOscuro: next }));
    try {
      await updateProfile({ ...profile, modoOscuro: next });
    } catch (error) {
      console.error("Error actualizando modo oscuro:", error);
      Alert.alert("Error", "No se pudo actualizar el modo oscuro");
      setUserData((p) => ({ ...p, modoOscuro: prev }));
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer]}>
        <StatusBar
          barStyle={theme.name === "dark" ? "light-content" : "dark-content"}
          backgroundColor={theme.bg}
        />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle={theme.name === "dark" ? "light-content" : "dark-content"}
          backgroundColor={theme.bg}
        />
        <Text style={{ color: theme.text }}>No hay sesión activa</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <StatusBar
        barStyle={theme.name === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.card}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mi perfil</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            style={[
              styles.editButton,
              isEditing && styles.editButtonActive,
            ]}
          >
            <Feather
              name={isEditing ? "x" : "edit-2"}
              size={18}
              color={theme.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.darkModeToggle,
              userData.modoOscuro && styles.darkModeToggleActive,
            ]}
            onPress={handleToggleDarkMode}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={
            userData.modoOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
          }

          >
            <Ionicons
            name={userData.modoOscuro ? "sunny" : "moon"}
            size={18}
            color={theme.toggleIcon}
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
                <AntDesign name="user" size={60} color={theme.placeholder} />
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
              <Ionicons name="camera" size={20} color={theme.primary} />
              <Text style={styles.changePhotoText}>Cambiar foto</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Formulario */}
      <View style={styles.form}>
        <View style={styles.cardCombined}>
          <Text style={styles.sectionTitle}>Datos personales</Text>

          <View style={styles.fieldRow}>
            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={[
                  styles.input,
                  !isEditing && styles.inputDisabled,
                ]}
                value={userData.primerNombre}
                onChangeText={(text) =>
                  setUserData((p) => ({ ...p, primerNombre: text }))
                }
                editable={isEditing}
                placeholder="Ingrese primer nombre"
                placeholderTextColor={theme.placeholder}
              />
            </View>

            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Segundo Nombre</Text>
              <TextInput
                style={[
                  styles.input,
                  !isEditing && styles.inputDisabled,
                ]}
                value={userData.segundoNombre}
                onChangeText={(text) =>
                  setUserData((p) => ({ ...p, segundoNombre: text }))
                }
                editable={isEditing}
                placeholder="Ingrese segundo nombre"
                placeholderTextColor={theme.placeholder}
              />
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Primer Apellido *</Text>
              <TextInput
                style={[
                  styles.input,
                  !isEditing && styles.inputDisabled,
                ]}
                value={userData.primerApellido}
                onChangeText={(text) =>
                  setUserData((p) => ({ ...p, primerApellido: text }))
                }
                editable={isEditing}
                placeholder="Ingrese primer apellido"
                placeholderTextColor={theme.placeholder}
              />
            </View>

            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Segundo Apellido</Text>
              <TextInput
                style={[
                  styles.input,
                  !isEditing && styles.inputDisabled,
                ]}
                value={userData.segundoApellido}
                onChangeText={(text) =>
                  setUserData((p) => ({ ...p, segundoApellido: text }))
                }
                editable={isEditing}
                placeholder="Ingrese segundo apellido"
                placeholderTextColor={theme.placeholder}
              />
            </View>
          </View>

          <View style={styles.sectionDivider} />

          <Text style={styles.sectionTitle}>Datos de contacto</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={[
                styles.input,
                !isEditing && styles.inputDisabled,
              ]}
              value={userData.numTel}
              onChangeText={(text) =>
                setUserData((p) => ({ ...p, numTel: text }))
              }
              editable={isEditing}
              placeholder="663-123-4567"
              keyboardType="phone-pad"
              placeholderTextColor={theme.placeholder}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={userData.email}
              editable={false}
              placeholderTextColor={theme.placeholder}
            />
          </View>

          <View style={styles.sectionDivider} />

          <Text style={styles.sectionTitle}>Información del sistema</Text>

          <View style={styles.fieldRow}>
            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Rol</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={userData.rol}
                editable={false}
                placeholderTextColor={theme.placeholder}
              />
            </View>

            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Estado</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={userData.estado}
                editable={false}
                placeholderTextColor={theme.placeholder}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Botones */}
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

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons
          name="log-out-outline"
          size={20}
          color="#fff"
          style={styles.logoutIcon}
        />
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ========= ESTILOS DINÁMICOS POR TEMA =========
function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    contentContainer: {
      paddingBottom: 48,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.bg,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.textMuted,
    },
    header: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 20,
  paddingTop: 60,
  paddingBottom: 28,
  backgroundColor: theme.card,
  borderBottomWidth: 1,
  // Antes: condicional con rgba(...).
  // Ahora: usa el tono sutil del tema para mantener coherencia neutra.
  borderBottomColor: theme.borderSubtle,
},


    headerActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    title: {
      fontSize: 26,
      fontWeight: "900",
      marginTop: -10,
      color: theme.text,
    },
    editButton: {
      width: 40,
      height: 40,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.chipBorder,
      backgroundColor: theme.chipBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      marginTop: -10,
      
    },
    editButtonActive: {
      backgroundColor: theme.chipActiveBg,
      borderColor: theme.chipActiveBorder,
    },
    darkModeToggle: {
      width: 40,
      height: 40,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.toggleBorder,
      backgroundColor: theme.toggleBg,
      alignItems: "center",
      justifyContent: "center",
      marginTop: -10,
    },
    darkModeToggleActive: {
      backgroundColor: theme.toggleBg,
      borderColor: theme.toggleBorder,
    },
    photoSection: {
      paddingHorizontal: 16,
      marginTop: 14,
      marginBottom: 2,
    },
    photoCard: {
      backgroundColor: theme.cardAlt,
      borderRadius: 24,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    photoWrapper: {
      position: "relative",
      marginBottom: 0,
    },
    profilePhoto: {
      width: 130,
      height: 130,
      borderRadius: 60,
      backgroundColor: theme.inputDisabledBg,
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
      backgroundColor: theme.card,
      borderRadius: 24,
      shadowColor: "#000",
      shadowOpacity: theme.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    changePhotoText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme.primary,
      fontWeight: "600",
    },
    form: {
      paddingHorizontal: 16,
      marginTop: 16,
    },
    cardCombined: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOpacity: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 14,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: theme.divider,
      marginVertical: 10,
      borderRadius: 1,
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
    label: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.textMuted,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: theme.inputText,
      backgroundColor: theme.inputBg,
    },
    inputDisabled: {
      backgroundColor: theme.inputDisabledBg,
      color: theme.textMuted,
    },
    saveButton: {
      backgroundColor: theme.primary,
      marginHorizontal: 16,
      marginTop: 20,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: theme.shadow,
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
      backgroundColor: theme.danger,
      marginHorizontal: 16,
      marginTop: 20,
      padding: 16,
      borderRadius: 12,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: theme.shadow,
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
  });
}
