export type CustomerStatus = 'waiting' | 'serving' | 'called' | 'done' | 'skipped';
export type AppView = 'landing' | 'customer-join' | 'customer-waiting' | 'owner';
export type OwnerTab = 'queue' | 'analytics' | 'appointments';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  joinedAt: Date;
  status: CustomerStatus;
  isAppointment: boolean;
  appointmentTime?: string;
  service: string;
  ticketNumber: number;
}

export interface Appointment {
  id: string;
  name: string;
  phone?: string;
  time: string;
  service: string;
  status: 'scheduled' | 'arrived' | 'serving' | 'done' | 'no-show';
}
