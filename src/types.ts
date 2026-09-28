export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type BookingType = 'DOCTOR_APPOINTMENT' | 'DIAGNOSTIC_TEST' | 'HOME_SERVICE';

export type BookingStatus =
  | 'Booking Created'
  | 'Payment Completed'
  | 'Confirmed'
  | 'Sample Collected / Appointment Done'
  | 'Processing'
  | 'Completed'
  | 'Report Available';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export type CollectionMode = 'CENTRE_VISIT' | 'HOME_COLLECTION';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  bloodGroup?: string;
  age?: number;
  gender?: string;
  address?: string;
  doctorId?: string; // Linked if role === 'DOCTOR'
}

export interface DoctorSlot {
  id: string;
  doctorId: string;
  day: string;
  time: string;
  isAvailable: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience: string;
  consultationFee: number;
  availableDays: string[];
  availableTime: string;
  roomNumber: string;
  bio: string;
  avatarKey: 'cardio' | 'endo' | 'neuro';
  slots: DoctorSlot[];
}

export interface TestParameter {
  name: string;
  unit: string;
  referenceRange: string;
  defaultNormalValue: string;
}

export interface DiagnosticTest {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  turnaroundTime: string;
  fastingRequired: boolean;
  sampleType: string;
  homeCollectionAvailable: boolean;
  description: string;
  parameters: TestParameter[];
}

export interface HomeService {
  id: string;
  code: string;
  name: string;
  category: 'BLOOD_COLLECTION' | 'HOME_ECG' | 'HOME_DRESSING';
  price: number;
  duration: string;
  description: string;
  equipmentIncluded: string[];
}

export interface Booking {
  id: string; // e.g., DIAG-2026-00001
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  bookingType: BookingType;
  // Target references
  doctorId?: string;
  doctorName?: string;
  testIds?: string[];
  testNames?: string[];
  homeServiceId?: string;
  homeServiceName?: string;
  collectionMode?: CollectionMode;
  address?: string;
  appointmentDate: string;
  appointmentTime: string;
  amount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  reportId?: string;
  clinicalNotes?: string;
  createdAt: string;
}

export interface Payment {
  id: string; // PAY-2026-00001
  bookingId: string; // DIAG-2026-00001
  patientId: string;
  patientName: string;
  transactionId: string; // TXN-98412039
  amount: number;
  paymentMethod: 'CARD' | 'BKASH' | 'NAGAD' | 'NET_BANKING';
  paymentStatus: PaymentStatus;
  paymentDate: string;
}

export interface ReportParameterResult {
  parameterName: string;
  resultValue: string;
  unit: string;
  referenceRange: string;
  flag: 'NORMAL' | 'HIGH' | 'LOW';
}

export interface MedicalReport {
  id: string; // REP-2026-00001
  bookingId: string; // DIAG-2026-00001
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  testName: string;
  sampleDate: string;
  reportDate: string;
  status: 'Completed' | 'Verified';
  pathologistName: string;
  remarks: string;
  results: ReportParameterResult[];
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  medications: string[];
  recommendedTests: string[];
  notes: string;
  imageUrl?: string;
}

export interface NotificationItem {
  id: string;
  userId: string; // or 'ALL_ADMINS'
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  relatedBookingId?: string;
}

export interface DetectedPrescriptionTest {
  extractedName: string;
  matchedTestId: string | null;
  matchedTestCode: string | null;
  matchedTestName: string | null;
  price: number | null;
  confidence: 'HIGH' | 'MEDIUM';
  reason: string;
}

export interface PrescriptionAnalysisResult {
  doctorName?: string;
  patientName?: string;
  date?: string;
  rawHandwritingText: string;
  clinicalNotes: string;
  detectedTests: DetectedPrescriptionTest[];
  disclaimer: string;
}
