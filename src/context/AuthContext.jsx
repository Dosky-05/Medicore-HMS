import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

const PROFILE_CACHE_KEY = 'hms_profile_cache';
const USER_CACHE_KEY    = 'hms_user_cache';

function readProfileCache() {
  try { return JSON.parse(localStorage.getItem(PROFILE_CACHE_KEY)); } catch { return null; }
}
function writeProfileCache(type, data) {
  try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ type, data })); } catch {}
}
function clearProfileCache() {
  try { localStorage.removeItem(PROFILE_CACHE_KEY); localStorage.removeItem(USER_CACHE_KEY); } catch {}
}
function readUserCache() {
  try { return JSON.parse(localStorage.getItem(USER_CACHE_KEY)); } catch { return null; }
}
function writeUserCache(user) {
  try { localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user)); } catch {}
}

export function AuthProvider({ children }) {
  const cached     = readProfileCache();
  const cachedUser = readUserCache();
  const [user, setUser]                     = useState(cachedUser ?? null);
  const [profile, setProfile]               = useState(cached?.type === 'staff'   ? cached.data : null);
  const [patientProfile, setPatientProfile] = useState(cached?.type === 'patient' ? cached.data : null);
  const [loading, setLoading]               = useState(!cached);

  // Fetches both profiles in parallel — one round trip instead of two sequential.
  const resolveProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      setPatientProfile(null);
      return { type: null, data: null };
    }

    const [{ data: staffData }, { data: patientData }] = await Promise.all([
      supabase.from('staff_profiles').select('*').eq('id', userId).single(),
      supabase.from('patient_profiles').select('*').eq('id', userId).single(),
    ]);

    if (staffData) {
      setProfile(staffData);
      setPatientProfile(null);
      writeProfileCache('staff', staffData);
      return { type: 'staff', data: staffData };
    }
    if (patientData) {
      setPatientProfile(patientData);
      setProfile(null);
      writeProfileCache('patient', patientData);
      return { type: 'patient', data: patientData };
    }

    setProfile(null);
    setPatientProfile(null);
    clearProfileCache();
    return { type: null, data: null };
  };

  useEffect(() => {
    // Single source of truth — onAuthStateChange fires INITIAL_SESSION on mount,
    // so no separate getSession() call needed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) writeUserCache(currentUser);
      else clearProfileCache();
      try {
        await resolveProfile(currentUser?.id ?? null);
      } finally {
        setLoading(false);
      }
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
    clearProfileCache();
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
      {loading
        ? (
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <img src="/Logo.png" alt="MediCore" style={{ width: 48, height: 48, objectFit: 'contain', opacity: 0.8 }} />
              <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          </div>
        )
        : children
      }
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
