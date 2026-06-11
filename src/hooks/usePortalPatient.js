import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

export function usePortalPatient() {
  const { user, patientProfile } = useAuth();
  const [appointments,   setAppointments]   = useState([]);
  const [prescriptions,  setPrescriptions]  = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [labOrders,      setLabOrders]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshKey,    setRefreshKey]    = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    if (!user || !patientProfile) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const [{ data: apptData }, { data: rxData }, { data: recData }, { data: labData }] = await Promise.all([
        supabase
          .from('portal_appointments')
          .select('*')
          .eq('patient_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('prescriptions')
          .select('*')
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('medical_records')
          .select('*')
          .eq('patient_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('lab_orders')
          .select('*')
          .eq('patient_id', user.id)
          .order('ordered_date', { ascending: false }),
      ]);
      setAppointments(apptData || []);
      setPrescriptions(
        (rxData || []).map(rx => ({
          id:           rx.id,
          doctor:       rx.doctor_name,
          date:         rx.date,
          status:       rx.status,
          medicines:    rx.medicines || [],
          instructions: rx.instructions,
        }))
      );
      setMedicalRecords(
        (recData || []).map(r => ({
          id:          r.id,
          doctor:      r.doctor,
          date:        r.date,
          diagnosis:   r.diagnosis,
          prescription:r.prescription,
          notes:       r.notes,
          labResults:  r.lab_results,
          vitals:      r.vitals || {},
        }))
      );
      setLabOrders(labData || []);
      setLoading(false);
    };

    load();
  }, [user, patientProfile, refreshKey]);

  return { patient: patientProfile, appointments, prescriptions, medicalRecords, labOrders, loading, refresh };
}
