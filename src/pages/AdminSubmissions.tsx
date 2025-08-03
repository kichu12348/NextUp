import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEye, FaFilter, FaSync } from 'react-icons/fa';
import { adminAPI } from '../services/api';
import styles from './AdminSubmissions.module.css';

interface Submission {
  id: string;
  taskName: string;
  taskType: 'CHALLENGE' | 'MENTOR_SESSION' | 'POWERUP_CHALLENGE' | 'EASTER_EGG';
  fileUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  points: number | null;
  note: string | null;
  createdAt: string;
  participant: {
    name: string;
    email: string;
  };
  task?: {
    id: string;
    name: string;
    type: string;
    points: number;
    isVariablePoints: boolean;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    taskType: '',
    email: ''
  });
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewData, setReviewData] = useState({
    status: 'PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED',
    points: '',
    note: ''
  });
  const [isReviewing, setIsReviewing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is authenticated
    const adminToken = localStorage.getItem('admin-token');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    loadSubmissions();
  }, [navigate, pagination.page, filters]);

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.taskType && { taskType: filters.taskType }),
        ...(filters.email && { email: filters.email })
      };

      const response = await adminAPI.getSubmissions(params);
      setSubmissions(response.data.submissions || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmission = async () => {
    if (!selectedSubmission || !reviewData.status) return;

    setIsReviewing(true);
    try {
      const updateData: any = {
        status: reviewData.status,
        ...(reviewData.note && { note: reviewData.note })
      };

      if (reviewData.status === 'APPROVED' && reviewData.points) {
        updateData.points = parseInt(reviewData.points);
      }

      await adminAPI.updateSubmission(selectedSubmission.id, updateData);
      
      // Update the submission in the list
      setSubmissions(prevSubmissions =>
        prevSubmissions.map(sub =>
          sub.id === selectedSubmission.id
            ? { ...sub, ...updateData }
            : sub
        )
      );

      setSelectedSubmission(null);
      setReviewData({ status: 'PENDING', points: '', note: '' });
    } catch (error) {
      console.error('Failed to review submission:', error);
    } finally {
      setIsReviewing(false);
    }
  };

  const openReviewModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    
    // For fixed-point tasks, use the task's points value as default
    const defaultPoints = submission.task && !submission.task.isVariablePoints 
      ? submission.task.points.toString()
      : submission.points?.toString() || '';
    
    setReviewData({
      status: submission.status,
      points: defaultPoints,
      note: submission.note || ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'PENDING': return 'orange';
      default: return 'gray';
    }
  };

  const getTaskTypeDisplay = (type: string) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button onClick={() => navigate('/admin')} className={styles.backButton}>
            <FaArrowLeft />
            Back to Dashboard
          </button>
          <h1 className={styles.title}>Review Submissions</h1>
          <button onClick={loadSubmissions} className={styles.refreshButton}>
            <FaSync />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filterIcon}>
          <FaFilter />
        </div>
        <div className={styles.filters}>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={filters.taskType}
            onChange={(e) => setFilters({ ...filters, taskType: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="">All Task Types</option>
            <option value="CHALLENGE">Challenge</option>
            <option value="MENTOR_SESSION">Mentor Session</option>
            <option value="POWERUP_CHALLENGE">Power-Up Challenge</option>
            <option value="EASTER_EGG">Easter Egg</option>
          </select>

          <input
            type="email"
            placeholder="Filter by email..."
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            className={styles.filterInput}
          />
        </div>
      </div>

      {/* Submissions List */}
      <div className={styles.main}>
        {isLoading ? (
          <div className={styles.loading}>Loading submissions...</div>
        ) : (
          <>
            <div className={styles.submissionsList}>
              {submissions.length === 0 ? (
                <div className={styles.emptyState}>
                  <h3>No submissions found</h3>
                  <p>No submissions match your current filters</p>
                </div>
              ) : (
                submissions.map(submission => (
                  <div key={submission.id} className={styles.submissionCard}>
                    <div className={styles.submissionHeader}>
                      <div className={styles.submissionInfo}>
                        <h3 className={styles.taskName}>{submission.taskName}</h3>
                        <span className={styles.taskType}>
                          {getTaskTypeDisplay(submission.taskType)}
                        </span>
                      </div>
                      <div className={styles.submissionActions}>
                        <span className={`${styles.status} ${styles[getStatusColor(submission.status)]}`}>
                          {submission.status}
                        </span>
                        <button
                          onClick={() => openReviewModal(submission)}
                          className={styles.reviewButton}
                        >
                          <FaEye />
                          Review
                        </button>
                      </div>
                    </div>

                    <div className={styles.submissionDetails}>
                      <div className={styles.participantInfo}>
                        <strong>{submission.participant.name}</strong>
                        <span className={styles.email}>{submission.participant.email}</span>
                      </div>
                      <div className={styles.submissionMeta}>
                        <span className={styles.date}>
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </span>
                        {submission.points && (
                          <span className={styles.points}>{submission.points} points</span>
                        )}
                      </div>
                    </div>

                    {submission.note && (
                      <div className={styles.submissionNote}>
                        <strong>Admin Note:</strong> {submission.note}
                      </div>
                    )}

                    <div className={styles.submissionFile}>
                      <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.fileLink}
                      >
                        View Submission File
                      </a>
                    </div>
                  </div>
                ))
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

      {/* Review Modal */}
      {selectedSubmission && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Review Submission</h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.submissionPreview}>
                <h3>{selectedSubmission.taskName}</h3>
                <p><strong>Type:</strong> {getTaskTypeDisplay(selectedSubmission.taskType)}</p>
                <p><strong>Participant:</strong> {selectedSubmission.participant.name} ({selectedSubmission.participant.email})</p>
                <p><strong>Submitted:</strong> {new Date(selectedSubmission.createdAt).toLocaleString()}</p>
                <p><strong>Current Status:</strong> 
                  <span className={`${styles.status} ${styles[getStatusColor(selectedSubmission.status)]}`}>
                    {selectedSubmission.status}
                  </span>
                </p>
                
                <div className={styles.filePreview}>
                  <a
                    href={selectedSubmission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.previewLink}
                  >
                    Open Submission File
                  </a>
                </div>
              </div>

              <div className={styles.reviewForm}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Review Decision</label>
                  <select
                    value={reviewData.status}
                    onChange={(e) => setReviewData({ ...reviewData, status: e.target.value as any })}
                    className={styles.select}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                {reviewData.status === 'APPROVED' && (
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>
                      Points to Award
                      {selectedSubmission?.task && !selectedSubmission.task.isVariablePoints && (
                        <span className={styles.fixedPointsIndicator}> (Fixed Points Task)</span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={reviewData.points}
                      onChange={(e) => setReviewData({ ...reviewData, points: e.target.value })}
                      className={styles.input}
                      placeholder="Enter points..."
                      min="0"
                      disabled={!!(selectedSubmission?.task && !selectedSubmission.task.isVariablePoints)}
                      readOnly={!!(selectedSubmission?.task && !selectedSubmission.task.isVariablePoints)}
                    />
                    {selectedSubmission?.task && !selectedSubmission.task.isVariablePoints && (
                      <div className={styles.fixedPointsNote}>
                        This task has fixed points ({selectedSubmission.task.points} points)
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Admin Note (Optional)</label>
                  <textarea
                    value={reviewData.note}
                    onChange={(e) => setReviewData({ ...reviewData, note: e.target.value })}
                    className={styles.textarea}
                    placeholder="Add a note for the participant..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmission}
                className={styles.submitButton}
                disabled={isReviewing || !reviewData.status}
              >
                {isReviewing ? 'Saving...' : 'Save Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubmissions;
