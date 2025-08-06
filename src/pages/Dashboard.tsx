import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaSignOutAlt,
  FaSync,
  FaTasks,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaFileAlt,
  FaTrophy,
  FaSearch,
  FaUserEdit, // Import new icon
} from "react-icons/fa";
import socketService from "../services/socket";
import styles from "./Dashboard.module.css";
import { submissionAPI, tasksAPI } from "../services/api";
import { useAuthStore, useSubmissionStore, type Submission } from "../store";

interface Task {
  id: string;
  name: string;
  description: string;
  type: "CHALLENGE" | "MENTOR_SESSION" | "POWERUP_CHALLENGE" | "EASTER_EGG";
  points: number;
  isVariablePoints: boolean;
  createdAt: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { submissions, setSubmissions, setLoading, isLoading } = useSubmissionStore();
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [points, setPoints] = useState(user?.totalPoints || 0);
  const [taskCount, setTaskCount] = useState(user?.taskCount || 0);

  // State for Search and Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (user?.email) {
      loadSubmissions();
      loadTasks();
    }
  }, [user?.email]);

  useEffect(() => {
    socketService.connect();
    socketService.subscribeToUserStats((data) => {
      if (user && data.email === user.email) {
        setPoints(data.totalPoints);
        setTaskCount(data.taskCount);
      }
    });
    return () => {
      socketService.unsubscribeFromUserStats();
    };
  }, [user?.email]);

  // Effect to apply filters whenever tasks or filter criteria change
  useEffect(() => {
    let tempTasks = tasks;

    // 1. Apply search term filter
    if (searchTerm.trim() !== "") {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      tempTasks = tempTasks.filter(task =>
        task.name.toLowerCase().includes(lowercasedSearchTerm) ||
        task.description.toLowerCase().includes(lowercasedSearchTerm)
      );
    }

    // 2. Apply status filter
    if (statusFilter !== "all") {
      tempTasks = tempTasks.filter(task =>
        getTaskStatus(task.name).toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // 3. Apply type filter
    if (typeFilter !== "all") {
      tempTasks = tempTasks.filter(task => task.type === typeFilter);
    }

    setFilteredTasks(tempTasks);
  }, [searchTerm, statusFilter, typeFilter, tasks, submissions]);

  const getTaskStatus = (taskName: string) => {
    const submission = submissions.find((s) => s.taskName === taskName);
    return submission?.status || "NOT_SUBMITTED";
  };

  const loadTasks = async () => {
    setTasksLoading(true);
    try {
      const response = await tasksAPI.getAll();
      setTasks(response.data.tasks || []);
      setFilteredTasks(response.data.tasks || []); // Initialize filtered list
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setTasksLoading(false);
    }
  };

  const loadSubmissions = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const response = await submissionAPI.getMySubmissions();
      setSubmissions(response.data.submissions || []);
      setPoints(response.data.participant.totalPoints || 0);
      setTaskCount(response.data.participant.taskCount || 0);
    } catch (error) {
      console.error("Failed to load submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSubmissions(), loadTasks()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("participant-token");
    logout();
    navigate("/login");
  };

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const submission = submissions.find((s) => s.taskName === task?.name);
    navigate("/task", {
      state: {
        task,
        submission,
        isSubmitted: !!submission,
      },
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <FaCheckCircle />;
      case "REJECTED":
        return <FaTimesCircle />;
      case "PENDING":
        return <FaClock />;
      default:
        return <FaPlus />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      case "PENDING":
        return "Pending Review";
      default:
        return "Not Submitted";
    }
  };

  const getTaskTypeClass = (type: string) => {
    switch (type) {
      case "CHALLENGE":
        return styles.challenge;
      case "MENTOR_SESSION":
        return styles.mentorSession;
      case "POWERUP_CHALLENGE":
        return styles.subjectiveChallenge;
      case "EASTER_EGG":
        return styles.easterEgg;
      default:
        return "";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return styles.approved;
      case "REJECTED":
        return styles.rejected;
      case "PENDING":
        return styles.pending;
      default:
        return styles.notSubmitted;
    }
  };

  const getSubmissionForTask = (taskName: string): Submission | undefined => {
    return submissions.find((s) => s.taskName === taskName);
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>Beginner's League</div>
          <div className={styles.userInfo}>
            <div className={styles.userEmail}>{user.email}</div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{points}</div>
              <div className={styles.statLabel}>Points</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{taskCount}</div>
              <div className={styles.statLabel}>Completed</div>
            </div>
          </div>

          <Link to="/leaderboard" className={styles.leaderboardButton}>
            <FaTrophy />
            Leaderboard
          </Link>

          {/* Add Profile Button */}
          <Link to="/profile" className={styles.leaderboardButton}>
            <FaUserEdit />
            Profile
          </Link>

          <button onClick={handleLogout} className={styles.logoutButton}>
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>Hellow, {user.name}!</h1>
          <p className={styles.welcomeSubtitle}>
            Continue your journey and complete tasks to earn points.
          </p>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <FaTasks /> Available Tasks
            </h2>
            <button
              onClick={handleRefresh}
              className={styles.refreshButton}
              disabled={refreshing}
            >
              <FaSync className={refreshing ? styles.spinner : ""} />
              Refresh
            </button>
          </div>

          <div className={styles.filtersContainer}>
            <div className={styles.searchInputWrapper}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by name or description..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="not_submitted">Not Submitted</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select className={styles.filterSelect} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="CHALLENGE">Challenge</option>
                <option value="MENTOR_SESSION">Mentor Session</option>
                <option value="POWERUP_CHALLENGE">Power-Up Challenge</option>
                <option value="EASTER_EGG">Easter Egg</option>
              </select>
            </div>
          </div>

          {isLoading || tasksLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
            </div>
          ) : (
            <>
              <div className={styles.taskGrid}>
                {filteredTasks.map((task) => {
                  const status = getTaskStatus(task.name);
                  const submission = getSubmissionForTask(task.name);

                  return (
                    <div
                      key={task.id}
                      className={styles.taskCard}
                      onClick={() => handleTaskClick(task.id)}
                    >
                      <div className={styles.taskHeader}>
                        <div>
                          <h3 className={styles.taskTitle}>{task.name}</h3>
                          <p>{task.description}</p>
                          <div className={styles.taskPoints}>
                            {task.isVariablePoints
                              ? "Variable Points"
                              : `${task.points} points`}
                          </div>
                        </div>
                        <span
                          className={`${styles.taskType} ${getTaskTypeClass(
                            task.type
                          )}`}
                        >
                          {task.type.replace("_", " ")}
                        </span>
                      </div>

                      <div
                        className={`${styles.statusBadge} ${getStatusClass(
                          status
                        )}`}
                      >
                        {getStatusIcon(status)}
                        {getStatusText(status)}
                      </div>

                      {submission?.points && status === "APPROVED" && (
                        <div className={styles.earnedPoints}>
                          ✅ +{submission.points} points earned
                        </div>
                      )}

                      {submission?.note && (
                        <div className={styles.taskNote}>"{submission.note}"</div>
                      )}

                      {status === "NOT_SUBMITTED" && (
                        <button className={styles.submitButton}>
                          <FaFileAlt />
                          Start Task
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {filteredTasks.length === 0 && (
                 <div className={styles.emptyState}>
                   <div className={styles.emptyIcon}><FaSearch /></div>
                   <h3 className={styles.emptyTitle}>No Tasks Found</h3>
                   <p className={styles.emptyDescription}>
                     No tasks match your current search and filter criteria. Try adjusting them.
                   </p>
                 </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;