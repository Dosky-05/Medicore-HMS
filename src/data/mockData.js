export const DEPARTMENTS = [
  { id: 1, name: 'Cardiology', head: 'Dr. Emily Chen', capacity: 30, current: 18, color: '#ff6b6b', icon: 'HeartPulse' },
  { id: 2, name: 'Neurology', head: 'Dr. James Wilson', capacity: 25, current: 12, color: '#ffa94d', icon: 'Brain' },
  { id: 3, name: 'Orthopedics', head: 'Dr. Michael Brown', capacity: 20, current: 15, color: '#69db7c', icon: 'Bone' },
  { id: 4, name: 'Pediatrics', head: 'Dr. Sarah Davis', capacity: 35, current: 22, color: '#74c0fc', icon: 'Baby' },
  { id: 5, name: 'Emergency', head: 'Dr. Robert Lee', capacity: 40, current: 31, color: '#f783ac', icon: 'Ambulance' },
  { id: 6, name: 'Radiology', head: 'Dr. Linda Martinez', capacity: 15, current: 8, color: '#a9e34b', icon: 'Microscope' },
];

export const DOCTORS = [
  { id: 1, name: 'Dr. Emily Chen', specialization: 'Cardiologist', department: 'Cardiology', phone: '+1-555-0101', email: 'e.chen@medicore.com', experience: 12, status: 'Active', patients: 45, schedule: 'Mon-Fri', avatar: 'EC', image: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: 'Dr. James Wilson', specialization: 'Neurologist', department: 'Neurology', phone: '+1-555-0102', email: 'j.wilson@medicore.com', experience: 15, status: 'Active', patients: 38, schedule: 'Mon-Thu', avatar: 'JW', image: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, name: 'Dr. Michael Brown', specialization: 'Orthopedic Surgeon', department: 'Orthopedics', phone: '+1-555-0103', email: 'm.brown@medicore.com', experience: 10, status: 'Active', patients: 52, schedule: 'Tue-Sat', avatar: 'MB', image: 'https://i.pravatar.cc/150?u=3' },
  { id: 4, name: 'Dr. Sarah Davis', specialization: 'Pediatrician', department: 'Pediatrics', phone: '+1-555-0104', email: 's.davis@medicore.com', experience: 8, status: 'Active', patients: 61, schedule: 'Mon-Fri', avatar: 'SD' },
  { id: 5, name: 'Dr. Robert Lee', specialization: 'Emergency Physician', department: 'Emergency', phone: '+1-555-0105', email: 'r.lee@medicore.com', experience: 20, status: 'Active', patients: 89, schedule: 'Rotating', avatar: 'RL' },
  { id: 6, name: 'Dr. Linda Martinez', specialization: 'Radiologist', department: 'Radiology', phone: '+1-555-0106', email: 'l.martinez@medicore.com', experience: 14, status: 'Active', patients: 33, schedule: 'Mon-Fri', avatar: 'LM' },
  { id: 7, name: 'Dr. David Thompson', specialization: 'General Surgeon', department: 'Surgery', phone: '+1-555-0107', email: 'd.thompson@medicore.com', experience: 18, status: 'On Leave', patients: 28, schedule: 'Mon-Wed', avatar: 'DT' },
  { id: 8, name: 'Dr. Jennifer White', specialization: 'Dermatologist', department: 'Dermatology', phone: '+1-555-0108', email: 'j.white@medicore.com', experience: 9, status: 'Active', patients: 41, schedule: 'Tue-Sat', avatar: 'JW' },
];

