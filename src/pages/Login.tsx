import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowLeft,
} from "react-icons/fa";
import { participantAPI, authAPI } from "../services/api";
import { useAuthStore } from "../store";
import { CustomDropdown } from "../components";
import styles from "./Login.module.css";

const Login = () => {
  const [step, setStep] = useState<"email" | "details" | "otp">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [gender, setGender] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // First check if this is an admin email without sending OTP
      try {
        const adminCheckResponse = await authAPI.checkAdmin(
          email.trim().toLowerCase()
        );
        if (adminCheckResponse.data.isAdmin) {
          // This is an admin email, redirect to admin login without auto-sending OTP
          navigate("/admin/login", {
            state: { email: email.trim().toLowerCase(), skipAutoOTP: true },
          });
          return;
        }
      } catch (adminError: any) {
        // If admin check fails, continue with participant flow
        console.log("Admin check failed, proceeding with participant flow");
      }

      // Proceed with participant flow
      const response = await participantAPI.requestOTP({
        email: email.trim().toLowerCase(),
      });
      if (response.data.isNewUser) {
        // New user - need to collect name and college first
        setIsNewUser(true);
        setStep("details");
      } else {
        // Existing user - OTP sent
        setSuccess("OTP sent to your email!");
        setStep("otp");
        setResendTimer(60);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.isNewUser) {
        // New user needs to provide name and college
        setIsNewUser(true);
        setStep("details");
      } else if (error.response?.status === 400) {
        setError("Please enter a valid email address.");
      } else {
        setError("Failed to process request. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!college.trim()) {
      setError("Please enter your college name");
      return;
    }
    if (!gender.trim()) {
      setError("Please select your gender");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Request OTP with name and college for new user
      await participantAPI.requestOTP({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        college: college.trim(),
        gender: gender.trim(),
      });
      setSuccess("OTP sent to your email!");
      setStep("otp");
      setResendTimer(60);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Verify OTP for participant
      const response = await participantAPI.verifyOTP({
        email: email.trim().toLowerCase(),
        otp: otpCode,
      });

      // Store participant token and login
      localStorage.setItem("participant-token", response.data.token);
      login(response.data.token, response.data.participant);
      setSuccess("Login successful!");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError("Invalid or expired OTP. Please try again.");
      } else {
        setError("Failed to verify OTP. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    setError("");

    try {
      // Resend OTP for participant
      const requestData: any = { email: email.trim().toLowerCase() };
      if (isNewUser && name) {
        requestData.name = name.trim();
      }

      await participantAPI.requestOTP(requestData);
      setSuccess("OTP sent successfully!");
      setResendTimer(60);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Beginner&apos;s League</h1>
          <p className={styles.subtitle}>
            {step === "email"
              ? "Enter your email to login or create an account"
              : step === "details"
              ? "Welcome! Please enter your details to continue"
              : "Enter the 6-digit OTP sent to your email"}
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

        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="Enter your email"
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.button}
              disabled={isLoading}
            >
              {isLoading ? <div className={styles.spinner} /> : <FaEnvelope />}
              {isLoading ? "Verifying..." : "Continue"}
            </button>
          </form>
        ) : step === "details" ? (
          <>
            <button
              onClick={() => setStep("email")}
              className={styles.backButton}
            >
              <FaArrowLeft />
              Back to email
            </button>

            <form onSubmit={handleDetailsSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="name" className={styles.label}>
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="college" className={styles.label}>
                  Your College
                </label>
                <input
                  id="college"
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your college name"
                  disabled={isLoading}
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="gender" className={styles.label}>
                  Your Gender
                </label>
                <CustomDropdown
                  options={[
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                  ]}
                  value={gender}
                  onChange={(value) => setGender(value)}
                  placeholder="Select your gender"
                  disabled={isLoading}
                  className={styles.input}
                  style={{ padding: 0, outline: "none", border: "none" }}
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
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          </>
        ) : (
          <>
            <button
              onClick={() => setStep(isNewUser ? "details" : "email")}
              className={styles.backButton}
            >
              <FaArrowLeft />
              Back to {isNewUser ? "details" : "email"}
            </button>

            <form onSubmit={handleOtpSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Verification Code</label>
                <div className={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      type="text"
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
                {isLoading ? <div className={styles.spinner} /> : <FaLock />}
                {isLoading ? "Verifying..." : "Verify & Login"}
              </button>
            </form>

            <div className={styles.resendContainer}>
              Didn't receive the code?{" "}
              <button
                onClick={handleResendOtp}
                className={styles.resendButton}
                disabled={resendTimer > 0 || isLoading}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
