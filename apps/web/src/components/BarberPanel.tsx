import { useState, useEffect } from 'react';
import axios from 'axios';

interface Barber {
  id: string;
  name: string;
}

interface QueueEntry {
  id: string;
  position: number;
  status: string;
  customer: { name: string };
}

export default function BarberPanel() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const token = localStorage.getItem('snipq_token');
        const response = await axios.get('http://localhost:4000/api/barbers', {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` }
        });
        setBarbers(response.data);
        if (response.data.length > 0) {
          setSelectedBarberId(response.data[0].id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load barbers.');
      }
    };
    fetchBarbers();
  }, []);

  const fetchQueue = async (barberId: string) => {
    try {
      const token = localStorage.getItem('snipq_token');
      const response = await axios.get(`http://localhost:4000/api/queue/barber/${barberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQueue(response.data.queue);
    } catch (err) {
      console.error(err);
      setError('Failed to load the queue.');
    }
  };

  useEffect(() => {
    if (selectedBarberId) {
      fetchQueue(selectedBarberId);
    }
  }, [selectedBarberId]);

  const handleUpdateStatus = async (entryId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('snipq_token');
      await axios.patch(`http://localhost:4000/api/queue/${entryId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchQueue(selectedBarberId);
    } catch (err) {
      console.error(err);
      setError('Failed to update status.');
    }
  };

  // 🚀 NEW: The Emergency Reset Action
  const handleResetQueue = async () => {
    if (!window.confirm("Are you sure you want to completely clear this barber's line?")) return;
    
    try {
      const token = localStorage.getItem('snipq_token');
      await axios.delete(`http://localhost:4000/api/queue/barber/${selectedBarberId}/reset`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      fetchQueue(selectedBarberId);
    } catch (err) {
      console.error(err);
      setError('Failed to reset the queue.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        
        {error && <div className="bg-red-500/10 text-red-400 p-4 rounded-lg mb-6 border border-red-500/20">{error}</div>}

        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-400 mb-2">Select Barber to View Line:</label>
            <select 
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="w-full md:w-1/2 bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-amber-400"
            >
              {barbers.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              Waiting Line <span className="bg-amber-500 text-slate-900 text-sm font-bold px-3 py-1 rounded-full">{queue.length}</span>
            </h2>
            {/* 🚀 NEW: The Reset Button */}
            {queue.length > 0 && (
              <button 
                onClick={handleResetQueue}
                className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 font-bold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Reset Line
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {queue.length === 0 ? (
              <p className="text-slate-400 bg-slate-900/50 p-6 rounded-xl border border-slate-700 text-center">The waiting area is currently empty.</p>
            ) : (
              queue.map((entry) => (
                <div key={entry.id} className="bg-slate-700 p-4 rounded-xl border border-slate-600 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-800 text-amber-400 font-black text-2xl h-12 w-12 flex items-center justify-center rounded-lg shadow-inner">
                      #{entry.position}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{entry.customer.name}</h3>
                      <p className="text-sm font-medium text-slate-400">Status: <span className={entry.status === 'WAITING' ? 'text-amber-400' : 'text-emerald-400'}>{entry.status}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    {entry.status === 'WAITING' && (
                      <button 
                        onClick={() => handleUpdateStatus(entry.id, 'SERVING')}
                        className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2 px-6 rounded-lg transition-colors"
                      >
                        Serve
                      </button>
                    )}
                    <button 
                      onClick={() => handleUpdateStatus(entry.id, 'COMPLETED')}
                      className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}