export const PATIENTS = [
  { id: 'P001', name: 'John Smith', age: 45, gender: 'Male', blood: 'O+', phone: '+1-555-1001', email: 'j.smith@email.com', address: '123 Main St, New York', doctor: 'Dr. Emily Chen', department: 'Cardiology', admitDate: '2026-05-10', status: 'Admitted', condition: 'Hypertension', allergies: ['Penicillin', 'Ibuprofen'] },
  { id: 'P002', name: 'Mary Johnson', age: 32, gender: 'Female', blood: 'A+', phone: '+1-555-1002', email: 'm.johnson@email.com', address: '456 Oak Ave, Boston', doctor: 'Dr. Sarah Davis', department: 'Pediatrics', admitDate: '2026-05-15', status: 'Outpatient', condition: 'Bronchitis', allergies: ['Sulfa', 'Shellfish'] },
  { id: 'P003', name: 'Robert Davis', age: 58, gender: 'Male', blood: 'B-', phone: '+1-555-1003', email: 'r.davis@email.com', address: '789 Pine Rd, Chicago', doctor: 'Dr. James Wilson', department: 'Neurology', admitDate: '2026-05-12', status: 'Admitted', condition: 'Migraine', allergies: [] },
  { id: 'P004', name: 'Jennifer Wilson', age: 27, gender: 'Female', blood: 'AB+', phone: '+1-555-1004', email: 'j.wilson@email.com', address: '321 Elm St, Houston', doctor: 'Dr. Michael Brown', department: 'Orthopedics', admitDate: '2026-05-18', status: 'Discharged', condition: 'Fracture', allergies: ['Latex', 'Aspirin'] },
  { id: 'P005', name: 'William Brown', age: 65, gender: 'Male', blood: 'O-', phone: '+1-555-1005', email: 'w.brown@email.com', address: '654 Maple Dr, Phoenix', doctor: 'Dr. Emily Chen', department: 'Cardiology', admitDate: '2026-05-08', status: 'Admitted', condition: 'Arrhythmia', allergies: ['ACE Inhibitors', 'Nuts'] },
  { id: 'P006', name: 'Patricia Miller', age: 41, gender: 'Female', blood: 'A-', phone: '+1-555-1006', email: 'p.miller@email.com', address: '987 Cedar Ln, Philadelphia', doctor: 'Dr. Robert Lee', department: 'Emergency', admitDate: '2026-05-20', status: 'Critical', condition: 'Trauma', allergies: ['Morphine', 'Codeine'] },
  { id: 'P007', name: 'Charles Anderson', age: 52, gender: 'Male', blood: 'B+', phone: '+1-555-1007', email: 'c.anderson@email.com', address: '147 Birch St, San Antonio', doctor: 'Dr. James Wilson', department: 'Neurology', admitDate: '2026-05-14', status: 'Outpatient', condition: 'Epilepsy', allergies: [] },
  { id: 'P008', name: 'Linda Taylor', age: 38, gender: 'Female', blood: 'O+', phone: '+1-555-1008', email: 'l.taylor@email.com', address: '258 Walnut Ave, Dallas', doctor: 'Dr. Linda Martinez', department: 'Radiology', admitDate: '2026-05-19', status: 'Outpatient', condition: 'CT Scan', allergies: ['Iodine', 'Contrast Dye'] },
  { id: 'P009', name: 'Barbara Harris', age: 70, gender: 'Female', blood: 'A+', phone: '+1-555-1009', email: 'b.harris@email.com', address: '369 Spruce Rd, San Jose', doctor: 'Dr. Emily Chen', department: 'Cardiology', admitDate: '2026-05-05', status: 'Admitted', condition: 'Heart Failure', allergies: ['Diuretics'] },
  { id: 'P010', name: 'James Jackson', age: 29, gender: 'Male', blood: 'AB-', phone: '+1-555-1010', email: 'j.jackson@email.com', address: '741 Ash St, Austin', doctor: 'Dr. Michael Brown', department: 'Orthopedics', admitDate: '2026-05-22', status: 'Outpatient', condition: 'Back Pain', allergies: ['Sulfonamides'] },
  { id: 'P011', name: 'Susan White', age: 55, gender: 'Female', blood: 'B+', phone: '+1-555-1011', email: 's.white@email.com', address: '852 Cherry Blvd, Jacksonville', doctor: 'Dr. Jennifer White', department: 'Dermatology', admitDate: '2026-05-21', status: 'Outpatient', condition: 'Eczema', allergies: ['Lanolin', 'Fragrances'] },
  { id: 'P012', name: 'Thomas Martin', age: 44, gender: 'Male', blood: 'O+', phone: '+1-555-1012', email: 't.martin@email.com', address: '963 Peach Ave, Columbus', doctor: 'Dr. Sarah Davis', department: 'Pediatrics', admitDate: '2026-05-16', status: 'Discharged', condition: 'Fever', allergies: ['Eggs', 'Peanuts'] },
];

