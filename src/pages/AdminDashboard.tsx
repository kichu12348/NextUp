import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaTasks,
  FaUsers,
  FaChartBar,
  FaSignOutAlt,
} from "react-icons/fa";
import { adminAPI } from "../services/api";
import styles from "./AdminDashboard.module.css";
import { IoClose } from "react-icons/io5";
import { BsFileEarmarkSpreadsheetFill } from "react-icons/bs";

interface Task {
  id: string;
  name: string;
  description: string;
  type: "CHALLENGE" | "MENTOR_SESSION" | "SUBJECTIVE_CHALLENGE" | "EASTER_EGG";
  points: number;
  isVariablePoints: boolean;
  createdAt: string;
}

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalParticipants: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load tasks and stats
      const [tasksResponse, statsResponse] = await Promise.all([
        adminAPI.getTasks(),
        adminAPI.getStats(),
      ]);

      setTasks(tasksResponse.data.tasks || []);
      setStats(statsResponse.data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      // Fallback to mock data
      setStats({
        totalTasks: 0,
        totalParticipants: 0,
        totalSubmissions: 0,
        pendingSubmissions: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin-token");
    onLogout();
    navigate("/admin/login");
  };

  const handleExcelExport = async () => {
    try {
      const response = await adminAPI.getExcelSheet();
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "participants.xlsx");
      document.body.appendChild(link);
      link.click();
      //clean up
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data:", error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <div className={styles.headerActions}>
            <button onClick={handleLogout} className={styles.logoutButton}>
              <FaSignOutAlt />
              Logout
            </button>
            <button onClick={handleExcelExport} className={styles.logoutButton}>
              Export Data
              <BsFileEarmarkSpreadsheetFill />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.main}>
        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaTasks />
            </div>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.totalTasks}</h3>
              <p className={styles.statLabel}>Total Tasks</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaUsers />
            </div>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.totalParticipants}</h3>
              <p className={styles.statLabel}>Participants</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaChartBar />
            </div>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.totalSubmissions}</h3>
              <p className={styles.statLabel}>Total Submissions</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaChartBar />
            </div>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.pendingSubmissions}</h3>
              <p className={styles.statLabel}>Pending Review</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actionsSection}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionGrid}>
            <button
              onClick={() => navigate("/admin/submissions")}
              className={styles.actionButton}
            >
              <FaTasks />
              Review Submissions
            </button>
            <button
              onClick={() => navigate("/admin/participants")}
              className={styles.actionButton}
            >
              <FaUsers />
              Manage Participants
            </button>
            <button
              onClick={() => navigate("/leaderboard")}
              className={styles.actionButton}
            >
              <FaChartBar />
              View Leaderboard
            </button>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className={styles.tasksSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Tasks</h2>
            <button
              onClick={() => setShowCreateTask(true)}
              className={styles.createButton}
            >
              <FaPlus />
              Create Task
            </button>
          </div>

          {isLoading ? (
            <div className={styles.loading}>Loading...</div>
          ) : (
            <div className={styles.tasksList}>
              {tasks.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaTasks />
                  <h3>No tasks created yet</h3>
                  <p>Create your first task to get started</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className={styles.taskCard}>
                    <div className={styles.taskHeader}>
                      <h3 className={styles.taskName}>{task.name}</h3>
                      <span
                        className={`${styles.taskType} ${
                          styles[task.type.toLowerCase()]
                        }`}
                      >
                        {task.type.replace("_", " ")}
                      </span>
                    </div>
                    <p className={styles.taskDescription}>{task.description}</p>
                    <div className={styles.taskFooter}>
                      <span className={styles.taskPoints}>
                        {task.isVariablePoints
                          ? "Variable Points"
                          : `${task.points} points`}
                      </span>
                      <span className={styles.taskDate}>
                        {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          onTaskCreated={loadDashboardData}
        />
      )}
    </div>
  );
};

// Create Task Modal Component
interface CreateTaskModalProps {
  onClose: () => void;
  onTaskCreated: () => void;
}

const CreateTaskModal = ({ onClose, onTaskCreated }: CreateTaskModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "CHALLENGE" as const,
    points: 0,
    isVariablePoints: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    if (!formData.isVariablePoints && formData.points <= 0) {
      setError("Please enter a valid point value");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Create task via API
      await adminAPI.createTask(formData);
      onTaskCreated();
      onClose();
    } catch (error) {
      setError("Failed to create task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Create New Task</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <IoClose />
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Task Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={styles.input}
              placeholder="Enter task name"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={styles.textarea}
              placeholder="Describe the task requirements"
              rows={4}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Task Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as any })
              }
              className={styles.select}
            >
              <option value="CHALLENGE">Challenge</option>
              <option value="MENTOR_SESSION">Mentor Session</option>
              <option value="SUBJECTIVE_CHALLENGE">Subjective Challenge</option>
              <option value="EASTER_EGG">Easter Egg</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isVariablePoints}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isVariablePoints: e.target.checked,
                  })
                }
                className={styles.checkbox}
              />
              Variable Points (assign points manually per submission)
            </label>
          </div>

          {!formData.isVariablePoints && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>Fixed Points</label>
              <input
                type="number"
                value={formData.points || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    points: parseInt(e.target.value) || 0,
                  })
                }
                className={styles.input}
                placeholder="Enter point value"
                min="1"
                required
              />
            </div>
          )}

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
