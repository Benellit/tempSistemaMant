import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebaseApp";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        
  const [profile, setProfile] = useState(null);  
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "USUARIO", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setProfile(snap.data());
        else {
          const base = { email: u.email, estado: "Activo", rol: "Tecnico", fechaRegistro: serverTimestamp() };
          await setDoc(ref, base);
          setProfile(base);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const register = async (email, password, extra = {}) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "USUARIO", user.uid), {
      email, estado: "Activo", rol: extra.rol ?? "Tecnico",
      fechaRegistro: serverTimestamp(), ...extra,
    });
  };
  const logout = () => signOut(auth);

  const value = useMemo(() => ({ user, profile, loading, login, register, logout }), [user, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