export const APPOINTMENTS = [
  { id: 'A001', patient: 'John Smith', patientId: 'P001', doctor: 'Dr. Emily Chen', doctorId: 1, department: 'Cardiology', date: '2026-05-27', time: '09:00 AM', type: 'Follow-up', status: 'Scheduled', notes: 'Monthly checkup', cancellationReason: '' },
  { id: 'A002', patient: 'Mary Johnson', patientId: 'P002', doctor: 'Dr. Sarah Davis', doctorId: 4, department: 'Pediatrics', date: '2026-05-27', time: '10:30 AM', type: 'Consultation', status: 'Scheduled', notes: 'Initial consultation', cancellationReason: '' },
  { id: 'A003', patient: 'Robert Davis', patientId: 'P003', doctor: 'Dr. James Wilson', doctorId: 2, department: 'Neurology', date: '2026-05-26', time: '02:00 PM', type: 'Follow-up', status: 'Completed', notes: 'Neurological assessment', cancellationReason: '' },
  { id: 'A004', patient: 'Jennifer Wilson', patientId: 'P004', doctor: 'Dr. Michael Brown', doctorId: 3, department: 'Orthopedics', date: '2026-05-26', time: '11:00 AM', type: 'Check-up', status: 'Completed', notes: 'Post-surgery follow-up', cancellationReason: '' },
  { id: 'A005', patient: 'William Brown', patientId: 'P005', doctor: 'Dr. Emily Chen', doctorId: 1, department: 'Cardiology', date: '2026-05-28', time: '03:30 PM', type: 'Emergency', status: 'Scheduled', notes: 'Urgent cardiac review', cancellationReason: '' },
  { id: 'A006', patient: 'Patricia Miller', patientId: 'P006', doctor: 'Dr. Robert Lee', doctorId: 5, department: 'Emergency', date: '2026-05-26', time: '01:00 AM', type: 'Emergency', status: 'Completed', notes: 'Trauma assessment', cancellationReason: '' },
  { id: 'A007', patient: 'Charles Anderson', patientId: 'P007', doctor: 'Dr. James Wilson', doctorId: 2, department: 'Neurology', date: '2026-05-29', time: '09:30 AM', type: 'Consultation', status: 'Scheduled', notes: 'EEG review', cancellationReason: '' },
  { id: 'A008', patient: 'Linda Taylor', patientId: 'P008', doctor: 'Dr. Linda Martinez', doctorId: 6, department: 'Radiology', date: '2026-05-27', time: '11:30 AM', type: 'Procedure', status: 'Scheduled', notes: 'CT Scan', cancellationReason: '' },
  { id: 'A009', patient: 'Barbara Harris', patientId: 'P009', doctor: 'Dr. Emily Chen', doctorId: 1, department: 'Cardiology', date: '2026-05-25', time: '10:00 AM', type: 'Follow-up', status: 'Cancelled', notes: 'Patient requested reschedule', cancellationReason: 'Doctor schedule conflict' },
  { id: 'A010', patient: 'James Jackson', patientId: 'P010', doctor: 'Dr. Michael Brown', doctorId: 3, department: 'Orthopedics', date: '2026-05-28', time: '04:00 PM', type: 'Consultation', status: 'Scheduled', notes: 'MRI results review', cancellationReason: '' },
];

