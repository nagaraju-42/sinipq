import { useState, useEffect } from 'react';
import axios from 'axios';

interface Barber {
  id: string;
  name: string;
  phone?: string;
}

// 🚀 NEW: We need to know what a Ticket looks like
interface QueueTicket {
  id: string;
  position: number;
  status: string;
  barber: { user: { name: string } };
  salon: { name: string };
}

export default function Dashboard() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [myTicket, setMyTicket] = useState<QueueTicket | null>(null); // 🚀 NEW: Bucket for your ticket
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // 🚀 UPDATED: Now checks your personal queue status first!
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('snipq_token');
      const config = {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` }
      };

      // 1. Ask the backend: "Am I in line?"
      const statusRes = await axios.get('http://localhost:4000/api/queue/status', config);

      if (statusRes.data.inQueue) {
        // If yes, save the ticket!
        setMyTicket(statusRes.data.queueEntry);
      } else {
        // 2. If no, fetch the available barbers so you can join one
        const barberRes = await axios.get('http://localhost:4000/api/barbers', config);
        setBarbers(barberRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('snipq_token');
    window.location.reload();
  };

  const handleJoinQueue = async (barberId: string) => {
    try {
      const token = localStorage.getItem('snipq_token');
      await axios.post('http://localhost:4000/api/queue/join',
        { barberId },
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage('Successfully joined the queue! ✂️');
      setError('');
      
      // 🚀 FIX: Instantly refresh the data so your new ticket appears!
      fetchData(); 
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to join the queue.');
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-700">
          <h1 className="text-3xl font-bold text-emerald-400">SnipQ Dashboard</h1>
          <button onClick={handleLogout} className="bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-600 px-4 py-2 rounded-lg font-medium transition-colors">
            Sign Out
          </button>
        </div>

        {message && <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-lg mb-6 border border-emerald-500/20">{message}</div>}
        {error && <div className="bg-red-500/10 text-red-400 p-4 rounded-lg mb-6 border border-red-500/20">{error}</div>}

        {/* 🚀 NEW: The UI switches based on whether you have a ticket or not! */}
        {myTicket ? (
          <div className="bg-emerald-900/20 rounded-2xl p-8 border border-emerald-500/30 shadow-xl text-center">
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">You are in line! 🎉</h2>
            <p className="text-slate-300 mb-6">Waiting for {myTicket.barber.user.name}</p>

            <div className="bg-slate-800 rounded-xl p-6 inline-block border border-slate-700 shadow-inner">
              <p className="text-sm text-slate-400 uppercase tracking-wider mb-1">Your Position</p>
              <p className="text-6xl font-black text-white">#{myTicket.position}</p>
            </div>

            <p className="mt-6 text-sm text-slate-500 tracking-wide font-medium">STATUS: {myTicket.status}</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 text-white">Available Barbers ✂️</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {barbers.length === 0 ? (
                <p className="text-slate-400">No barbers are currently working.</p>
              ) : (
                barbers.map((barber) => (
                  <div key={barber.id} className="bg-slate-700 p-4 rounded-xl border border-slate-600 flex justify-between items-center hover:border-slate-500 transition-colors">
                    <div>
                      <h3 className="font-bold text-lg text-emerald-300">{barber.name}</h3>
                      <p className="text-sm text-slate-400">{barber.phone}</p>
                    </div>
                    <button
                      onClick={() => handleJoinQueue(barber.id)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2 px-4 rounded-lg transition-colors active:scale-95"
                    >
                      Join Queue
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}