import { useEffect, useMemo, useState } from "react";
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
  StatusBar,
} from "react-native";
import {
  doc,
  getDoc,
  updateDoc,
  getFirestore,
  collection,
  getDocs,
} from "firebase/firestore";
import appFirebase, { cloudinaryConfig } from "../../credenciales/Credenciales";
import * as ImagePicker from "expo-image-picker";
import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../login/AuthContext";

const db = getFirestore(appFirebase);

// ======== TEMAS (mismos que PerfilShared) ========
const themeLight = {
  name: "light",
  bg: "#f1f3f6",
  card: "#ffffff",
  cardAlt: "#e9ecef",
  border: "#e5e7eb",
  borderSubtle: "#d0d5db",
  text: "#1f2937",
  textMuted: "#6b7280",
  inputBg: "#f9fafb",
  inputDisabledBg: "#f3f4f6",
  inputText: "#111827",
  placeholder: "#9ca3af",
  primary: "#007AFF",
  danger: "#d9534f",
  shadow: 0.08,
  divider: "#eef2f7",
  chipBg: "#f4f7ff",
  chipBorder: "#dbeafe",
  chipActiveBg: "#e0ecff",
  chipActiveBorder: "#bcd4ff",
  toggleBg: "#fff",
  toggleBorder: "#e5e7eb",
  toggleIcon: "#1f2937",
};

const themeDark = {
  name: "dark",
  bg: "#0b1220",
  card: "#101826",
  cardAlt: "#0f172a",
  border: "rgba(88, 79, 79, 0.51)",
  borderSubtle: "rgba(255,255,255,0.07)",
  text: "#e5e7eb",
  textMuted: "#9aa7b8",
  inputBg: "#0f172a",
  inputDisabledBg: "#0c1422",
  inputText: "#e5e7eb",
  placeholder: "#7b8796",
  primary: "#4ea8ff",
  danger: "#ef4444",
  shadow: 0.25,
  divider: "rgba(255,255,255,0.1)",
  chipBg: "#111a2a",
  chipBorder: "rgba(255,255,255,0.1)",
  chipActiveBg: "rgba(255,255,255,0.08)",
  chipActiveBorder: "rgba(255,255,255,0.2)",
  toggleBg: "#1f2937",
  toggleBorder: "#1f2937",
  toggleIcon: "#ffffff",
};