export const INVOICES = [
  { id: 'INV001', patient: 'John Smith', patientId: 'P001', date: '2026-05-20', dueDate: '2026-06-03', services: ['Consultation', 'ECG', 'Medication'], amount: 1250.00, paid: 1250.00, status: 'Paid', insurance: 'BlueCross' },
  { id: 'INV002', patient: 'Mary Johnson', patientId: 'P002', date: '2026-05-15', dueDate: '2026-05-29', services: ['Consultation', 'Blood Test'], amount: 450.00, paid: 0, status: 'Pending', insurance: 'Aetna' },
  { id: 'INV003', patient: 'Robert Davis', patientId: 'P003', date: '2026-05-12', dueDate: '2026-05-26', services: ['Consultation', 'MRI', 'Medication'], amount: 3200.00, paid: 1600.00, status: 'Partial', insurance: 'United Health' },
  { id: 'INV004', patient: 'Jennifer Wilson', patientId: 'P004', date: '2026-05-18', dueDate: '2026-06-01', services: ['Surgery', 'Anesthesia', 'Room', 'Medication'], amount: 8500.00, paid: 8500.00, status: 'Paid', insurance: 'Cigna' },
  { id: 'INV005', patient: 'William Brown', patientId: 'P005', date: '2026-05-08', dueDate: '2026-05-22', services: ['ICU', 'Medication', 'Monitoring'], amount: 5750.00, paid: 0, status: 'Overdue', insurance: 'Medicare' },
  { id: 'INV006', patient: 'Patricia Miller', patientId: 'P006', date: '2026-05-20', dueDate: '2026-06-03', services: ['Emergency', 'Surgery', 'ICU', 'Medication'], amount: 12400.00, paid: 6200.00, status: 'Partial', insurance: 'Medicaid' },
  { id: 'INV007', patient: 'Charles Anderson', patientId: 'P007', date: '2026-05-14', dueDate: '2026-05-28', services: ['Consultation', 'EEG', 'Medication'], amount: 2100.00, paid: 2100.00, status: 'Paid', insurance: 'BlueCross' },
  { id: 'INV008', patient: 'Barbara Harris', patientId: 'P009', date: '2026-05-05', dueDate: '2026-05-19', services: ['ICU', 'Cardiac Monitoring', 'Medication'], amount: 9800.00, paid: 0, status: 'Overdue', insurance: 'Medicare' },
];

export const MEDICAL_RECORDS = [
  { id: 'MR001', patientId: 'P001', patient: 'John Smith', date: '2026-05-20', doctor: 'Dr. Emily Chen', diagnosis: 'Hypertension Stage 2', prescription: 'Lisinopril 10mg, Amlodipine 5mg', notes: 'Blood pressure 160/95. Increase medication dosage. Follow-up in 2 weeks.', labResults: 'Cholesterol: 210mg/dL (High)', vitals: { bp: '160/95', hr: '88', temp: '98.6°F', weight: '185 lbs' } },
  { id: 'MR002', patientId: 'P002', patient: 'Mary Johnson', date: '2026-05-15', doctor: 'Dr. Sarah Davis', diagnosis: 'Acute Bronchitis', prescription: 'Azithromycin 500mg, Guaifenesin', notes: 'Chest congestion, mild fever. Rest and fluids recommended.', labResults: 'WBC: 11,500 (Slightly elevated)', vitals: { bp: '118/76', hr: '92', temp: '100.2°F', weight: '135 lbs' } },
  { id: 'MR003', patientId: 'P003', patient: 'Robert Davis', date: '2026-05-12', doctor: 'Dr. James Wilson', diagnosis: 'Chronic Migraine', prescription: 'Sumatriptan 50mg, Propranolol 40mg', notes: 'Recurring migraines 3-4 times/week. MRI ordered.', labResults: 'MRI: No structural abnormalities', vitals: { bp: '125/80', hr: '76', temp: '98.4°F', weight: '175 lbs' } },
  { id: 'MR004', patientId: 'P005', patient: 'William Brown', date: '2026-05-08', doctor: 'Dr. Emily Chen', diagnosis: 'Atrial Fibrillation', prescription: 'Warfarin 5mg, Metoprolol 25mg', notes: 'Irregular heart rhythm detected. Anticoagulation therapy started.', labResults: 'INR: 1.2, ECG: A-Fib confirmed', vitals: { bp: '145/90', hr: '110', temp: '98.8°F', weight: '200 lbs' } },
  { id: 'MR005', patientId: 'P006', patient: 'Patricia Miller', date: '2026-05-20', doctor: 'Dr. Robert Lee', diagnosis: 'Multiple Trauma', prescription: 'Morphine 10mg, Cefazolin 1g IV', notes: 'Motor vehicle accident victim. Multiple lacerations and rib fractures.', labResults: 'CT: 3 rib fractures, no internal bleeding', vitals: { bp: '90/60', hr: '120', temp: '99.1°F', weight: '140 lbs' } },
];

