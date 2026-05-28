import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const USERS = [
  { id: 1, username: 'admin', password: 'admin123', role: 'Admin', name: 'Dr. Admin User', avatar: 'AU' },
  { id: 2, username: 'doctor', password: 'doctor123', role: 'Doctor', name: 'Dr. James Wilson', avatar: 'JW' },
  { id: 3, username: 'nurse', password: 'nurse123', role: 'Nurse', name: 'Nurse Sarah Johnson', avatar: 'SJ' },
  { id: 4, username: 'receptionist', password: 'recep123', role: 'Receptionist', name: 'Alex Thompson', avatar: 'AT' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('hms_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = (username, password) => {
    const found = USERS.find(u => u.username === username && u.password === password);
    if (found) {
      const { password: _, ...safeUser } = found;
      setUser(safeUser);
      localStorage.setItem('hms_user', JSON.stringify(safeUser));
      return { success: true };
    }
    return { success: false, error: 'Invalid username or password' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hms_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
