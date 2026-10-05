import type { Customer, AppView } from '../types';
import { BUSINESS_NAME, AVG_SERVICE_MINUTES, JOIN_URL } from '../mockData';

interface Props {
  queue: Customer[];
  setView: (v: AppView) => void;
  isPaused: boolean;
}

function getStats(queue: Customer[]) {
  const serving = queue.filter(c => c.status === 'serving').length;
  const waiting = queue.filter(c => c.status === 'waiting').length;
  const wait = Math.round(serving * (AVG_SERVICE_MINUTES / 2) + waiting * AVG_SERVICE_MINUTES);
  return { waiting, wait };
}

function InitialsAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sizeClass} rounded-full bg-teal-800 border border-teal-600/40 flex items-center justify-center font-semibold text-teal-200`}>
      {initials}
    </div>
  );
}

export default function Landing({ queue, setView, isPaused }: Props) {
  const { waiting, wait } = getStats(queue);
  const serving = queue.find(c => c.status === 'serving');
  const firstWaiting = queue.filter(c => c.status === 'waiting').slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-400 flex items-center justify-center">
            <span className="text-teal-950 font-bold text-xs" style={{ fontFamily: "'Outfit', sans-serif" }}>Q</span>
          </div>
          <span className="text-teal-400 text-sm font-medium tracking-wide">QueueLess</span>
        </div>
        <button
          onClick={() => setView('owner')}
          className="text-teal-600 hover:text-teal-400 text-xs transition-colors py-1 px-2"
        >
          Owner Dashboard →
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-5 py-6 max-w-sm mx-auto w-full">

        {/* Business identity */}
        <div className="text-center mb-8 mt-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-900 border border-teal-700/40 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 32 32" className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 4v24M24 4v24M8 12h16M8 20h16" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-teal-50 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {BUSINESS_NAME.split(' ')[0]} & Co.
          </h1>
          <p className="text-teal-400 text-base">Barbershop</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
            <span className="text-teal-500 text-xs">Open · Downtown · Closes 8 PM</span>
          </div>
        </div>

        {/* Queue status card */}
        <div className="w-full bg-teal-900/70 border border-teal-700/30 rounded-2xl p-5 mb-5">
          {isPaused ? (
            <div className="text-center py-2">
              <div className="text-amber-400 font-semibold text-base mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Queue Paused</div>
              <p className="text-teal-500 text-sm">Walk-ins are temporarily paused. Check back soon.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div>
                  <div className="text-2xl font-bold text-teal-50" style={{ fontFamily: "'Outfit', sans-serif" }}>{waiting}</div>
                  <div className="text-teal-500 text-xs mt-0.5">waiting</div>
                </div>
                <div className="border-x border-teal-700/30">
                  <div className="text-2xl font-bold text-amber-400" style={{ fontFamily: "'Outfit', sans-serif" }}>~{wait}m</div>
                  <div className="text-teal-500 text-xs mt-0.5">est. wait</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400" style={{ fontFamily: "'Outfit', sans-serif" }}>Open</div>
                  <div className="text-teal-500 text-xs mt-0.5">status</div>
                </div>
              </div>

              {/* People in queue preview */}
              {(serving || firstWaiting.length > 0) && (
                <div className="border-t border-teal-700/20 pt-3">
                  <p className="text-teal-600 text-xs mb-2">Currently in queue</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {serving && (
                      <div className="flex items-center gap-1.5">
                        <InitialsAvatar name={serving.name} size="sm" />
                        <span className="text-xs text-green-400 font-medium">serving</span>
                      </div>
                    )}
                    {firstWaiting.map((c, i) => (
                      <div key={c.id} className="flex items-center gap-1">
                        <InitialsAvatar name={c.name} size="sm" />
                        {i < firstWaiting.length - 1 && (
                          <svg className="w-3 h-3 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    ))}
                    {waiting > 3 && (
                      <span className="text-teal-600 text-xs">+{waiting - 3} more</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* CTAs */}
        <div className="w-full flex flex-col gap-3 mb-6">
          <button
            onClick={() => setView('customer-join')}
            disabled={isPaused}
            className="w-full bg-teal-400 hover:bg-teal-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-teal-950 font-bold text-lg py-4 rounded-xl transition-all duration-150"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Join the Queue →
          </button>
          <button
            onClick={() => setView('customer-join')}
            className="w-full bg-transparent border border-teal-700/50 hover:border-teal-500/60 hover:bg-teal-900/40 active:scale-[0.98] text-teal-300 font-medium py-3.5 rounded-xl transition-all duration-150"
          >
            I Have an Appointment
          </button>
        </div>

        {/* QR hint */}
        <div className="text-center">
          <p className="text-teal-700 text-xs">{JOIN_URL}</p>
        </div>
      </main>
    </div>
  );
}
