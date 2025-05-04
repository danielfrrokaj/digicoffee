import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signInWithPassword } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await signInWithPassword({ email, password });
      if (signInError) {
        throw signInError;
      }
      // Navigation will be handled by App.tsx based on session/role change
      // navigate('/admin'); // No need to navigate directly here
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
        <h3 className="text-2xl font-bold text-center mb-6">Admin Login</h3>
        <form onSubmit={handleLogin}>
          <div className="mt-4">
            <label className="block" htmlFor="email">Email</label>
            <input 
              type="email"
              placeholder="Email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              required
            />
          </div>
          <div className="mt-4">
            <label className="block" htmlFor="password">Password</label>
            <input 
              type="password"
              placeholder="Password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              required
            />
          </div>
          {error && <p className="mt-4 text-xs text-red-600">{error}</p>}
          <div className="flex items-baseline justify-between mt-6">
            <button 
              type="submit" 
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-900 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            {/* Optional: Add forgot password link */}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 