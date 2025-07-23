import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaMedal, FaSync } from 'react-icons/fa';
import { leaderboardAPI } from '../services/api';
import socketService from '../services/socket';
import styles from './Leaderboard.module.css';

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
    totalPages: 0
  });

  const navigate = useNavigate();

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
      const response = await leaderboardAPI.get(pagination.page, pagination.limit);
      const participants = response.data.leaderboard || [];

      // The backend now handles ranking with tie logic, so we use the ranks as provided
      setLeaderboard(participants);
      setPagination(response.data.pagination || pagination);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaTrophy className={styles.goldTrophy} />;
      case 2:
        return <FaMedal className={styles.silverMedal} />;
      case 3:
        return <FaMedal className={styles.bronzeMedal} />;
      default:
        return <span className={styles.rankNumber}>#{rank}</span>;
    }
  };

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1:
        return styles.firstPlace;
      case 2:
        return styles.secondPlace;
      case 3:
        return styles.thirdPlace;
      default:
        return '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            Dashboard
          </button>
          <div className={styles.titleSection}>
            <FaTrophy className={styles.headerIcon} />
            <h1 className={styles.title}>Leaderboard</h1>
          </div>
          <button onClick={loadLeaderboard} className={styles.refreshButton}>
            <FaSync />
            Refresh
          </button>
        </div>
      </div>

      <div className={styles.main}>
        {/* Stats Section */}
        {/* <div className={styles.statsSection}>
          <div className={styles.statCard}>
            <FaUsers className={styles.statIcon} />
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{pagination.total}</h3>
              <p className={styles.statLabel}>Total Participants</p>
            </div>
          </div>
        </div> */}

        {/* Leaderboard */}
        {isLoading ? (
          <div className={styles.loading}>Loading leaderboard...</div>
        ) : (
          <>
            <div className={styles.leaderboardContainer}>
              {leaderboard.length === 0 ? (
                <div className={styles.emptyState}>
                  <FaTrophy className={styles.emptyIcon} />
                  <h3>No participants yet</h3>
                  <p>Be the first to complete a task and claim the top spot!</p>
                </div>
              ) : (
                <div className={styles.leaderboardList}>
                  {leaderboard.map((participant, index) => {
                    // Check if this participant is tied with others
                    const isTied = leaderboard.some((other, otherIndex) => 
                      otherIndex !== index && 
                      other.rank === participant.rank
                    );
                    
                    return (
                      <div 
                        key={participant.id} 
                        className={`${styles.participantCard} ${getRankClass(participant.rank!)}`}
                      >
                        <div className={styles.rankSection}>
                          {getRankIcon(participant.rank!)}
                          {isTied && <span className={styles.tieIndicator}>TIED</span>}
                        </div>
                        
                        <div className={styles.participantInfo}>
                          <h3 className={styles.participantName}>{participant.name}</h3>
                          <div className={styles.participantStats}>
                            <span className={styles.tasks}>
                              {participant.taskCount} task{participant.taskCount !== 1 ? 's' : ''} completed
                            </span>
                            {isTied && (
                              <span className={styles.tieBreaker}>
                                • Ranked by tasks, then name
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className={styles.pointsSection}>
                          <span className={styles.points}>{participant.totalPoints}</span>
                          <span className={styles.pointsLabel}>points</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  disabled={pagination.page === 1}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  className={styles.pageButton}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  className={styles.pageButton}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p>Rankings update in real-time as tasks are completed and approved.</p>
        <p className={styles.tieBreakingRules}>
          <strong>Tie-breaking:</strong> Participants with equal points are ranked by tasks completed, then alphabetically by name.
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