export default function PerfilUsuarioShared({ route, navigation }) {
  const { profile: currentUserProfile } = useAuth(); // perfil del logueado (para tema/ permisos)
  const { userId } = route.params; // ID del usuario que vemos/ editamos

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [sucursales, setSucursales] = useState([]);
  const [showRolModal, setShowRolModal] = useState(false);
  const [showSucursalModal, setShowSucursalModal] = useState(false);
  const [showEstadoModal, setShowEstadoModal] = useState(false);

  const roles = ["Tecnico", "Gestor", "Administrador"];
  const estados = ["Activo", "Inactivo"];

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
    modoOscuro: false, // del usuario objetivo (solo visual)
    IDSucursal: null,  // id string
    sucursalNombre: "",
    fechaRegistro: null,
  });

  // Permisos: Gestor o Admin pueden editar perfiles ajenos
  const canEdit =
    currentUserProfile?.rol === "Gestor" ||
    currentUserProfile?.rol === "Administrador";

  // Tema: usamos el modoOscuro del usuario logueado para coherencia global
  const theme = useMemo(
    () => (currentUserProfile?.modoOscuro ? themeDark : themeLight),
    [currentUserProfile?.modoOscuro]
  );
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Cargar sucursales
  useEffect(() => {
    const loadSucursales = async () => {
      try {
        const snap = await getDocs(collection(db, "SUCURSAL"));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSucursales(data);
      } catch (e) {
        console.error("Error cargando sucursales:", e);
      }
    };
    loadSucursales();
  }, []);

  // Cargar datos del usuario objetivo
  useEffect(() => {
    const loadUser = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const ref = doc(db, "USUARIO", userId);
        const userDoc = await getDoc(ref);
        if (!userDoc.exists()) {
          Alert.alert("Error", "Usuario no encontrado");
          navigation.goBack();
          return;
        }

        const data = userDoc.data();
        let sucursalNombre = "";
        let sucursalId = null;

        // Si IDSucursal es DocumentReference, resolver
        if (data.IDSucursal) {
          try {
            const sucRef =
              typeof data.IDSucursal.id === "string"
                ? data.IDSucursal
                : null;
            if (sucRef) {
              const sd = await getDoc(sucRef);
              if (sd.exists()) {
                sucursalNombre = sd.data().nombre || sd.id;
                sucursalId = sucRef.id;
              }
            }
          } catch (e) {
            console.error("Error resolviendo sucursal:", e);
          }
        }

        setUserData({
          primerNombre: data.primerNombre || "",
          segundoNombre: data.segundoNombre || "",
          primerApellido: data.primerApellido || "",
          segundoApellido: data.segundoApellido || "",
          email: data.email || "",
          numTel: data.numTel || "",
          fotoPerfil: data.fotoPerfil || "",
          rol: data.rol || "",
          estado: data.estado || "",
          modoOscuro: data.modoOscuro || false,
          IDSucursal: sucursalId || data.IDSucursal?.id || null,
          sucursalNombre:
            sucursalNombre ||
            sucursales.find((s) => s.id === (sucursalId || data.IDSucursal?.id))
              ?.nombre ||
            "",
          fechaRegistro: data.fechaRegistro || null,
        });
      } catch (e) {
        console.error("Error al cargar perfil:", e);
        Alert.alert("Error", "No se pudo cargar la información del perfil");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ===== Subir imagen a Cloudinary =====
  const uploadImageToCloudinary = async (uri) => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        type: "image/jpeg",
        name: `profile_${Date.now()}.jpg`,
      });
      formData.append("upload_preset", cloudinaryConfig.uploadPreset);
      formData.append("cloud_name", cloudinaryConfig.cloudName);

      const resp = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        { method: "POST", body: formData, headers: { Accept: "application/json" } }
      );
      const data = await resp.json();
      if (data.secure_url) return data.secure_url;
      throw new Error("No se recibió URL de la imagen");
    } catch (e) {
      console.error("Error subiendo a Cloudinary:", e);
      throw e;
    }
  };

  const pickImageFromGallery = async () => {
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
        const url = await uploadImageToCloudinary(result.assets[0].uri);
        setUserData((p) => ({ ...p, fotoPerfil: url }));
        Alert.alert("Éxito", "Imagen cargada correctamente");
      }
    } catch (e) {
      console.error("Error seleccionando imagen:", e);
      Alert.alert("Error", "No se pudo cargar la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  const takePhotoWithCamera = async () => {
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
        const url = await uploadImageToCloudinary(result.assets[0].uri);
        setUserData((p) => ({ ...p, fotoPerfil: url }));
        Alert.alert("Éxito", "Foto tomada correctamente");
      }
    } catch (e) {
      console.error("Error tomando foto:", e);
      Alert.alert("Error", "No se pudo tomar la foto");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert("Cambiar foto de perfil", "Selecciona una opción", [
      { text: "Tomar foto", onPress: takePhotoWithCamera },
      { text: "Elegir de galería", onPress: pickImageFromGallery },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  // ===== Guardar =====
  const handleSave = async () => {
    if (!userId) return;

    if (!userData.primerNombre.trim() || !userData.primerApellido.trim()) {
      Alert.alert("Error", "El nombre y apellido son obligatorios");
      return;
    }
    if (!userData.IDSucursal) {
      Alert.alert("Error", "Debe seleccionar una sucursal");
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, "USUARIO", userId);
      const sucursalRef = doc(db, "SUCURSAL", userData.IDSucursal);

      await updateDoc(userRef, {
        primerNombre: userData.primerNombre.trim(),
        segundoNombre: userData.segundoNombre.trim(),
        primerApellido: userData.primerApellido.trim(),
        segundoApellido: userData.segundoApellido.trim(),
        numTel: userData.numTel.trim(),
        fotoPerfil: userData.fotoPerfil.trim(),
        rol: userData.rol,
        estado: userData.estado,
        IDSucursal: sucursalRef,
        // No forzamos modoOscuro del usuario objetivo desde aquí
      });

      Alert.alert("Éxito", "Perfil actualizado correctamente");
      setIsEditing(false);
    } catch (e) {
      console.error("Error al guardar perfil:", e);
      Alert.alert("Error", "No se pudo actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle={theme.name === "dark" ? "light-content" : "dark-content"}
          backgroundColor={theme.bg}
        />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StatusBar
        barStyle={theme.name === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.card}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <Feather name="arrow-left" size={18} color={theme.primary} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center" }}>
  <Text
    style={[
      styles.subtitle,
      { 
        color: theme.textMuted,
        fontSize: 14,
        marginBottom: 0,
        letterSpacing: 0.3,
      },
    ]}
  >
    Perfil de usuario
  </Text>

  <Text
    style={[
      styles.title,
      {
        color: theme.primary,
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
        maxWidth: "80%", // evita que se salga
      },
    ]}
    numberOfLines={1}
    ellipsizeMode="tail"
  >
    {`${userData.primerNombre || ""} ${userData.primerApellido || ""}`.trim() ||
      "Usuario"}
  </Text>
</View>




        {canEdit ? (
          <TouchableOpacity
            onPress={() => setIsEditing((v) => !v)}
            style={[styles.editButton, isEditing && styles.editButtonActive]}
          >
            <Feather name={isEditing ? "x" : "edit-2"} size={18} color={theme.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Foto */}
      <View style={styles.photoSection}>
        <View style={styles.photoCard}>
          <View style={styles.photoWrapper}>
            {userData.fotoPerfil ? (
              <Image source={{ uri: userData.fotoPerfil }} style={styles.profilePhoto} />
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

          {canEdit && isEditing && !uploadingImage && (
            <TouchableOpacity style={styles.changePhotoButton} onPress={handleChangePhoto}>
              <Ionicons name="camera" size={20} color={theme.primary} />
              <Text style={styles.changePhotoText}>Cambiar foto</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FORM combinado (mismo patrón visual que PerfilShared) */}
      <View style={styles.form}>
        <View style={styles.cardCombined}>
          <Text style={styles.sectionTitle}>Datos personales</Text>

          <View style={styles.fieldRow}>
            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={[styles.input, (!isEditing || !canEdit) && styles.inputDisabled]}
                value={userData.primerNombre}
                onChangeText={(t) => setUserData((p) => ({ ...p, primerNombre: t }))}
                editable={isEditing && canEdit}
                placeholder="Ingrese primer nombre"
                placeholderTextColor={theme.placeholder}
              />
            </View>

            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Segundo Nombre</Text>
              <TextInput
                style={[styles.input, (!isEditing || !canEdit) && styles.inputDisabled]}
                value={userData.segundoNombre}
                onChangeText={(t) => setUserData((p) => ({ ...p, segundoNombre: t }))}
                editable={isEditing && canEdit}
                placeholder="Ingrese segundo nombre"
                placeholderTextColor={theme.placeholder}
              />
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Primer Apellido *</Text>
              <TextInput
                style={[styles.input, (!isEditing || !canEdit) && styles.inputDisabled]}
                value={userData.primerApellido}
                onChangeText={(t) => setUserData((p) => ({ ...p, primerApellido: t }))}
                editable={isEditing && canEdit}
                placeholder="Ingrese primer apellido"
                placeholderTextColor={theme.placeholder}
              />
            </View>

            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Segundo Apellido</Text>
              <TextInput
                style={[styles.input, (!isEditing || !canEdit) && styles.inputDisabled]}
                value={userData.segundoApellido}
                onChangeText={(t) => setUserData((p) => ({ ...p, segundoApellido: t }))}
                editable={isEditing && canEdit}
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
              style={[styles.input, (!isEditing || !canEdit) && styles.inputDisabled]}
              value={userData.numTel}
              onChangeText={(t) => setUserData((p) => ({ ...p, numTel: t }))}
              editable={isEditing && canEdit}
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

          {/* Rol */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Rol</Text>
              {canEdit && isEditing ? (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowRolModal(true)}
                >
                  <Text style={styles.selectButtonText}>{userData.rol || "Seleccionar"}</Text>
                  <Feather name="chevron-down" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              ) : (
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={userData.rol}
                  editable={false}
                  placeholderTextColor={theme.placeholder}
                />
              )}
            </View>

            {/* Estado */}
            <View style={[styles.fieldContainer, styles.fieldHalf]}>
              <Text style={styles.label}>Estado</Text>
              {canEdit && isEditing ? (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowEstadoModal(true)}
                >
                  <Text style={styles.selectButtonText}>
                    {userData.estado || "Seleccionar"}
                  </Text>
                  <Feather name="chevron-down" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              ) : (
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={userData.estado}
                  editable={false}
                  placeholderTextColor={theme.placeholder}
                />
              )}
            </View>
          </View>

          {/* Sucursal */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Sucursal</Text>
            {canEdit && isEditing ? (
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowSucursalModal(true)}
              >
                <Text style={styles.selectButtonText}>
                  {userData.sucursalNombre || "Seleccione una sucursal"}
                </Text>
                <Feather name="chevron-down" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            ) : (
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={userData.sucursalNombre}
                editable={false}
                placeholderTextColor={theme.placeholder}
              />
            )}
          </View>

          {userData.fechaRegistro && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Fecha de Registro</Text>
              <Text style={styles.infoText}>
                {userData.fechaRegistro?.toDate?.()?.toLocaleDateString() || "N/A"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Botón Guardar */}
      {canEdit && isEditing && (
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Guardar Cambios</Text>}
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />

      {/* MODALES */}
      {/* Rol */}
      <Modal
        visible={showRolModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRolModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Rol</Text>
            <ScrollView style={styles.modalScroll}>
              {roles.map((rol) => (
                <TouchableOpacity
                  key={rol}
                  style={styles.modalOption}
                  onPress={() => {
                    setUserData((p) => ({ ...p, rol }));
                    setShowRolModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{rol}</Text>
                  {userData.rol === rol && <Feather name="check" size={18} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowRolModal(false)}>
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Estado */}
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
                  setUserData((p) => ({ ...p, estado }));
                  setShowEstadoModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{estado}</Text>
                {userData.estado === estado && <Feather name="check" size={18} color={theme.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowEstadoModal(false)}>
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sucursal */}
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
              {sucursales.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setUserData((p) => ({
                      ...p,
                      IDSucursal: s.id,
                      sucursalNombre: s.nombre || s.id,
                    }));
                    setShowSucursalModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{s.nombre || s.id}</Text>
                  {userData.IDSucursal === s.id && <Feather name="check" size={18} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowSucursalModal(false)}>
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ======== ESTILOS DINÁMICOS (idéntico patrón que PerfilShared) ========
function createStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    contentContainer: { paddingBottom: 48 },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.bg,
    },
    loadingText: { marginTop: 10, fontSize: 16, color: theme.textMuted },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 40,
      paddingBottom: 20,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor:
       theme.name === "dark"
      ? "rgba(69,72,82,0.85)"   // <- antes tenías casi blanco
      : "rgba(0,0,0,0.08)",
},
    headerIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.chipBorder,
      backgroundColor: theme.chipBg,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10
    },
    headerSpacer: { width: 40, height: 40 }, // ocupa el lugar del botón de editar cuando no hay permisos
    title: { fontSize: 26, fontWeight: "700", color: theme.text },

    editButton: {
      width: 40,
      height: 40,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.chipBorder,
      backgroundColor: theme.chipBg,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    editButtonActive: {
      backgroundColor: theme.chipActiveBg,
      borderColor: theme.chipActiveBorder,
    },

    photoSection: { paddingHorizontal: 16, marginTop: 14, marginBottom: 2 },
    photoCard: {
      backgroundColor: theme.cardAlt,
      borderRadius: 24,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    photoWrapper: { position: "relative" },
    profilePhoto: {
      width: 130,
      height: 130,
      borderRadius: 60,
      backgroundColor: theme.inputDisabledBg,
    },
    photoPlaceholder: { justifyContent: "center", alignItems: "center" },
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
    changePhotoText: { marginLeft: 8, fontSize: 14, color: theme.primary, fontWeight: "600" },

    form: { paddingHorizontal: 16, marginTop: 16 },
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
    sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 14 },
    sectionDivider: { height: 1, backgroundColor: theme.divider, marginVertical: 10, borderRadius: 1 },

    fieldContainer: { marginBottom: 18 },
    fieldRow: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap" },
    fieldHalf: { width: "48%" },
    label: { fontSize: 13, fontWeight: "500", color: theme.textMuted, marginBottom: 6 },
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
    inputDisabled: { backgroundColor: theme.inputDisabledBg, color: theme.textMuted },

    selectButton: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  borderWidth: 1,
  borderColor: theme.border,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  backgroundColor: theme.inputBg,     // <- igual que inputs
  shadowColor: "#000",
  shadowOpacity: theme.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  elevation: 2,
},

    selectButtonText: { fontSize: 15, color: theme.inputText },

    infoText: {
      fontSize: 15,
      color: theme.textMuted,
      padding: 12,
      backgroundColor: theme.inputDisabledBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
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
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

    // Modales
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalContent: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: "75%",
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16, textAlign: "center", color: theme.text },
    modalScroll: { maxHeight: 320 },
    modalOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    modalOptionText: { fontSize: 16, color: theme.inputText },
    modalCloseButton: {
      marginTop: 14,
      padding: 14,
      backgroundColor: theme.cardAlt,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    modalCloseButtonText: { fontSize: 16, color: theme.textMuted, fontWeight: "600" },
  });
}
