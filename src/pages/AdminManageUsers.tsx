import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import styles from './AdminManageUsers.module.css';
import { 
  FaUsers, 
  FaArrowLeft, 
  FaSearch, 
  FaEnvelope, 
  FaUniversity,
  FaSpinner
} from 'react-icons/fa';

interface Participant {
  id: string;
  name: string;
  email: string;
  college: string;
}

const AdminManageUsers = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadParticipants();
  }, []);

  useEffect(() => {
    // Filter participants based on search term
    if (searchTerm.trim() === '') {
      setFilteredParticipants(participants);
    } else {
      const filtered = participants.filter(participant =>
        participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.college.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredParticipants(filtered);
    }
  }, [searchTerm, participants]);

  const loadParticipants = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await adminAPI.getParticipants();
      const participantsData = response.data.participants || response.data || [];
      setParticipants(participantsData);
      setFilteredParticipants(participantsData);
    } catch (error) {
      console.error('Failed to load participants:', error);
      setError('Failed to load participants. Please try again.');
      setParticipants([]);
      setFilteredParticipants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button onClick={handleBack} className={styles.backButton}>
              <FaArrowLeft />
            </button>
            <h1 className={styles.title}>Manage Participants</h1>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search participants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.main}>
        {error && (
          <div className={styles.error}>
            {error}
            <button onClick={loadParticipants} className={styles.retryButton}>
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className={styles.loading}>
            <FaSpinner className={styles.spinner} />
            <p>Loading participants...</p>
          </div>
        ) : (
          <>
            <div className={styles.statsBar}>
              <div className={styles.stat}>
                <FaUsers className={styles.statIcon} />
                <span className={styles.statValue}>{filteredParticipants.length}</span>
                <span className={styles.statLabel}>
                  {searchTerm ? 'Found' : 'Total'} Participants
                </span>
              </div>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className={styles.clearSearch}
                >
                  Clear Search
                </button>
              )}
            </div>

            {filteredParticipants.length === 0 ? (
              <div className={styles.emptyState}>
                <FaUsers className={styles.emptyIcon} />
                <h3>
                  {searchTerm 
                    ? 'No participants found' 
                    : 'No participants registered yet'
                  }
                </h3>
                <p>
                  {searchTerm 
                    ? 'Try adjusting your search criteria' 
                    : 'Participants will appear here once they register for the event'
                  }
                </p>
              </div>
            ) : (
              <div className={styles.participantsList}>
                {filteredParticipants.map((participant) => (
                  <div key={participant.id} className={styles.participantCard}>
                    <div className={styles.participantHeader}>
                      <div className={styles.participantAvatar}>
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.participantInfo}>
                        <h3 className={styles.participantName}>
                          {participant.name}
                        </h3>
                        <div className={styles.participantDetails}>
                          <div className={styles.detail}>
                            <FaEnvelope className={styles.detailIcon} />
                            <span>{participant.email}</span>
                          </div>
                          <div className={styles.detail}>
                            <FaUniversity className={styles.detailIcon} />
                            <span>{participant.college}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminManageUsers;