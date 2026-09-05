import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { artStyles } from '../data/constants';

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [location, setLocation]   = useState('');
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [acceptedTerms, setAcceptedTerms]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  // After Supabase signUp — show "check your email" if confirmation is required
  const [emailSent, setEmailSent] = useState(false);

  const isFormValid =
    name.trim() !== '' &&
    email.trim() !== '' &&
    password.length >= 8 &&
    location.trim() !== '' &&
    selectedStyles.length > 0 &&
    acceptedTerms;

  const handleStyleToggle = (style) => {
    setSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    setError('');

    const res = await signUp({ name, email, password, location, preferredStyles: selectedStyles });
    setLoading(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    // Supabase may require email confirmation before a session exists.
    // If we have a session right away (email confirmation disabled in dashboard),
    // navigate home. Otherwise show the "check your email" screen.
    if (res.sessionExists) {
      navigate('/');
    } else {
      setEmailSent(true);
    }
  };

  // ── Email confirmation sent screen ────────────────────────
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check your email</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account, then sign in.
            </p>
          </div>
          <Link
            to="/signin"
            className="inline-block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50">

        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">AA</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-display font-bold text-gray-900 dark:text-white">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Join us to personalise your art gallery experience
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          <div className="space-y-4">

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input id="name" type="text" required value={name} onChange={e => setName(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g. John Doe" />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="john@example.com" />
            </div>

            <div>
              <label htmlFor="password-signup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password (min 8 characters)</label>
              <input id="password-signup" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="••••••••" />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location (City, Country)</label>
              <input id="location" type="text" required value={location} onChange={e => setLocation(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g. Nairobi, Kenya" />
            </div>

            {/* Art style preferences */}
            <div>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What art styles do you love? <span className="text-gray-400">(select at least 1)</span>
              </span>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-800">
                {artStyles.map(style => {
                  const selected = selectedStyles.includes(style);
                  return (
                    <button key={style} type="button" onClick={() => handleStyleToggle(style)}
                      className={`text-xs text-left px-3 py-2 rounded-lg font-medium border transition-colors ${
                        selected
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400'
                      }`}>
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input id="accept-terms-signup" type="checkbox" checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <label htmlFor="accept-terms-signup" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              I have read and accepted the{' '}
              <Link to="/terms" target="_blank" className="text-blue-500 hover:text-blue-600 font-medium">Terms & Conditions</Link>
            </label>
          </div>

          <button type="submit" disabled={!isFormValid || loading}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              isFormValid && !loading
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}>
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/signin" className="text-blue-500 hover:text-blue-600 font-semibold">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
