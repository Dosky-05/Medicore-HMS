import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(null);
  const [profile, setProfile]             = useState(null);         // staff profile
  const [patientProfile, setPatientProfile] = useState(null);       // patient profile
  const [loading, setLoading]             = useState(true);

  // Checks staff_profiles first, then patient_profiles.
  // Returns { type: 'staff'|'patient'|null, data }
  const resolveProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      setPatientProfile(null);
      return { type: null, data: null };
    }

    const { data: staffData } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (staffData) {
      setProfile(staffData);
      setPatientProfile(null);
      return { type: 'staff', data: staffData };
    }

    const { data: patientData } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (patientData) {
      setPatientProfile(patientData);
      setProfile(null);
      return { type: 'patient', data: patientData };
    }

    setProfile(null);
    setPatientProfile(null);
    return { type: null, data: null };
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      await resolveProfile(session?.user?.id ?? null);
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      await resolveProfile(session?.user?.id ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };

    const resolved = await resolveProfile(data.user.id);

    if (resolved.data?.is_active === false) {
      await supabase.auth.signOut();
      return { success: false, error: 'Your account has been deactivated. Contact your administrator.' };
    }

    return { success: true, userType: resolved.type };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // Admin-only: create staff account via Edge Function (avoids session side-effects)
  const createStaffAccount = async ({ name, email, password, role, doctor_id, department, phone }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff-account`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ name, email, password, role, doctor_id, department, phone }),
      }
    );
    const data = await res.json();
    return res.ok ? { success: true } : { success: false, error: data.error };
  };

  // Admin-only: create patient portal account via Edge Function
  const createPatientAccount = async (patientData) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-patient-account`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(patientData),
      }
    );
    const data = await res.json();
    return res.ok ? { success: true } : { success: false, error: data.error };
  };

  const deactivateStaff = async (profileId) => {
    const { error } = await supabase.from('staff_profiles').update({ is_active: false }).eq('id', profileId);
    return error ? { success: false, error: error.message } : { success: true };
  };

  const reactivateStaff = async (profileId) => {
    const { error } = await supabase.from('staff_profiles').update({ is_active: true }).eq('id', profileId);
    return error ? { success: false, error: error.message } : { success: true };
  };

  const deactivatePatient = async (profileId) => {
    const { error } = await supabase.from('patient_profiles').update({ is_active: false }).eq('id', profileId);
    return error ? { success: false, error: error.message } : { success: true };
  };

  const reactivatePatient = async (profileId) => {
    const { error } = await supabase.from('patient_profiles').update({ is_active: true }).eq('id', profileId);
    return error ? { success: false, error: error.message } : { success: true };
  };

  // Admin-only: reset any user's password (works for both staff and patients)
  const resetStaffPassword = async (userId, newPassword) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-staff-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ userId, newPassword }),
      }
    );
    const data = await res.json();
    return res.ok ? { success: true } : { success: false, error: data.error };
  };

  const refreshProfile = async () => { if (user?.id) await resolveProfile(user.id); };

  const userType       = profile ? 'staff' : patientProfile ? 'patient' : null;
  const isAdmin        = profile?.role === 'admin';
  const isDoctor       = profile?.role === 'doctor';
  const isReceptionist = profile?.role === 'receptionist';
  const canDelete      = isAdmin;
  const canManageStaff = isAdmin;

  return (
    <AuthContext.Provider value={{
      user, profile, patientProfile, userType, login, logout, loading,
      isAdmin, isDoctor, isReceptionist, canDelete, canManageStaff,
      createStaffAccount, createPatientAccount,
      deactivateStaff, reactivateStaff,
      deactivatePatient, reactivatePatient,
      resetStaffPassword, refreshProfile,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
