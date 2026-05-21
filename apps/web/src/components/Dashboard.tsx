export default function Dashboard() {
  const handleLogout = () => {
    // Destroy the key and reload the page to kick them out
    localStorage.removeItem('snipq_token');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-700">
          <h1 className="text-3xl font-bold text-emerald-400">SnipQ Dashboard</h1>
          <button 
            onClick={handleLogout} 
            className="bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-600 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-white">Welcome to the Shop! ✂️</h2>
          <p className="text-slate-400">
            Your JWT token is actively authenticating you. The next step is to load the available barbers and join the queue.
          </p>
        </div>

      </div>
    </div>
  );
}