import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, user, isStaff } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in as staff, redirect to /admin
  React.useEffect(() => {
    if (user && isStaff) {
      navigate('/admin');
    }
  }, [user, isStaff, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInErr } = await signIn(email, password);
    if (signInErr) {
      setError(signInErr.message || 'Invalid credentials');
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-white bg-blueprint flex flex-col justify-center items-center p-3 sm:p-4 relative overflow-hidden">
      <div className="w-full max-w-md">
        {/* LOGO */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block relative mb-2 sm:mb-3">
            <img
              src="/logo.png"
              alt="JV Constructions"
              className="h-20 sm:h-24 w-auto object-contain mx-auto"
            />
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">JV Constructions</h2>
          <p className="text-xs text-slate-500 mt-1 px-2">
            Sign in to manage CAD layouts, plot inventories, and reservations.
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lift p-5 sm:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="admin@jvconstructions.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-900 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-jv-btn hover:opacity-95 text-white font-bold text-xs shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2 border border-teal-400/30"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-200" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-xs font-bold text-slate-500 hover:text-slate-800">
            ← Return to Public Customer Portal
          </Link>
        </div>
      </div>
    </div>
  );
};
