import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import type { Customer, Appointment, AppView, OwnerTab } from '../types';
import { BUSINESS_NAME, JOIN_URL, initialAppointments, hourlyData, weeklyData } from '../mockData';
import {
  sendWhatsAppNotification, saveWhatsAppConfig, clearWhatsAppConfig,
  type WhatsAppConfig,
} from '../services/whatsapp';

interface Props {
  queue: Customer[];
  setQueue: (q: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  setView: (v: AppView) => void;
  isPaused: boolean;
  setIsPaused: (v: boolean) => void;
  activeTab: OwnerTab;
  setActiveTab: (t: OwnerTab) => void;
  whatsappConfig: WhatsAppConfig | null;
  setWhatsappConfig: (c: WhatsAppConfig | null) => void;
}

function Initials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const s = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
  return (
    <div className={`${s} rounded-full bg-teal-800 border border-teal-600/40 flex items-center justify-center font-bold text-teal-200 shrink-0`}>
      {initials}
    </div>
  );
}

function StatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-teal-900/60 border border-teal-700/30 rounded-xl p-4">
      <p className="text-teal-500 text-xs mb-2">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-amber-400' : 'text-teal-50'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</p>
      {sub && <p className="text-teal-600 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

export default function OwnerDashboard({ queue, setQueue, setView, isPaused, setIsPaused, activeTab, setActiveTab, whatsappConfig, setWhatsappConfig }: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [showQR, setShowQR] = useState(false);
  const [showWASetup, setShowWASetup] = useState(false);
  const [waPhone, setWaPhone] = useState(whatsappConfig?.phone ?? '');
  const [waApiKey, setWaApiKey] = useState(whatsappConfig?.apiKey ?? '');
  const [waTesting, setWaTesting] = useState(false);
  const [waTestResult, setWaTestResult] = useState<'sent' | 'error' | null>(null);

  const serving = queue.find(c => c.status === 'serving');
  const waiting = queue.filter(c => c.status === 'waiting').sort((a, b) => a.ticketNumber - b.ticketNumber);
  const doneToday = queue.filter(c => c.status === 'done').length + 12; // +12 simulated earlier

  function callNext() {
    setQueue(prev => {
      const nextWaiting = [...prev].sort((a, b) => a.ticketNumber - b.ticketNumber).find(c => c.status === 'waiting');
      if (!nextWaiting) return prev;
      return prev.map(c => {
        if (c.status === 'serving') return { ...c, status: 'done' as const };
        if (c.id === nextWaiting.id) return { ...c, status: 'serving' as const };
        return c;
      });
    });
  }

  function markDone(id: string) {
    setQueue(prev => prev.map(c => c.id === id ? { ...c, status: 'done' as const } : c));
  }

  function skipCustomer(id: string) {
    setQueue(prev => {
      const maxTicket = Math.max(...prev.map(c => c.ticketNumber));
      return prev.map(c => c.id === id ? { ...c, ticketNumber: maxTicket + 1 } : c);
    });
  }

  function removeCustomer(id: string) {
    setQueue(prev => prev.filter(c => c.id !== id));
  }

  function updateAppt(id: string, status: Appointment['status']) {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  const avgWait = 22;

  function saveWA() {
    if (!waPhone.trim() || !waApiKey.trim()) return;
    const cfg = { phone: waPhone.trim(), apiKey: waApiKey.trim() };
    saveWhatsAppConfig(cfg);
    setWhatsappConfig(cfg);
    setShowWASetup(false);
  }

  function disconnectWA() {
    clearWhatsAppConfig();
    setWhatsappConfig(null);
    setWaPhone('');
    setWaApiKey('');
    setShowWASetup(false);
  }

  async function testWA() {
    if (!waPhone.trim() || !waApiKey.trim()) return;
    setWaTesting(true);
    setWaTestResult(null);
    try {
      await sendWhatsAppNotification(
        { phone: waPhone.trim(), apiKey: waApiKey.trim() },
        `✅ QueueLess connected!\n\nYou'll receive a WhatsApp message each time a customer joins the queue at ${BUSINESS_NAME}.`,
      );
      setWaTestResult('sent');
    } catch {
      setWaTestResult('error');
    } finally {
      setWaTesting(false);
    }
  }

  const TABS: { id: OwnerTab; label: string }[] = [
    { id: 'queue', label: 'Queue' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'appointments', label: 'Appointments' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-teal-950/80 border-b border-teal-800/40 px-5 pt-5 pb-4 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4 max-w-2xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-6 h-6 rounded-md bg-teal-400 flex items-center justify-center">
                <span className="text-teal-950 font-bold text-xs" style={{ fontFamily: "'Outfit', sans-serif" }}>Q</span>
              </div>
              <span className="text-teal-500 text-xs">QueueLess · Owner</span>
            </div>
            <h1 className="text-lg font-bold text-teal-50" style={{ fontFamily: "'Outfit', sans-serif" }}>{BUSINESS_NAME}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* WhatsApp connect button */}
            <button
              onClick={() => setShowWASetup(true)}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                whatsappConfig
                  ? 'bg-green-500/15 border-green-500/40 text-green-400 hover:bg-green-500/25'
                  : 'bg-teal-900 border-teal-700/40 text-teal-400 hover:bg-teal-800'
              }`}
              title={whatsappConfig ? 'WhatsApp connected' : 'Connect WhatsApp'}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
            <button
              onClick={() => setShowQR(!showQR)}
              className="w-8 h-8 rounded-lg bg-teal-900 border border-teal-700/40 flex items-center justify-center text-teal-400 hover:bg-teal-800 transition-colors"
              title="Show QR code"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>
              </svg>
            </button>
            {/* Pause toggle */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                isPaused
                  ? 'bg-amber-400/15 border border-amber-400/40 text-amber-400'
                  : 'bg-teal-900 border border-teal-700/40 text-teal-400 hover:border-teal-600/50'
              }`}
            >
              {isPaused ? (
                <><svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>Resume</>
              ) : (
                <><svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Pause</>
              )}
            </button>
          </div>
        </div>

        {/* QR panel */}
        {showQR && (
          <div className="max-w-2xl mx-auto mb-3 bg-teal-900/60 border border-teal-700/30 rounded-xl p-4 flex items-center gap-4">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&color=2dd4bf&bgcolor=042f2e&data=https://${JOIN_URL}`}
              alt="Queue join QR code"
              className="w-20 h-20 rounded-lg"
            />
            <div>
              <p className="text-teal-200 font-medium text-sm mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Customer Join Link</p>
              <p className="text-teal-400 text-xs font-mono mb-2">{JOIN_URL}</p>
              <p className="text-teal-600 text-xs">Show this QR code at your counter or door</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 max-w-2xl mx-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === t.id
                  ? 'bg-teal-400 text-teal-950'
                  : 'text-teal-400 hover:text-teal-300'
              }`}
              style={activeTab === t.id ? { fontFamily: "'Outfit', sans-serif" } : {}}
            >
              {t.label}
              {t.id === 'queue' && waiting.length > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === t.id ? 'bg-teal-800/30 text-teal-800' : 'bg-teal-800 text-teal-400'}`}>
                  {waiting.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* WhatsApp Setup Modal */}
      {showWASetup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-teal-950/80 backdrop-blur-sm" onClick={() => setShowWASetup(false)}>
          <div
            className="w-full max-w-md bg-teal-900 border border-teal-700/40 rounded-2xl p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-teal-50 font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>WhatsApp Notifications</h2>
                <p className="text-teal-500 text-xs">Get a message every time a customer joins</p>
              </div>
            </div>

            {/* One-time setup instructions */}
            {!whatsappConfig && (
              <div className="bg-teal-950/60 border border-teal-700/30 rounded-xl p-4 mb-5">
                <p className="text-teal-300 text-xs font-semibold uppercase tracking-wider mb-3">One-time setup (free)</p>
                <ol className="flex flex-col gap-2 text-sm text-teal-400">
                  <li className="flex gap-2">
                    <span className="text-teal-600 shrink-0 font-mono">1.</span>
                    Open WhatsApp and add <span className="text-teal-200 font-medium">+34 644 82 57 32</span> as a contact
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-600 shrink-0 font-mono">2.</span>
                    Send that contact exactly: <span className="text-teal-200 font-mono text-xs bg-teal-800 px-1.5 py-0.5 rounded">I allow callmebot to send me messages</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-600 shrink-0 font-mono">3.</span>
                    They'll reply with your API key — paste it below
                  </li>
                </ol>
              </div>
            )}

            {/* Form */}
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="text-teal-400 text-xs font-medium block mb-1.5">Your WhatsApp Number</label>
                <input
                  value={waPhone}
                  onChange={e => setWaPhone(e.target.value)}
                  placeholder="e.g. 447911123456 (no + or spaces)"
                  className="w-full bg-teal-950/60 border border-teal-700/40 focus:border-teal-500 rounded-xl px-4 py-2.5 text-teal-50 placeholder-teal-700 outline-none transition-colors text-sm font-mono"
                />
                <p className="text-teal-700 text-xs mt-1">International format, no + — e.g. 447911123456 for UK, 12125550199 for US</p>
              </div>
              <div>
                <label className="text-teal-400 text-xs font-medium block mb-1.5">CallMeBot API Key</label>
                <input
                  value={waApiKey}
                  onChange={e => setWaApiKey(e.target.value)}
                  placeholder="Paste API key from CallMeBot reply"
                  className="w-full bg-teal-950/60 border border-teal-700/40 focus:border-teal-500 rounded-xl px-4 py-2.5 text-teal-50 placeholder-teal-700 outline-none transition-colors text-sm font-mono"
                />
              </div>
            </div>

            {/* Test result */}
            {waTestResult === 'sent' && (
              <div className="bg-green-400/10 border border-green-400/30 rounded-xl px-4 py-2.5 mb-4 text-green-400 text-sm">
                ✓ Test message sent — check your WhatsApp!
              </div>
            )}
            {waTestResult === 'error' && (
              <div className="bg-red-400/10 border border-red-400/30 rounded-xl px-4 py-2.5 mb-4 text-red-400 text-sm">
                ✗ Could not send — double-check your number and API key
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={testWA}
                disabled={waTesting || !waPhone.trim() || !waApiKey.trim()}
                className="flex-1 border border-teal-700/40 hover:border-teal-600/60 disabled:opacity-40 text-teal-400 hover:text-teal-200 text-sm py-2.5 rounded-xl transition-colors"
              >
                {waTesting ? 'Sending…' : 'Send Test'}
              </button>
              <button
                onClick={saveWA}
                disabled={!waPhone.trim() || !waApiKey.trim()}
                className="flex-1 bg-green-500 hover:bg-green-400 active:scale-[0.98] disabled:opacity-40 text-white font-semibold text-sm py-2.5 rounded-xl transition-all"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {whatsappConfig ? 'Update' : 'Connect'}
              </button>
            </div>

            {whatsappConfig && (
              <button
                onClick={disconnectWA}
                className="w-full mt-2 text-red-400/50 hover:text-red-400 text-xs py-2 transition-colors"
              >
                Disconnect WhatsApp
              </button>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 px-5 py-5 max-w-2xl mx-auto w-full">

        {/* QUEUE TAB */}
        {activeTab === 'queue' && (
          <div className="flex flex-col gap-5">
            {/* Paused banner */}
            {isPaused && (
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-amber-400 text-lg">⏸</span>
                <div>
                  <p className="text-amber-400 font-medium text-sm">Queue is paused</p>
                  <p className="text-amber-300/60 text-xs">New customers cannot join until you resume</p>
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <StatTile label="Waiting" value={String(waiting.length)} />
              <StatTile label="Served today" value={String(doneToday)} sub="+12 earlier" />
              <StatTile label="Avg wait" value={`${avgWait}m`} accent />
            </div>

            {/* Now serving */}
            {serving ? (
              <div className="bg-green-400/5 border border-green-400/25 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                  <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">Now Serving</span>
                </div>
                <div className="flex items-center gap-3">
                  <Initials name={serving.name} size="lg" />
                  <div className="flex-1">
                    <p className="text-teal-50 font-bold text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>{serving.name}</p>
                    <p className="text-teal-400 text-xs">{serving.service} · Ticket #{serving.ticketNumber}</p>
                  </div>
                  <button
                    onClick={() => markDone(serving.id)}
                    className="bg-green-400/15 border border-green-400/30 hover:bg-green-400/25 text-green-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  >
                    Done ✓
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-teal-900/40 border border-teal-700/20 border-dashed rounded-2xl p-5 text-center">
                <p className="text-teal-600 text-sm">No one being served right now</p>
                <p className="text-teal-700 text-xs mt-0.5">Call the next customer to begin</p>
              </div>
            )}

            {/* Waiting list */}
            {waiting.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-teal-300 text-sm font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Waiting Queue
                  </h2>
                  <span className="text-teal-600 text-xs">{waiting.length} people</span>
                </div>
                <div className="flex flex-col gap-2">
                  {waiting.map((c, i) => {
                    const waitedMins = Math.floor((Date.now() - c.joinedAt.getTime()) / 60000);
                    return (
                      <div key={c.id} className="bg-teal-900/50 border border-teal-700/30 hover:border-teal-600/40 rounded-xl px-4 py-3 flex items-center gap-3 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-teal-800/60 flex items-center justify-center text-xs font-bold text-teal-500 shrink-0">
                          {i + 1}
                        </div>
                        <Initials name={c.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-teal-100 font-medium text-sm truncate" style={{ fontFamily: "'Outfit', sans-serif" }}>{c.name}</p>
                            {c.isAppointment && (
                              <span className="text-amber-400 text-xs bg-amber-400/10 px-1.5 py-0.5 rounded-full shrink-0">Appt</span>
                            )}
                          </div>
                          <p className="text-teal-600 text-xs">{c.service} · {waitedMins}m waiting</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => skipCustomer(c.id)}
                            className="text-teal-600 hover:text-teal-400 text-xs px-2 py-1.5 rounded-lg hover:bg-teal-800/40 transition-colors"
                          >
                            Skip
                          </button>
                          <button
                            onClick={() => removeCustomer(c.id)}
                            className="text-red-400/50 hover:text-red-400 text-xs px-2 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Call next CTA */}
            <button
              onClick={callNext}
              disabled={waiting.length === 0}
              className="w-full bg-teal-400 hover:bg-teal-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-teal-950 font-bold py-4 rounded-xl transition-all duration-150 text-base"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {waiting.length === 0 ? 'No one waiting' : `Call Next Customer →`}
            </button>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Served today" value={String(doneToday)} sub="vs 19 yesterday" />
              <StatTile label="Avg wait" value={`${avgWait}m`} sub="−3m vs last week" accent />
              <StatTile label="Peak hour" value="4–5 PM" sub="19 customers" />
              <StatTile label="No-shows" value="2" sub="appt only" />
            </div>

            {/* Hourly distribution */}
            <div className="bg-teal-900/60 border border-teal-700/30 rounded-2xl p-5">
              <h2 className="text-teal-200 font-semibold text-sm mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Today — Customers by Hour
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={hourlyData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,184,166,0.08)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: '#5eead4', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5eead4', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(20,184,166,0.07)' }}
                    contentStyle={{ backgroundColor: '#134e4a', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '8px', color: '#f0fdfa', fontSize: '12px' }}
                  />
                  <Bar dataKey="customers" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly */}
            <div className="bg-teal-900/60 border border-teal-700/30 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-teal-200 font-semibold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  This Week
                </h2>
                <span className="text-teal-500 text-xs">412 total</span>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={weeklyData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,184,166,0.08)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#5eead4', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5eead4', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ stroke: 'rgba(20,184,166,0.3)', strokeWidth: 1 }}
                    contentStyle={{ backgroundColor: '#134e4a', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '8px', color: '#f0fdfa', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="customers" stroke="#14b8a6" strokeWidth={2} fill="url(#weekGrad)" dot={{ fill: '#14b8a6', r: 3, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Wait time trend */}
            <div className="bg-teal-900/60 border border-teal-700/30 rounded-2xl p-5">
              <h2 className="text-teal-200 font-semibold text-sm mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Avg Wait by Hour</h2>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart
                  data={hourlyData.map((h, i) => ({ ...h, wait: [8, 12, 18, 22, 25, 20, 24, 28, 30, 26, 18, 12][i] }))}
                  margin={{ top: 0, right: 0, left: -28, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="waitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,184,166,0.08)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: '#5eead4', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#5eead4', fontSize: 10 }} axisLine={false} tickLine={false} unit="m" />
                  <Tooltip
                    cursor={{ stroke: 'rgba(245,158,11,0.3)', strokeWidth: 1 }}
                    contentStyle={{ backgroundColor: '#134e4a', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '8px', color: '#f0fdfa', fontSize: '12px' }}
                    formatter={(v) => [`${v} min`, 'Avg wait']}
                  />
                  <Area type="monotone" dataKey="wait" stroke="#f59e0b" strokeWidth={2} fill="url(#waitGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-teal-200 font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>Today's Appointments</h2>
              <span className="text-teal-600 text-xs">{appointments.length} scheduled</span>
            </div>

            <div className="flex flex-col gap-2">
              {appointments.map(a => {
                const statusStyles: Record<Appointment['status'], string> = {
                  scheduled: 'bg-teal-800/40 text-teal-400',
                  arrived:   'bg-amber-400/15 text-amber-400',
                  serving:   'bg-green-400/15 text-green-400',
                  done:      'bg-teal-800/20 text-teal-600',
                  'no-show': 'bg-red-400/10 text-red-400',
                };
                const isDone = a.status === 'done' || a.status === 'no-show';

                return (
                  <div key={a.id} className={`bg-teal-900/50 border border-teal-700/30 rounded-xl px-4 py-3 flex items-center gap-3 transition-opacity ${isDone ? 'opacity-50' : ''}`}>
                    <div className="w-14 text-center shrink-0">
                      <p className="text-teal-200 text-sm font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>{a.time}</p>
                    </div>
                    <div className="w-px h-8 bg-teal-700/30 shrink-0" />
                    <Initials name={a.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-teal-100 font-medium text-sm truncate" style={{ fontFamily: "'Outfit', sans-serif" }}>{a.name}</p>
                      <p className="text-teal-600 text-xs">{a.service}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[a.status]}`}>
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1).replace('-', ' ')}
                      </span>
                      {!isDone && (
                        <div className="flex gap-1">
                          {a.status === 'scheduled' && (
                            <button
                              onClick={() => updateAppt(a.id, 'arrived')}
                              className="text-xs text-teal-400 hover:text-teal-200 px-2 py-1 rounded-lg hover:bg-teal-800/40 transition-colors"
                            >
                              Arrived
                            </button>
                          )}
                          {(a.status === 'arrived' || a.status === 'serving') && (
                            <button
                              onClick={() => updateAppt(a.id, 'done')}
                              className="text-xs text-green-400 hover:text-green-300 px-2 py-1 rounded-lg hover:bg-green-400/10 transition-colors"
                            >
                              Done
                            </button>
                          )}
                          <button
                            onClick={() => updateAppt(a.id, 'no-show')}
                            className="text-xs text-red-400/50 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-400/10 transition-colors"
                          >
                            No-show
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add slot CTA */}
            <button className="w-full border border-dashed border-teal-700/40 hover:border-teal-600/60 text-teal-600 hover:text-teal-400 py-3 rounded-xl text-sm transition-colors">
              + Add Appointment Slot
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