export const PHARMACY_ITEMS = [
  { id: 'PH001', name: 'Lisinopril 10mg', category: 'Cardiovascular', stock: 450, unit: 'Tablets', reorderLevel: 100, supplier: 'PharmaCo', price: 0.45, status: 'In Stock' },
  { id: 'PH002', name: 'Metformin 500mg', category: 'Diabetes', stock: 320, unit: 'Tablets', reorderLevel: 150, supplier: 'MediSupply', price: 0.30, status: 'In Stock' },
  { id: 'PH003', name: 'Amoxicillin 500mg', category: 'Antibiotics', stock: 85, unit: 'Capsules', reorderLevel: 100, supplier: 'PharmaCo', price: 0.80, status: 'Low Stock' },
  { id: 'PH004', name: 'Paracetamol 500mg', category: 'Analgesic', stock: 1200, unit: 'Tablets', reorderLevel: 200, supplier: 'GenericMeds', price: 0.15, status: 'In Stock' },
  { id: 'PH005', name: 'Omeprazole 20mg', category: 'Gastrointestinal', stock: 0, unit: 'Capsules', reorderLevel: 100, supplier: 'MediSupply', price: 0.60, status: 'Out of Stock' },
  { id: 'PH006', name: 'Atorvastatin 40mg', category: 'Cardiovascular', stock: 280, unit: 'Tablets', reorderLevel: 100, supplier: 'PharmaCo', price: 0.95, status: 'In Stock' },
  { id: 'PH007', name: 'Salbutamol Inhaler', category: 'Respiratory', stock: 45, unit: 'Units', reorderLevel: 50, supplier: 'RespiCare', price: 12.50, status: 'Low Stock' },
  { id: 'PH008', name: 'Insulin Glargine', category: 'Diabetes', stock: 120, unit: 'Vials', reorderLevel: 40, supplier: 'DiabetesCare', price: 85.00, status: 'In Stock' },
  { id: 'PH009', name: 'Warfarin 5mg', category: 'Anticoagulant', stock: 200, unit: 'Tablets', reorderLevel: 80, supplier: 'PharmaCo', price: 0.55, status: 'In Stock' },
  { id: 'PH010', name: 'Morphine 10mg/ml', category: 'Pain Management', stock: 30, unit: 'Vials', reorderLevel: 20, supplier: 'SpecialtyMeds', price: 45.00, status: 'In Stock' },
];

export const CHART_DATA = {
  monthlyPatients: [
    { month: 'Jan', patients: 145, revenue: 48500 },
    { month: 'Feb', patients: 132, revenue: 44200 },
    { month: 'Mar', patients: 168, revenue: 56100 },
    { month: 'Apr', patients: 191, revenue: 63800 },
    { month: 'May', patients: 178, revenue: 59400 },
    { month: 'Jun', patients: 203, revenue: 67700 },
  ],
  appointmentTypes: [
    { name: 'Consultation', value: 45 },
    { name: 'Follow-up', value: 30 },
    { name: 'Emergency', value: 15 },
    { name: 'Procedure', value: 10 },
  ],
};

