import { useState } from 'react';
import type { Customer, AppView } from '../types';
import { BUSINESS_NAME, AVG_SERVICE_MINUTES } from '../mockData';
import { sendWhatsAppNotification, buildJoinMessage, type WhatsAppConfig } from '../services/whatsapp';

const SERVICES = ['Haircut', 'Fade', 'Fade + Lineup', 'Cut & Wash', 'Cut & Style', 'Haircut + Beard', 'Lineup Only'];
const APPOINTMENT_SLOTS = ['2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'];

interface Props {
  queue: Customer[];
  setQueue: (q: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  setView: (v: AppView) => void;
  setCurrentCustomerId: (id: string) => void;
  isPaused: boolean;
  whatsappConfig: WhatsAppConfig | null;
}

function getNextPosition(queue: Customer[]) {
  return queue.filter(c => c.status === 'waiting' || c.status === 'serving').length + 1;
}

function getEstWait(queue: Customer[]) {
  const serving = queue.filter(c => c.status === 'serving').length;
  const waiting = queue.filter(c => c.status === 'waiting').length;
  return Math.round(serving * (AVG_SERVICE_MINUTES / 2) + waiting * AVG_SERVICE_MINUTES);
}

export default function CustomerJoin({ queue, setQueue, setView, setCurrentCustomerId, isPaused, whatsappConfig }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('Haircut');
  const [isAppointment, setIsAppointment] = useState(false);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notifyEnabled, setNotifyEnabled] = useState(false);

  const position = getNextPosition(queue);
  const estWait = getEstWait(queue);

  function handleJoin() {
    if (!name.trim()) return;

    const newCustomer: Customer = {
      id: `c${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || undefined,
      joinedAt: new Date(),
      status: 'waiting',
      isAppointment,
      appointmentTime: isAppointment ? appointmentTime : undefined,
      service,
      ticketNumber: Math.max(...queue.map(c => c.ticketNumber), 0) + 1,
    };

    const newQueue = [...queue, newCustomer];
    setQueue(newQueue);
    setCurrentCustomerId(newCustomer.id);

    if (whatsappConfig) {
      const pos = position;
      const wait = estWait + AVG_SERVICE_MINUTES; // they're the new last
      const msg = buildJoinMessage(newCustomer.name, newCustomer.service, pos, wait);
      sendWhatsAppNotification(whatsappConfig, msg).catch(() => {/* silent — no-cors anyway */});
    }

    setView('customer-waiting');
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-5 pb-4">
        <button
          onClick={() => setView('landing')}
          className="w-8 h-8 rounded-lg bg-teal-900 border border-teal-700/40 flex items-center justify-center text-teal-400 hover:bg-teal-800 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-teal-50" style={{ fontFamily: "'Outfit', sans-serif" }}>Join the Queue</h1>
          <p className="text-teal-500 text-xs">{BUSINESS_NAME}</p>
        </div>
      </header>

      <main className="flex-1 px-5 pb-8 max-w-sm mx-auto w-full">

        {/* Walk-in / Appointment toggle */}
        <div className="flex bg-teal-900/60 border border-teal-700/30 rounded-xl p-1 mb-6">
          <button
            onClick={() => setIsAppointment(false)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              !isAppointment ? 'bg-teal-400 text-teal-950' : 'text-teal-400 hover:text-teal-300'
            }`}
            style={!isAppointment ? { fontFamily: "'Outfit', sans-serif" } : {}}
          >
            Walk-in
          </button>
          <button
            onClick={() => setIsAppointment(true)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isAppointment ? 'bg-teal-400 text-teal-950' : 'text-teal-400 hover:text-teal-300'
            }`}
            style={isAppointment ? { fontFamily: "'Outfit', sans-serif" } : {}}
          >
            Appointment
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="text-teal-400 text-xs font-medium block mb-1.5">Your Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full bg-teal-900/60 border border-teal-700/40 focus:border-teal-500 rounded-xl px-4 py-3 text-teal-50 placeholder-teal-700 outline-none transition-colors text-sm"
            />
          </div>

          <div>
            <label className="text-teal-400 text-xs font-medium block mb-1.5">Phone (optional — for SMS alerts)</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 514-555-0000"
              type="tel"
              className="w-full bg-teal-900/60 border border-teal-700/40 focus:border-teal-500 rounded-xl px-4 py-3 text-teal-50 placeholder-teal-700 outline-none transition-colors text-sm"
            />
          </div>

          <div>
            <label className="text-teal-400 text-xs font-medium block mb-1.5">Service</label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map(s => (
                <button
                  key={s}
                  onClick={() => setService(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    service === s
                      ? 'bg-teal-400 text-teal-950'
                      : 'bg-teal-900/60 border border-teal-700/30 text-teal-400 hover:border-teal-600/50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {isAppointment && (
            <div>
              <label className="text-teal-400 text-xs font-medium block mb-1.5">Select Time Slot</label>
              <div className="grid grid-cols-4 gap-2">
                {APPOINTMENT_SLOTS.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setAppointmentTime(slot)}
                    className={`py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      appointmentTime === slot
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-teal-900/60 border border-teal-700/30 text-teal-400 hover:border-teal-600/50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SMS opt-in */}
          {phone && (
            <div
              onClick={() => setNotifyEnabled(!notifyEnabled)}
              className="flex items-center justify-between bg-teal-900/40 border border-teal-700/30 rounded-xl px-4 py-3 cursor-pointer hover:border-teal-600/40 transition-colors"
            >
              <div>
                <p className="text-teal-200 text-sm font-medium">Notify me when I'm almost up</p>
                <p className="text-teal-600 text-xs mt-0.5">SMS alert when 2–3 people ahead</p>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 ${notifyEnabled ? 'bg-teal-400' : 'bg-teal-800'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${notifyEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>
          )}
        </div>

        {/* Position preview */}
        {name.trim() && (
          <div className="bg-teal-900/40 border border-teal-700/30 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
            <div>
              <p className="text-teal-400 text-xs">Your position</p>
              <p className="text-teal-50 font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>#{position} in queue</p>
            </div>
            <div className="text-right">
              <p className="text-teal-400 text-xs">Est. wait</p>
              <p className="text-amber-400 font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>~{estWait} min</p>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleJoin}
          disabled={!name.trim() || (isAppointment && !appointmentTime)}
          className="w-full bg-teal-400 hover:bg-teal-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-teal-950 font-bold text-lg py-4 rounded-xl transition-all duration-150"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Confirm &amp; Join →
        </button>
      </main>
    </div>
  );
}
