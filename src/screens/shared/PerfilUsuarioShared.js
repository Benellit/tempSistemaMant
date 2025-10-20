import { useEffect, useState } from "react";
import { 
  ActivityIndicator, 
  Alert, 
  Image, 
  Modal,
  ScrollView, 
  StyleSheet, 
  Switch, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
} from "react-native";
import { doc, getDoc, updateDoc, getFirestore } from "firebase/firestore";
import { collection, getDocs } from "firebase/firestore";
import appFirebase, { cloudinaryConfig } from "../../credenciales/Credenciales";
import * as ImagePicker from "expo-image-picker";
import Feather from '@expo/vector-icons/Feather';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from "../login/AuthContext";

const db = getFirestore(appFirebase);

export default function PerfilUsuarioShared({ route, navigation }) {
  const { profile: currentUserProfile } = useAuth();
  const { userId } = route.params; // ID del usuario a visualizar/editar
  
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
    sucursalNombre: "",
    fechaRegistro: null
  });

  // Verificar si el usuario actual puede editar
  const canEdit = currentUserProfile?.rol === "Gestor" || currentUserProfile?.rol === "Administrador";

  // Cargar sucursales
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
      }
    };

    loadSucursales();
  }, []);

  // Cargar datos del usuario desde Firestore
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "USUARIO", userId));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // Obtener nombre de sucursal si existe la referencia
          let sucursalNombre = "";
          if (data.IDSucursal) {
            try {
              const sucursalDoc = await getDoc(data.IDSucursal);
              if (sucursalDoc.exists()) {
                sucursalNombre = sucursalDoc.data().nombre || sucursalDoc.id;
              }
            } catch (error) {
              console.error("Error cargando sucursal:", error);
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
            IDSucursal: data.IDSucursal?.id || null,
            sucursalNombre: sucursalNombre,
            fechaRegistro: data.fechaRegistro || null
          });
        } else {
          Alert.alert("Error", "Usuario no encontrado");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
        Alert.alert("Error", "No se pudo cargar la información del perfil");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  // Función para subir imagen a Cloudinary
  const uploadImageToCloudinary = async (uri) => {
    try {
      const formData = new FormData();
      
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
    if (!userId) return;

    // Validación básica
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Perfil de Usuario</Text>
        {canEdit && (
          <TouchableOpacity 
            onPress={() => setIsEditing(!isEditing)}
            style={styles.editButton}
          >
            <Feather name={isEditing ? "x" : "edit-2"} size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
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

        {canEdit && isEditing && !uploadingImage && (
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
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Primer Nombre *</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={userData.primerNombre}
            onChangeText={(text) => setUserData(prev => ({ ...prev, primerNombre: text }))}
            editable={canEdit && isEditing}
            placeholder="Ingrese primer nombre"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Segundo Nombre</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={userData.segundoNombre}
            onChangeText={(text) => setUserData(prev => ({ ...prev, segundoNombre: text }))}
            editable={canEdit && isEditing}
            placeholder="Ingrese segundo nombre"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Primer Apellido *</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={userData.primerApellido}
            onChangeText={(text) => setUserData(prev => ({ ...prev, primerApellido: text }))}
            editable={canEdit && isEditing}
            placeholder="Ingrese primer apellido"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Segundo Apellido</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={userData.segundoApellido}
            onChangeText={(text) => setUserData(prev => ({ ...prev, segundoApellido: text }))}
            editable={canEdit && isEditing}
            placeholder="Ingrese segundo apellido"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={userData.numTel}
            onChangeText={(text) => setUserData(prev => ({ ...prev, numTel: text }))}
            editable={canEdit && isEditing}
            placeholder="663-123-4567"
            keyboardType="phone-pad"
          />
        </View>

        {/* Campos no editables */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={userData.email}
            editable={false}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Rol</Text>
          {canEdit && isEditing ? (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowRolModal(true)}
            >
              <Text style={styles.selectButtonText}>{userData.rol}</Text>
              <Feather name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          ) : (
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={userData.rol}
              editable={false}
            />
          )}
        </View>

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
              <Feather name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          ) : (
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={userData.sucursalNombre}
              editable={false}
            />
          )}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Estado</Text>
          {canEdit && isEditing ? (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowEstadoModal(true)}
            >
              <Text style={styles.selectButtonText}>{userData.estado}</Text>
              <Feather name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          ) : (
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={userData.estado}
              editable={false}
            />
          )}
        </View>

        {/* Switch de modo oscuro */}
        <View style={styles.switchContainer}>
          <Text style={styles.label}>
            {userData.modoOscuro ? "Modo Oscuro" : "Modo Claro"}
          </Text>
          <Switch
            value={userData.modoOscuro}
            onValueChange={toggleSwitch}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={userData.modoOscuro ? "#f5dd4b" : "#f4f3f4"}
            disabled={!canEdit || !isEditing}
          />
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

      {/* Botones de acción */}
      {canEdit && isEditing && (
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
                  setUserData((prev) => ({ ...prev, rol }));
                  setShowRolModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{rol}</Text>
                {userData.rol === rol && (
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
                    setUserData((prev) => ({
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
                  {userData.IDSucursal === sucursal.id && (
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
                  setUserData((prev) => ({ ...prev, estado }));
                  setShowEstadoModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{estado}</Text>
                {userData.estado === estado && (
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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    flex: 1,
    marginLeft: 10,
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
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 16,
    color: "#666",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
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