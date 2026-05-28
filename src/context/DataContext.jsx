import { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  PATIENTS, DOCTORS, APPOINTMENTS, INVOICES,
  MEDICAL_RECORDS, PHARMACY_ITEMS, DEPARTMENTS, DOCTOR_SCHEDULES, PRESCRIPTIONS
} from '../data/mockData';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [patients, setPatients] = useLocalStorage('hms_patients', PATIENTS);
  const [doctors, setDoctors] = useLocalStorage('hms_doctors', DOCTORS);
  const [appointments, setAppointments] = useLocalStorage('hms_appointments', APPOINTMENTS);
  const [invoices, setInvoices] = useLocalStorage('hms_invoices', INVOICES);
  const [medicalRecords, setMedicalRecords] = useLocalStorage('hms_records', MEDICAL_RECORDS);
  const [pharmacy, setPharmacy] = useLocalStorage('hms_pharmacy', PHARMACY_ITEMS);
  const [departments, setDepartments] = useLocalStorage('hms_departments', DEPARTMENTS);
  const [schedules, setSchedules] = useLocalStorage('hms_schedules', DOCTOR_SCHEDULES);
  const [prescriptions, setPrescriptions] = useLocalStorage('hms_prescriptions', PRESCRIPTIONS);

  const generateId = (prefix) => `${prefix}${Date.now()}`;

  // Patients CRUD
  const addPatient = (p) => setPatients(prev => [...prev, { ...p, id: generateId('P') }]);
  const updatePatient = (id, data) => setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  const deletePatient = (id) => setPatients(prev => prev.filter(p => p.id !== id));

  // Doctors CRUD
  const addDoctor = (d) => setDoctors(prev => [...prev, { ...d, id: Date.now() }]);
  const updateDoctor = (id, data) => setDoctors(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
  const deleteDoctor = (id) => setDoctors(prev => prev.filter(d => d.id !== id));

  // Appointments CRUD
  const addAppointment = (a) => setAppointments(prev => [...prev, { ...a, id: generateId('A') }]);
  const updateAppointment = (id, data) => setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  const deleteAppointment = (id) => setAppointments(prev => prev.filter(a => a.id !== id));

  // Invoices CRUD
  const addInvoice = (inv) => setInvoices(prev => [...prev, { ...inv, id: generateId('INV') }]);
  const updateInvoice = (id, data) => setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));

  // Medical Records CRUD
  const addRecord = (r) => setMedicalRecords(prev => [...prev, { ...r, id: generateId('MR') }]);
  const updateRecord = (id, data) => setMedicalRecords(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  const deleteRecord = (id) => setMedicalRecords(prev => prev.filter(r => r.id !== id));

  // Pharmacy CRUD
  const addPharmacyItem = (item) => setPharmacy(prev => [...prev, { ...item, id: generateId('PH') }]);
  const updatePharmacyItem = (id, data) => setPharmacy(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  const deletePharmacyItem = (id) => setPharmacy(prev => prev.filter(p => p.id !== id));

  // Doctor Schedules CRUD
  const addSchedule = (s) => setSchedules(prev => [...prev, { ...s, id: Math.max(...prev.map(x => x.id), 0) + 1 }]);
  const updateSchedule = (id, data) => setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  const deleteSchedule = (id) => setSchedules(prev => prev.filter(s => s.id !== id));
  const getScheduleByDoctor = (doctorId) => schedules.find(s => s.doctorId === doctorId);

  // Prescriptions CRUD
  const addPrescription = (p) => setPrescriptions(prev => [...prev, { ...p, id: generateId('RX') }]);
  const updatePrescription = (id, data) => setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  const deletePrescription = (id) => setPrescriptions(prev => prev.filter(p => p.id !== id));
  const getPrescriptionsByPatient = (patientId) => prescriptions.filter(p => p.patientId === patientId);

  return (
    <DataContext.Provider value={{
      patients, addPatient, updatePatient, deletePatient,
      doctors, addDoctor, updateDoctor, deleteDoctor,
      appointments, addAppointment, updateAppointment, deleteAppointment,
      invoices, addInvoice, updateInvoice,
      medicalRecords, addRecord, updateRecord, deleteRecord,
      pharmacy, addPharmacyItem, updatePharmacyItem, deletePharmacyItem,
      departments, setDepartments,
      schedules, addSchedule, updateSchedule, deleteSchedule, getScheduleByDoctor,
      prescriptions, addPrescription, updatePrescription, deletePrescription, getPrescriptionsByPatient,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
