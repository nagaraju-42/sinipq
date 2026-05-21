import { useState } from 'react';
import { api } from '../lib/api'; // 1. Import our custom Axios instance

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  
  // 2. Track exactly what the user types
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [error, setError] = useState('');

  // 3. The function that runs when the form is submitted
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop the page from refreshing
    setError(''); // Clear any old errors

    try {
      let response;
      if (isLogin) {
        response = await api.post('/auth/login', { phone, password });
      } else {
        response = await api.post('/auth/register', { name, phone, password, role, email });
      }

      // If successful, extract the token and user data from the backend's response
      const { token, user } = response.data;
      
      // Save the token securely in the browser
      localStorage.setItem('snipq_token', token);
      
      alert(`Success! Welcome ${user.name}. You are now logged in.`);
      window.location.reload();//day-8
      
    } catch (err: any) {
      // If the backend sends an error (like "Invalid password"), display it
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-400 mb-2">SnipQ</h1>
          <p className="text-slate-400">
            {isLogin ? 'Welcome back! Sign in to join the line.' : 'Create an account to get started.'}
          </p>
        </div>

        {/* Show error messages here if they type the wrong password */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Notice we added onSubmit={handleSubmit} here */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">I am a...</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500">
                  <option value="CUSTOMER">Customer</option>
                  <option value="BARBER">Barber</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500" placeholder="1234567890" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500" placeholder="••••••••" />
          </div>

          {/* Notice we changed this from type="button" to type="submit" */}
          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-2 px-4 rounded-lg transition-colors mt-6">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-emerald-400 hover:underline font-medium">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>

      </div>
    </div>
  );
}