import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, UserRound } from 'lucide-react';

export default function Register() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/auth/register', { name, email, password });
      // Redirect to OTP verification with email state
      navigate('/verify-otp', { state: { email, emailSent: data.emailSent } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-backdrop auth-backdrop-one" />
      <div className="auth-backdrop auth-backdrop-two" />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="auth-shell auth-shell-signup"
      >
        {/* ── Left illustrated panel ── */}
        <aside className="auth-visual" aria-hidden="true">
          <img
            src="/auth-signup.jpg"
            alt="Creative workspace illustration"
            className="auth-visual-img"
          />

          <div className="auth-visual-copy">
            <h2>
              Let's get started!&nbsp;
              <span className="auth-sparkle">🌟</span>
            </h2>
          </div>
        </aside>

        {/* ── Right form panel ── */}
        <section className="auth-form-panel" aria-labelledby="signup-title">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="auth-heading">
              <h1 id="signup-title">Create your account</h1>
              <p>Start your journey with IdeaPress <span className="auth-emoji">💡</span></p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="auth-alert"
                  role="alert"
                >
                  <span />
                  {error}
                </motion.div>
              )}

              <div className="auth-field">
                <label htmlFor="signup-name">Full name</label>
                <div className="auth-input-wrap">
                  <UserRound size={17} />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-email">Email address</label>
                <div className="auth-input-wrap">
                  <Mail size={17} />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-password">Create a password</label>
                <div className="auth-input-wrap">
                  <LockKeyhole size={17} />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading
                  ? <><Loader2 size={18} className="auth-spinner" /> Creating account…</>
                  : 'Create account'}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{' '}
              <Link to="/login">Sign in <span aria-hidden="true">↗</span></Link>
            </p>
            <Link to="/landing" className="auth-home-link">
              ← Return to landing page
            </Link>
          </motion.div>
        </section>
      </motion.div>
    </main>
  );
}
