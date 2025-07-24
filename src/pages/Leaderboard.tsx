import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrophy, FaSync } from "react-icons/fa";
import { leaderboardAPI } from "../services/api";
import socketService from "../services/socket";
import styles from "./Leaderboard.module.css";
import { IoIosArrowBack } from "react-icons/io";

interface LeaderboardEntry {
  id: string;
  name: string;
  totalPoints: number;
  taskCount: number;
  rank?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    loadLeaderboard();

    // Connect to socket for real-time updates
    socketService.connect();

    // Subscribe to leaderboard updates
    socketService.subscribeToLeaderboard((data) => {
      if (data.leaderboard && data.pagination) {
        setLeaderboard(data.leaderboard);
        setPagination(data.pagination);
      }
    });

    // Cleanup on unmount
    return () => {
      socketService.unsubscribeFromLeaderboard();
      socketService.disconnect();
    };
  }, [pagination.page]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await leaderboardAPI.get(
        pagination.page,
        pagination.limit
      );
      const participants = response.data.leaderboard || [];

      // The backend now handles ranking with tie logic, so we use the ranks as provided
      setLeaderboard(participants);
      setPagination(response.data.pagination || pagination);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <FaTrophy className={styles.trophy} />;
    }
    return <span className={styles.rankNumber}>{rank}</span>;
  };

  const getRankClass = (rank: number) => {
    if (rank === 1) return styles.firstPlace;
    if (rank === 2) return styles.secondPlace;
    if (rank === 3) return styles.thirdPlace;
    return "";
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          <div className={styles.backIcon}>
            <IoIosArrowBack />
          </div>
          Back
        </button>
        <h1 className={styles.title}>
          <FaTrophy className={styles.titleIcon} />
          Leaderboard
        </h1>
        <button
          onClick={loadLeaderboard}
          className={styles.refreshButton}
          disabled={isLoading}
        >
          <FaSync className={isLoading ? styles.spinning : ""} />
        </button>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className={styles.emptyState}>
            <FaTrophy className={styles.emptyIcon} />
            <h2>No participants yet</h2>
            <p>Be the first to complete a task!</p>
          </div>
        ) : (
          <>
            <div className={styles.leaderboard}>
              {leaderboard.map((participant) => {
                const isTied = leaderboard.some(
                  (other) =>
                    other.id !== participant.id &&
                    other.rank === participant.rank
                );

                return (
                  <div
                    key={participant.id}
                    className={`${styles.card} ${getRankClass(
                      participant.rank!
                    )}`}
                  >
                    <div className={styles.rank}>
                      {getRankIcon(participant.rank!)}
                    </div>

                    <div className={styles.info}>
                      <h3 className={styles.name}>{participant.name}</h3>
                      <div className={styles.meta}>
                        <span className={styles.tasks}>
                          {participant.taskCount} task
                          {participant.taskCount !== 1 ? "s" : ""}
                        </span>
                        {isTied && <span className={styles.tied}>Tied</span>}
                      </div>
                    </div>

                    <div className={styles.points}>
                      {participant.totalPoints}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  disabled={pagination.page === 1}
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  className={styles.pageButton}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  className={styles.pageButton}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Rankings update in real-time</p>
      </footer>
    </div>
  );
};

export default Leaderboard;
