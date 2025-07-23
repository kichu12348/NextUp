import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEnvelope, FaLock, FaExclamationTriangle, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { authAPI } from '../services/api';
import styles from './AdminLogin.module.css';

const AdminLogin = () => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Check if admin is already authenticated
    const adminToken = localStorage.getItem('admin-token');
    if (adminToken) {
      navigate('/admin');
      return;
    }

    // Check if email was passed from login page
    if (location.state?.email) {
      setEmail(location.state.email);
      // Only auto-submit if not skipping auto OTP
      if (!location.state.skipAutoOTP) {
        handleEmailSubmitForPassedEmail(location.state.email);
      }
    }
  }, [navigate, location.state]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleEmailSubmitForPassedEmail = async (emailAddress: string) => {
    setIsLoading(true);
    setError('');

    try {
      await authAPI.requestOTP({ email: emailAddress.trim().toLowerCase() });
      setSuccess('OTP sent to your email!');
      setStep('otp');
      setResendTimer(60);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('Access denied: Admin account not found for this email.');
      } else if (error.response?.status === 400) {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    await handleEmailSubmitForPassedEmail(email);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyOTP({ 
        email: email.trim().toLowerCase(), 
        otp: otpCode 
      });
      
      // Store admin token
      localStorage.setItem('admin-token', response.data.token);
      setSuccess('Login successful!');
      setTimeout(() => navigate('/admin'), 1000);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('Invalid or expired OTP. Please try again.');
      } else {
        setError('Failed to verify OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    setError('');

    try {
      await authAPI.requestOTP({ email: email.trim().toLowerCase() });
      setSuccess('OTP sent successfully!');
      setResendTimer(60);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Portal</h1>
          <p className={styles.subtitle}>
            {step === 'email' 
              ? 'Enter your admin email to continue' 
              : 'Enter the 6-digit OTP sent to your email'
            }
          </p>
        </div>

        {error && (
          <div className={styles.error}>
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {success && (
          <div className={styles.success}>
            <FaCheckCircle />
            {success}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="Enter your admin email"
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.button}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className={styles.spinner} />
              ) : (
                <FaEnvelope />
              )}
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>

            <div className={styles.backToUser}>
              <button
                type="button"
                onClick={() => navigate('/')}
                className={styles.backButton}
              >
                <FaArrowLeft />
                Back to User Login
              </button>
            </div>
          </form>
        ) : (
          <>
            <button
              onClick={() => setStep('email')}
              className={styles.backButton}
            >
              <FaArrowLeft />
              Back to email
            </button>

            <form onSubmit={handleOtpSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Verification Code
                </label>
                <div className={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={styles.otpInput}
                      maxLength={1}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className={styles.button}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className={styles.spinner} />
                ) : (
                  <FaLock />
                )}
                {isLoading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <div className={styles.resendSection}>
                <p className={styles.resendText}>
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className={styles.resendButton}
                    disabled={resendTimer > 0 || isLoading}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
