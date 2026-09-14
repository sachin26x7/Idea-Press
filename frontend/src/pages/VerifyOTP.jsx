import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '../components/ui/card';
import { Loader2 } from 'lucide-react';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const contextValue = useContext(AuthContext);
  const { login = () => {} } = contextValue || {};
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const emailSent = location.state?.emailSent;

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await axios.post('/api/auth/verify-otp', { email, otp });
      login(data);
      navigate('/interests', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };



  const handleResendOtp = async () => {
    setResending(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await axios.post('/api/auth/resend-otp', { email });
      setSuccess(data.message || 'New OTP sent!');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-[70vh] relative -mt-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/20 blur-[130px] rounded-full pointer-events-none -z-10"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="w-full max-w-md z-10"
      >
        <Card className="w-full glass shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
          <CardHeader className="text-center space-y-1 pt-4 pb-2">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-12 h-12 mx-auto bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.3)] mb-1"
            >
              <span className="text-2xl">✉️</span>
            </motion.div>
            <CardTitle className="text-2xl font-bold text-foreground">Verify Email</CardTitle>
            <CardDescription className="text-sm font-medium">
              {emailSent === false 
                ? 'OTP email could not be sent. You can skip verification below.'
                : `Enter the 6-digit OTP sent to ${email}`
              }
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3 px-6 pb-2">
              {error && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-destructive text-sm font-semibold p-3 bg-destructive/10 rounded-xl border border-destructive/20 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-primary text-sm font-semibold p-3 bg-primary/10 rounded-xl border border-primary/20 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  {success}
                </motion.div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground tracking-wide flex justify-center">OTP CODE</label>
                <Input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="bg-background border-input text-center text-2xl tracking-widest font-mono h-12 focus-visible:ring-primary focus-visible:border-primary"
                  placeholder="000000"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pb-6 px-6 pt-2">
              <Button type="submit" className="w-full h-10 flex items-center justify-center gap-2 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading || otp.length !== 6}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Log In'
                )}
              </Button>

              <Button type="button" variant="outline" className="w-full h-9 flex items-center justify-center gap-2 text-sm" onClick={handleResendOtp} disabled={resending}>
                {resending ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend OTP'
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground font-medium">
                Check your spam folder if you don't see the email.
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
