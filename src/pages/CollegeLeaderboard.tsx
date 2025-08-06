import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrophy, FaSync, FaUsers, FaTasks } from "react-icons/fa";
import { leaderboardAPI } from "../services/api";
import socketService from "../services/socket";
import styles from "./CollegeLeaderboard.module.css";
import { IoIosArrowBack } from "react-icons/io";

interface CollegeLeaderboardEntry {
  college: string | null;
  totalPoints: number;
  totalTasks: number;
  participantCount: number;
  rank: number;
}

const collegeNameMap: { [key: string]: string } = {
  "MEC": "Model Engineering College, Thrikkakkara",
  "LBSCEK": "LBS College of Engineering, Kasaragod",
  "LBSITW": "LBS Institute of Technology for Women, Poojappura",
  "SNGCE": "Sree Narayana Gurukulam College of Engineering",
  "CEC": "College of Engineering, Chengannur",
  "CEV": "College of Engineering, Vadakara",
  "GECBH": "Government Engineering College, Barton Hill",
  "GWTPC": "Government Women's Polytechnic College",
  "SCT": "Sree Chitra Thirunal College of Engineering"
};

const CollegeLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<CollegeLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadLeaderboard();
    socketService.connect();
    socketService.subscribeToCollegeLeaderboard((data) => {
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    });

    return () => {
      socketService.unsubscribeFromCollegeLeaderboard();
      socketService.disconnect();
    };
  }, []);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await leaderboardAPI.getColleges();
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error("Failed to load college leaderboard:", error);
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
      <header className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <IoIosArrowBack /> Back
        </button>
        <h1 className={styles.title}>
          <FaTrophy className={styles.titleIcon} />
          College Leaderboard
        </h1>
        <button
          onClick={loadLeaderboard}
          className={styles.refreshButton}
          disabled={isLoading}
        >
          <FaSync className={isLoading ? styles.spinning : ""} />
        </button>
      </header>

      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className={styles.emptyState}>
            <FaTrophy className={styles.emptyIcon} />
            <h2>No colleges on the board yet</h2>
            <p>Complete tasks to put your college on the map!</p>
          </div>
        ) : (
          <div className={styles.leaderboard}>
            {leaderboard.map((item) => (
              <div
                key={item.college}
                className={`${styles.card} ${getRankClass(item.rank)}`}
              >
                <div className={styles.rank}>{getRankIcon(item.rank)}</div>
                <div className={styles.info}>
                  <h3 className={styles.name}>{collegeNameMap[item.college!] || item.college}</h3>
                  <div className={styles.meta}>
                    <span className={styles.stat}><FaUsers /> {item.participantCount} Participants</span>
                    <span className={styles.stat}><FaTasks /> {item.totalTasks} Tasks</span>
                  </div>
                </div>
                <div className={styles.points}>{item.totalPoints}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CollegeLeaderboard;