import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store";
import { participantAPI } from "../services/api";
import { CustomDropdown } from "../components";
import styles from "./Profile.module.css";
import {
  FaArrowLeft,
  FaSave,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";

const collegeOptions = [
  { value: "MEC", label: "Model Engineering College, Thrikkakkara" },
  { value: "LBSCEK", label: "LBS College of Engineering, Kasaragod" },
  {
    value: "LBSITW",
    label: "LBS Institute of Technology for Women, Poojappura",
  },
  { value: "SNGCE", label: "Sree Narayana Gurukulam College of Engineering" },
  { value: "CEC", label: "College of Engineering, Chengannur" },
  { value: "CEV", label: "College of Engineering, Vadakara" },
  { value: "GECBH", label: "Government Engineering College, Barton Hill" },
  { value: "GWTPC", label: "Government Women's Polytechnic College" },
  { value: "SCT", label: "Sree Chitra Thirunal College of Engineering" },
];

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    college: "",
    gender: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        college: user.college || "",
        gender: user.gender || "",
      });
    } else {
      // If no user, redirect to login
      navigate("/login");
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name: "college" | "gender", value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await participantAPI.updateProfile(formData);
      // Update user state in Zustand store
      setUser(response.data.participant);
      setSuccess("Profile updated successfully!");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button
          onClick={() => navigate("/dashboard")}
          className={styles.backButton}
        >
          <FaArrowLeft />
          Back to Dashboard
        </button>
        <h1 className={styles.headerTitle}>Edit Profile</h1>
      </header>
      <main className={styles.main}>
        <div className={styles.profileCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Your Information</h2>
            <p className={styles.formDescription}>
              Keep your profile details up to date.
            </p>
          </div>

          {error && (
            <div className={styles.error}>
              <FaExclamationTriangle /> {error}
            </div>
          )}
          {success && (
            <div className={styles.success}>
              <FaCheckCircle /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                className={styles.input}
                disabled
              />
              <p className={styles.helpText}>
                Email address cannot be changed.
              </p>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Enter your full name"
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>College</label>
              <CustomDropdown
                options={collegeOptions}
                value={formData.college}
                onChange={(value) => handleDropdownChange("college", value)}
                placeholder="Select your college"
                disabled={isLoading}
                className={styles.input}
                style={{ padding: 0, border: "none" }}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Gender</label>
              <CustomDropdown
                options={genderOptions}
                value={formData.gender}
                onChange={(value) => handleDropdownChange("gender", value)}
                placeholder="Select your gender"
                disabled={isLoading}
                className={styles.input}
                style={{ padding: 0, border: "none" }}
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? <div className={styles.spinner} /> : <FaSave />}
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
