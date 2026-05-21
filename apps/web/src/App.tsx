import { useState } from 'react';
import Dashboard from './components/Dashboard';
import BarberPanel from './components/BarberPanel';

export default function App() {
  // A memory bucket to remember which screen we are currently looking at
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'barber'>('dashboard');

  return (
    <div className="bg-slate-900 min-h-screen">
      
      {/* 🧭 The Permanent Navigation Bar */}
      <nav className="bg-slate-950 border-b border-slate-800 p-4 flex justify-center gap-4">
        <button
          onClick={() => setCurrentScreen('dashboard')}
          className={`px-6 py-2 rounded-lg font-bold transition-all duration-200 ${
            currentScreen === 'dashboard'
              ? 'bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Customer View (Dashboard)
        </button>
        <button
          onClick={() => setCurrentScreen('barber')}
          className={`px-6 py-2 rounded-lg font-bold transition-all duration-200 ${
            currentScreen === 'barber'
              ? 'bg-amber-500 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Owner View (Barber Panel)
        </button>
      </nav>

      {/* 🪄 The Magic: It instantly loads the correct component based on the button clicked */}
      {currentScreen === 'dashboard' ? <Dashboard /> : <BarberPanel />}
      
    </div>
  );
}