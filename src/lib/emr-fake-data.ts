/**
 * Fake EMR dataset simulating patients already registered in a hospital's
 * existing Electronic Medical Records system. When a hospital clicks
 * "Sync from EMR", these records are seeded into the emr_record table.
 *
 * The patientEmail / patientPhone fields are used to auto-match when a
 * patient registers on AuraHealth — if their email or phone already exists
 * in a hospital's EMR, they are auto-linked to that hospital.
 */

export interface FakeEMRPatient {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  dateOfBirth: string;
  bloodType: string;
  allergies: string;
  conditions: string;
  lastVisit: string;
}

export const FAKE_EMR_PATIENTS: FakeEMRPatient[] = [
  {
    patientName: "Adaeze Okonkwo",
    patientEmail: "adaeze.okonkwo@gmail.com",
    patientPhone: "+2348031234501",
    dateOfBirth: "1990-03-15",
    bloodType: "O+",
    allergies: "Penicillin",
    conditions: "Hypertension",
    lastVisit: "2026-01-10",
  },
  {
    patientName: "Emeka Nwosu",
    patientEmail: "emeka.nwosu@yahoo.com",
    patientPhone: "+2348051234502",
    dateOfBirth: "1985-07-22",
    bloodType: "A+",
    allergies: "None",
    conditions: "Type 2 Diabetes",
    lastVisit: "2025-12-05",
  },
  {
    patientName: "Fatima Al-Hassan",
    patientEmail: "fatima.alhassan@outlook.com",
    patientPhone: "+2347031234503",
    dateOfBirth: "1998-11-08",
    bloodType: "B+",
    allergies: "Sulfa drugs",
    conditions: "Asthma",
    lastVisit: "2026-02-14",
  },
  {
    patientName: "Chukwuemeka Eze",
    patientEmail: "chukwuemeka.eze@gmail.com",
    patientPhone: "+2348091234504",
    dateOfBirth: "1975-05-30",
    bloodType: "AB+",
    allergies: "None",
    conditions: "Coronary Artery Disease",
    lastVisit: "2026-01-28",
  },
  {
    patientName: "Ngozi Adeyemi",
    patientEmail: "ngozi.adeyemi@gmail.com",
    patientPhone: "+2348021234505",
    dateOfBirth: "1993-09-12",
    bloodType: "O-",
    allergies: "Latex, Ibuprofen",
    conditions: "Sickle Cell Trait",
    lastVisit: "2025-11-20",
  },
  {
    patientName: "Babatunde Olawale",
    patientEmail: "babatunde.olawale@hotmail.com",
    patientPhone: "+2347061234506",
    dateOfBirth: "1988-01-25",
    bloodType: "A-",
    allergies: "Codeine",
    conditions: "Epilepsy",
    lastVisit: "2026-03-01",
  },
  {
    patientName: "Amina Musa",
    patientEmail: "amina.musa@gmail.com",
    patientPhone: "+2348071234507",
    dateOfBirth: "2001-04-18",
    bloodType: "B-",
    allergies: "None",
    conditions: "Malaria (recurrent)",
    lastVisit: "2026-02-28",
  },
  {
    patientName: "Obiora Okafor",
    patientEmail: "obiora.okafor@yahoo.com",
    patientPhone: "+2348011234508",
    dateOfBirth: "1970-12-03",
    bloodType: "O+",
    allergies: "Aspirin",
    conditions: "Chronic Kidney Disease Stage 2",
    lastVisit: "2026-01-15",
  },
  {
    patientName: "Chiamaka Nwachukwu",
    patientEmail: "chiamaka.nwachukwu@gmail.com",
    patientPhone: "+2348041234509",
    dateOfBirth: "1995-08-27",
    bloodType: "A+",
    allergies: "None",
    conditions: "PCOS",
    lastVisit: "2025-10-30",
  },
  {
    patientName: "Ibrahim Garba",
    patientEmail: "ibrahim.garba@gmail.com",
    patientPhone: "+2348061234510",
    dateOfBirth: "1982-06-14",
    bloodType: "AB-",
    allergies: "Morphine",
    conditions: "Hypertension, Dyslipidemia",
    lastVisit: "2026-02-05",
  },
  {
    patientName: "Yetunde Afolabi",
    patientEmail: "yetunde.afolabi@outlook.com",
    patientPhone: "+2347081234511",
    dateOfBirth: "1979-02-09",
    bloodType: "O+",
    allergies: "None",
    conditions: "Osteoarthritis",
    lastVisit: "2026-01-22",
  },
  {
    patientName: "Kelechi Oti",
    patientEmail: "kelechi.oti@gmail.com",
    patientPhone: "+2348081234512",
    dateOfBirth: "2003-10-11",
    bloodType: "B+",
    allergies: "Peanuts (anaphylaxis)",
    conditions: "Allergic Rhinitis",
    lastVisit: "2025-12-18",
  },
  {
    patientName: "Hauwa Suleiman",
    patientEmail: "hauwa.suleiman@gmail.com",
    patientPhone: "+2347021234513",
    dateOfBirth: "1991-07-05",
    bloodType: "A+",
    allergies: "None",
    conditions: "Gestational Diabetes (resolved)",
    lastVisit: "2026-03-10",
  },
  {
    patientName: "Tochukwu Igwe",
    patientEmail: "tochukwu.igwe@yahoo.com",
    patientPhone: "+2348051234514",
    dateOfBirth: "1968-03-29",
    bloodType: "O+",
    allergies: "Ampicillin",
    conditions: "Type 2 Diabetes, Hypertension",
    lastVisit: "2026-02-20",
  },
  {
    patientName: "Zainab Abdullahi",
    patientEmail: "zainab.abdullahi@gmail.com",
    patientPhone: "+2347091234515",
    dateOfBirth: "1996-05-16",
    bloodType: "AB+",
    allergies: "None",
    conditions: "Anxiety Disorder",
    lastVisit: "2026-01-08",
  },
];
