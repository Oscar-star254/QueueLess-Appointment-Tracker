import { useState, useEffect } from 'react';
import type { Customer, AppView } from '../types';
import { BUSINESS_NAME, AVG_SERVICE_MINUTES } from '../mockData';

interface Props {
  queue: Customer[];
  setQueue: (q: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  setView: (v: AppView) => void;
  currentCustomerId: string | null;
}

function getPosition(queue: Customer[], id: string): number {
  const me = queue.find(c => c.id === id);
  if (!me) return -1;
  const ahead = queue.filter(c => c.status === 'waiting' && c.ticketNumber < me.ticketNumber).length;
  const serving = queue.filter(c => c.status === 'serving').length;
  return ahead + serving;
}

function getWait(queue: Customer[], id: string): number {
  const me = queue.find(c => c.id === id);
  if (!me) return 0;
  const ahead = queue.filter(c => c.status === 'waiting' && c.ticketNumber < me.ticketNumber).length;
  const serving = queue.filter(c => c.status === 'serving').length;
  return Math.round(serving * (AVG_SERVICE_MINUTES / 2) + ahead * AVG_SERVICE_MINUTES);
}

function getAheadCustomers(queue: Customer[], id: string): Customer[] {
  const me = queue.find(c => c.id === id);
  if (!me) return [];
  return queue.filter(c =>
    (c.status === 'waiting' || c.status === 'serving') &&
    c.ticketNumber < me.ticketNumber
  ).sort((a, b) => a.ticketNumber - b.ticketNumber);
}

function Initials({ name, highlight = false, small = false }: { name: string; highlight?: boolean; small?: boolean }) {
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const size = small ? 'w-9 h-9 text-xs' : 'w-11 h-11 text-sm';
  const style = highlight
    ? 'bg-amber-400 text-amber-950 border-2 border-amber-300 ring-2 ring-amber-400/30'
    : 'bg-teal-800 text-teal-200 border border-teal-600/40';
  return (
    <div className={`${size} ${style} rounded-full flex items-center justify-center font-bold shrink-0`}>
      {initials}
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-green-400 animate-pulse' : 'bg-teal-700'}`} />
  );
}

export default function CustomerWaiting({ queue, setQueue, setView, currentCustomerId }: Props) {
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [elapsed, setElapsed] = useState(0); // just for live feel

  // Tick for the "live" feel
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 30000);
    return () => clearInterval(t);
  }, []);

  if (!currentCustomerId) {
    setView('landing');
    return null;
  }

  const me = queue.find(c => c.id === currentCustomerId);
  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-teal-50 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>You're all done!</h2>
          <p className="text-teal-400 mb-6">Thanks for visiting {BUSINESS_NAME}.</p>
          <button onClick={() => setView('landing')} className="bg-teal-400 text-teal-950 font-bold px-6 py-3 rounded-xl" style={{ fontFamily: "'Outfit', sans-serif" }}>Back to Home</button>
        </div>
      </div>
    );
  }

  if (me.status === 'done' || me.status === 'skipped') {
    setView('landing');
    return null;
  }

  const position = getPosition(queue, currentCustomerId);
  const wait = getWait(queue, currentCustomerId);
  const ahead = getAheadCustomers(queue, currentCustomerId);
  const isBeingCalled = me.status === 'called' || me.status === 'serving';
  const peopleAheadCount = ahead.filter(c => c.status === 'waiting').length;

  function handleLeave() {
    setQueue(prev => prev.filter(c => c.id !== currentCustomerId));
    setView('landing');
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className="text-teal-500 text-xs">{BUSINESS_NAME}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <StatusDot active />
            <span className="text-teal-400 text-xs">Live updates on</span>
          </div>
        </div>
        <div className="bg-teal-900/60 border border-teal-700/30 rounded-lg px-3 py-1.5">
          <p className="text-teal-400 text-xs">Ticket</p>
          <p className="text-teal-200 font-bold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>#{me.ticketNumber}</p>
        </div>
      </header>

      <main className="flex-1 px-5 pb-8 max-w-sm mx-auto w-full">

        {/* Being called alert */}
        {isBeingCalled && (
          <div className="bg-amber-400/10 border border-amber-400/50 rounded-2xl p-4 mb-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
              <span className="text-xl">🔔</span>
            </div>
            <div>
              <p className="text-amber-400 font-semibold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>You're being called!</p>
              <p className="text-amber-300/70 text-xs mt-0.5">Head to the front — it's your turn</p>
            </div>
          </div>
        )}

        {/* Big position display */}
        <div className="text-center py-8">
          {isBeingCalled ? (
            <>
              <div className="text-7xl font-black text-amber-400 mb-2 leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>NOW</div>
              <p className="text-teal-300 text-lg font-medium">It's your turn!</p>
            </>
          ) : (
            <>
              <div className="text-xs font-medium text-teal-500 uppercase tracking-widest mb-1">Your position</div>
              <div className="text-8xl font-black text-teal-50 leading-none mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                #{position}
              </div>
              <p className="text-teal-400 text-sm">
                {peopleAheadCount === 0
                  ? "You're almost up!"
                  : `${peopleAheadCount} ${peopleAheadCount === 1 ? 'person' : 'people'} ahead of you`}
              </p>
            </>
          )}
        </div>

        {/* Wait time card */}
        {!isBeingCalled && (
          <div className="bg-teal-900/60 border border-teal-700/30 rounded-2xl p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-teal-500 text-xs uppercase tracking-wider">Estimated wait</span>
              <span className="text-amber-400 text-2xl font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {wait === 0 ? '&lt;5 min' : `~${wait} min`}
              </span>
            </div>

            {/* Queue visual */}
            <div className="flex items-center gap-2 flex-wrap">
              {ahead.slice(0, 4).map((c, i) => (
                <div key={c.id} className="flex items-center gap-1">
                  <div className="flex flex-col items-center gap-1">
                    <Initials name={c.name} small />
                    <span className={`text-xs font-medium ${c.status === 'serving' ? 'text-green-400' : 'text-teal-600'}`}>
                      {c.status === 'serving' ? 'now' : `#${i + 1}`}
                    </span>
                  </div>
                  <svg className="w-3 h-3 text-teal-700 mb-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
              <div className="flex flex-col items-center gap-1">
                <Initials name={me.name} highlight small />
                <span className="text-xs font-medium text-amber-400">you</span>
              </div>
            </div>
          </div>
        )}

        {/* Your details */}
        <div className="bg-teal-900/40 border border-teal-700/20 rounded-xl px-4 py-3 mb-5">
          <div className="flex items-center gap-3">
            <Initials name={me.name} />
            <div className="flex-1">
              <p className="text-teal-100 font-semibold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>{me.name}</p>
              <p className="text-teal-500 text-xs">{me.service}{me.isAppointment ? ` · Appt ${me.appointmentTime}` : ' · Walk-in'}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                me.status === 'serving' ? 'bg-green-400/15 text-green-400' :
                me.status === 'called'  ? 'bg-amber-400/15 text-amber-400' :
                'bg-teal-800 text-teal-400'
              }`}>
                {me.status === 'serving' ? 'Serving' : me.status === 'called' ? 'Called' : 'Waiting'}
              </span>
            </div>
          </div>
        </div>

        {/* Notification toggle */}
        {me.phone && (
          <div
            onClick={() => setNotifyEnabled(!notifyEnabled)}
            className="flex items-center justify-between bg-teal-900/40 border border-teal-700/30 rounded-xl px-4 py-3 mb-5 cursor-pointer hover:border-teal-600/40 transition-colors"
          >
            <div>
              <p className="text-teal-200 text-sm font-medium">SMS when almost up</p>
              <p className="text-teal-600 text-xs mt-0.5">Notify when 2 people remain</p>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 ${notifyEnabled ? 'bg-teal-400' : 'bg-teal-800'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${notifyEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
        )}

        {/* Leave queue */}
        <button
          onClick={handleLeave}
          className="w-full border border-red-400/30 hover:border-red-400/60 text-red-400/70 hover:text-red-400 font-medium py-3 rounded-xl transition-all duration-150 text-sm"
        >
          Leave Queue
        </button>
      </main>
    </div>
  );
}
