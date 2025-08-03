import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle,
  FaCheck,
  FaUpload,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { submissionAPI, type SubmissionCreateData } from '../services/api';
import { useAuthStore, useSubmissionStore } from '../store';
import styles from './Task.module.css';

interface TaskData {
  id: string;
  name: string;
  type: 'CHALLENGE' | 'MENTOR_SESSION' | 'POWERUP_CHALLENGE' | 'EASTER_EGG';
  description: string;
}

const Task = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { addSubmission } = useSubmissionStore();

  const { task, submission, isSubmitted } = location.state as {
    task: TaskData;
    submission?: any;
    isSubmitted: boolean;
  };

  const [formData, setFormData] = useState({
    taskName: task?.name || '',
    fileUrl: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!task) {
      navigate('/dashboard');
    }
  }, [task, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit a task');
      return;
    }

    if (!formData.fileUrl.trim()) {
      setError('Please provide a file URL');
      return;
    }

    if (!validateUrl(formData.fileUrl)) {
      setError('Please provide a valid URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const submissionData: SubmissionCreateData = {
        taskType: task.type,
        taskName: formData.taskName,
        fileUrl: formData.fileUrl,
      };

      const response = await submissionAPI.create(submissionData);
      
      if (response.data.submission) {
        addSubmission(response.data.submission);
        setSuccess('Task submitted successfully! You will be notified once it is reviewed.');
        
        // Navigate back to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      
      if (error.response?.status === 429) {
        setError('Too many submissions. Please wait before submitting again.');
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to submit task. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTaskTypeClass = (type: string) => {
    switch (type) {
      case 'CHALLENGE':
        return styles.challenge;
      case 'MENTOR_SESSION':
        return styles.mentorSession;
      case 'POWERUP_CHALLENGE':
        return styles.subjectiveChallenge;
      case 'EASTER_EGG':
        return styles.easterEgg;
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <FaCheckCircle className={`${styles.statusIcon} ${styles.approved}`} />;
      case 'REJECTED':
        return <FaTimesCircle className={`${styles.statusIcon} ${styles.rejected}`} />;
      case 'PENDING':
        return <FaClock className={`${styles.statusIcon} ${styles.pending}`} />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { title: 'Task Approved!', subtitle: 'Great work! Your submission has been approved.' };
      case 'REJECTED':
        return { title: 'Task Rejected', subtitle: 'Your submission needs improvement. Check the feedback below.' };
      case 'PENDING':
        return { title: 'Under Review', subtitle: 'Your submission is being reviewed. You\'ll be notified once it\'s complete.' };
      default:
        return { title: '', subtitle: '' };
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return styles.approved;
      case 'REJECTED':
        return styles.rejected;
      case 'PENDING':
        return styles.pending;
      default:
        return '';
    }
  };

  if (!task) {
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button
          onClick={() => navigate('/dashboard')}
          className={styles.backButton}
        >
          <FaArrowLeft />
          Back to Dashboard
        </button>
        <h1 className={styles.headerTitle}>{task.name}</h1>
      </header>

      <main className={styles.main}>
        {/* Task Information */}
        <div className={styles.taskCard}>
          <div className={styles.taskHeader}>
            <div className={styles.taskInfo}>
              <h1>{task.name}</h1>
              <p className={styles.taskDescription}>{task.description}</p>
            </div>
            <span className={`${styles.taskType} ${getTaskTypeClass(task.type)}`}>
              {task.type.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Submission Status (if already submitted) */}
        {isSubmitted && submission && (
          <div className={styles.statusCard}>
            <div className={styles.statusHeader}>
              {getStatusIcon(submission.status)}
              <div className={`${styles.statusText} ${getStatusClass(submission.status)}`}>
                <h2>{getStatusText(submission.status).title}</h2>
                <p className={styles.statusSubtext}>
                  {getStatusText(submission.status).subtitle}
                </p>
              </div>
            </div>

            <div className={styles.submissionDetails}>
              <div className={styles.submissionItem}>
                <span className={styles.submissionLabel}>Submitted:</span>
                <span className={styles.submissionValue}>
                  {new Date(submission.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className={styles.submissionItem}>
                <span className={styles.submissionLabel}>File URL:</span>
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.submissionValue} ${styles.link}`}
                >
                  {submission.fileUrl}
                  <FaExternalLinkAlt style={{ marginLeft: '0.25rem', fontSize: '0.75rem' }} />
                </a>
              </div>

              {submission.points && (
                <div className={styles.submissionItem}>
                  <span className={styles.submissionLabel}>Points Awarded:</span>
                  <span className={`${styles.submissionValue} ${styles.points}`}>
                    +{submission.points} points
                  </span>
                </div>
              )}

              {submission.note && (
                <div className={styles.note}>
                  <strong>Feedback:</strong> {submission.note}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submission Form (if not submitted or rejected) */}
        {(!isSubmitted || submission?.status === 'REJECTED') && (
          <div className={styles.submitForm}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>
                {submission?.status === 'REJECTED' ? 'Resubmit Task' : 'Submit Task'}
              </h2>
              <p className={styles.formDescription}>
                {submission?.status === 'REJECTED' 
                  ? 'Address the feedback and submit your improved work.'
                  : 'Provide the URL to your completed work. Make sure the link is accessible and contains your solution.'
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
                <FaCheck />
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="taskName" className={styles.label}>
                  Task Name
                </label>
                <input
                  id="taskName"
                  name="taskName"
                  type="text"
                  value={formData.taskName}
                  className={styles.input}
                  disabled
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="fileUrl" className={styles.label}>
                  File URL *
                </label>
                <input
                  id="fileUrl"
                  name="fileUrl"
                  type="url"
                  value={formData.fileUrl}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="https://github.com/username/repo or https://drive.google.com/..."
                  required
                  disabled={isLoading}
                />
                <p className={styles.helpText}>
                  Provide a direct link to your work (GitHub repository, Google Drive, etc.). 
                  Make sure the link is publicly accessible.
                </p>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading || !formData.fileUrl.trim()}
              >
                {isLoading ? (
                  <div className={styles.spinner} />
                ) : (
                  <FaUpload />
                )}
                {isLoading ? 'Submitting...' : 'Submit Task'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default Task;
