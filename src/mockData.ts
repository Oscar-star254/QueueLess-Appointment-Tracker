import type { Customer, Appointment } from './types';

export const BUSINESS_NAME = "Marcus & Co. Barbershop";
export const AVG_SERVICE_MINUTES = 20;
export const JOIN_URL = "queueless.app/join/marcus-co";

const now = new Date();
const ago = (m: number) => new Date(now.getTime() - m * 60000);

export const initialQueue: Customer[] = [
  { id: 'c1', name: 'James Okafor',    phone: '+1 514-555-0104', joinedAt: ago(42), status: 'serving', isAppointment: false, service: 'Fade + Lineup',  ticketNumber: 1 },
  { id: 'c2', name: 'Daniel Park',     phone: '+1 514-555-0287', joinedAt: ago(28), status: 'waiting', isAppointment: false, service: 'Haircut',         ticketNumber: 2 },
  { id: 'c3', name: 'Luis Mendez',     phone: '+1 514-555-0319', joinedAt: ago(18), status: 'waiting', isAppointment: false, service: 'Cut & Wash',      ticketNumber: 3 },
  { id: 'c4', name: 'Kevin Tremblay',  phone: '+1 514-555-0456', joinedAt: ago(12), status: 'waiting', isAppointment: true,  appointmentTime: '2:30 PM', service: 'Haircut', ticketNumber: 4 },
  { id: 'c5', name: 'Amara Diallo',    phone: '+1 514-555-0638', joinedAt: ago(5),  status: 'waiting', isAppointment: false, service: 'Haircut',         ticketNumber: 5 },
];

export const initialAppointments: Appointment[] = [
  { id: 'a1', name: 'Kevin Tremblay', phone: '+1 514-555-0456', time: '2:30 PM', service: 'Haircut',         status: 'arrived'   },
  { id: 'a2', name: 'Sophie Chen',    phone: '+1 514-555-0847', time: '3:00 PM', service: 'Cut & Style',     status: 'scheduled' },
  { id: 'a3', name: 'Marcus Johnson', phone: '+1 514-555-0231', time: '3:30 PM', service: 'Fade',            status: 'scheduled' },
  { id: 'a4', name: 'Yusuf Hassan',   phone: '+1 514-555-0634', time: '4:00 PM', service: 'Haircut + Beard', status: 'scheduled' },
  { id: 'a5', name: 'Elena Volkov',   phone: '+1 514-555-0921', time: '4:30 PM', service: 'Cut & Wash',      status: 'scheduled' },
  { id: 'a6', name: 'Theo Girard',    phone: '+1 514-555-0173', time: '5:00 PM', service: 'Haircut',         status: 'scheduled' },
];

export const hourlyData = [
  { hour: '8am',  customers: 2  },
  { hour: '9am',  customers: 6  },
  { hour: '10am', customers: 11 },
  { hour: '11am', customers: 14 },
  { hour: '12pm', customers: 12 },
  { hour: '1pm',  customers: 8  },
  { hour: '2pm',  customers: 11 },
  { hour: '3pm',  customers: 16 },
  { hour: '4pm',  customers: 19 },
  { hour: '5pm',  customers: 15 },
  { hour: '6pm',  customers: 9  },
  { hour: '7pm',  customers: 4  },
];

export const weeklyData = [
  { day: 'Mon', customers: 47 },
  { day: 'Tue', customers: 52 },
  { day: 'Wed', customers: 44 },
  { day: 'Thu', customers: 61 },
  { day: 'Fri', customers: 78 },
  { day: 'Sat', customers: 92 },
  { day: 'Sun', customers: 38 },
];