export const DOCTOR_SCHEDULES = [
  { id: 1, doctorId: 1, doctorName: 'Dr. Emily Chen', workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], startTime: '08:00 AM', endTime: '05:00 PM', daysOff: [], availableDays: ['2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30'], maxPatientsPerDay: 8 },
  { id: 2, doctorId: 2, doctorName: 'Dr. James Wilson', workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], startTime: '09:00 AM', endTime: '04:00 PM', daysOff: [], availableDays: ['2026-05-27', '2026-05-28', '2026-05-29'], maxPatientsPerDay: 6 },
  { id: 3, doctorId: 3, doctorName: 'Dr. Michael Brown', workDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], startTime: '08:30 AM', endTime: '05:30 PM', daysOff: ['Monday'], availableDays: ['2026-05-28', '2026-05-29', '2026-05-30'], maxPatientsPerDay: 7 },
  { id: 4, doctorId: 4, doctorName: 'Dr. Sarah Davis', workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], startTime: '08:00 AM', endTime: '04:00 PM', daysOff: [], availableDays: ['2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30'], maxPatientsPerDay: 10 },
  { id: 5, doctorId: 5, doctorName: 'Dr. Robert Lee', workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], startTime: '24 Hours', endTime: '24 Hours', daysOff: [], availableDays: ['2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30'], maxPatientsPerDay: 15 },
  { id: 6, doctorId: 6, doctorName: 'Dr. Linda Martinez', workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], startTime: '09:00 AM', endTime: '05:00 PM', daysOff: [], availableDays: ['2026-05-27', '2026-05-29'], maxPatientsPerDay: 5 },
  { id: 7, doctorId: 7, doctorName: 'Dr. David Thompson', workDays: ['Monday', 'Tuesday', 'Wednesday'], startTime: '08:00 AM', endTime: '03:00 PM', daysOff: ['Thursday', 'Friday', 'Saturday', 'Sunday'], availableDays: ['2026-05-27'], maxPatientsPerDay: 4 },
  { id: 8, doctorId: 8, doctorName: 'Dr. Jennifer White', workDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], startTime: '10:00 AM', endTime: '06:00 PM', daysOff: ['Sunday', 'Monday'], availableDays: ['2026-05-28', '2026-05-29', '2026-05-30'], maxPatientsPerDay: 6 },
];

export const PRESCRIPTIONS = [
  { id: 'RX001', appointmentId: 'A001', patientId: 'P001', patient: 'John Smith', doctor: 'Dr. Emily Chen', date: '2026-05-20', medicines: [{ name: 'Lisinopril', dose: '10mg', frequency: 'Once daily', duration: '30 days' }, { name: 'Amlodipine', dose: '5mg', frequency: 'Once daily', duration: '30 days' }], instructions: 'Take with breakfast. Monitor BP regularly.', status: 'Active' },
  { id: 'RX002', appointmentId: 'A002', patientId: 'P002', patient: 'Mary Johnson', doctor: 'Dr. Sarah Davis', date: '2026-05-15', medicines: [{ name: 'Azithromycin', dose: '500mg', frequency: 'Once daily', duration: '5 days' }], instructions: 'Complete full course. Avoid dairy products.', status: 'Active' },
  { id: 'RX003', appointmentId: 'A003', patientId: 'P003', patient: 'Robert Davis', doctor: 'Dr. James Wilson', date: '2026-05-12', medicines: [{ name: 'Sumatriptan', dose: '50mg', frequency: 'As needed', duration: '90 days' }, { name: 'Propranolol', dose: '40mg', frequency: 'Twice daily', duration: '90 days' }], instructions: 'Take Sumatriptan at first sign of migraine. Avoid triggers.', status: 'Active' },
  { id: 'RX004', appointmentId: 'A004', patientId: 'P004', patient: 'Jennifer Wilson', doctor: 'Dr. Michael Brown', date: '2026-05-20', medicines: [{ name: 'Ibuprofen', dose: '400mg', frequency: 'Every 6 hours', duration: '14 days' }], instructions: 'Take with food. Physical therapy as recommended.', status: 'Completed' },
  { id: 'RX005', appointmentId: 'A005', patientId: 'P005', patient: 'William Brown', doctor: 'Dr. Emily Chen', date: '2026-05-15', medicines: [{ name: 'Warfarin', dose: '5mg', frequency: 'Once daily', duration: '180 days' }, { name: 'Metoprolol', dose: '25mg', frequency: 'Twice daily', duration: '180 days' }], instructions: 'Monitor INR levels weekly. No NSAIDs. Maintain consistent vitamin K intake.', status: 'Active' },
];
