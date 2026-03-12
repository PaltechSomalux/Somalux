import React, { useState, useEffect } from 'react';

export const Submissions = ({ 
  submissions: initialSubmissions = [], 
  assignments = [], 
  students = [] 
}) => {
  const [submissions, setSubmissions] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);

  const handleGradeChange = (id, grade) => {
    setSubmissions(submissions.map(sub => 
      sub.id === id ? { ...sub, grade: parseInt(grade) || null, status: grade ? 'graded' : 'submitted' } : sub
    ));
  };

  const handleFeedbackChange = (id, feedback) => {
    setSubmissions(submissions.map(sub => 
      sub.id === id ? { ...sub, comments: feedback } : sub
    ));
  };

  const handleGradeSubmit = () => {
    if (currentSubmission) {
      handleGradeChange(currentSubmission.id, gradeInput);
      handleFeedbackChange(currentSubmission.id, feedbackInput);
      setIsModalVisible(false);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    
    const student = students.find(s => s.id === submission.studentId);
    const assignment = assignments.find(a => a.id === submission.assignmentId);
    
    return (
      (student?.name.toLowerCase().includes(searchLower)) ||
      (assignment?.title.toLowerCase().includes(searchLower)) ||
      submission.status.toLowerCase().includes(searchLower)
    );
  });

  const getStatusTag = (status) => {
    const statusMap = {
      submitted: { class: 'status-submitted', text: 'Submitted' },
      graded: { class: 'status-graded', text: 'Graded' },
      late: { class: 'status-late', text: 'Late' }
    };
    const statusInfo = statusMap[status] || { class: '', text: status };
    
    return <span className={`status-tag ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const getGradeBadge = (grade, maxGrade = 100) => {
    if (!grade) return '-';
    const percentage = (grade / maxGrade) * 100;
    const gradeClass = percentage > 90 ? 'grade-high' : 
                      percentage > 70 ? 'grade-medium' : 'grade-low';
    return (
      <span className={`grade-badge ${gradeClass}`}>
        {grade}/{maxGrade}
      </span>
    );
  };

  return (
    <div className="submissions-view">
      <div className="section-header">
        <h2>Assignment Submissions</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search submissions..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <div className="submissions-table">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Assignment</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Grade</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.length > 0 ? (
              filteredSubmissions.map(submission => {
                const student = students.find(s => s.id === submission.studentId);
                const assignment = assignments.find(a => a.id === submission.assignmentId);
                const maxGrade = assignment?.maxScore || 100;

                return (
                  <tr key={submission.id}>
                    <td>
                      {student ? (
                        <div className="student-cell">
                          {student.avatar || '👤'} {student.name}
                        </div>
                      ) : 'Unknown student'}
                    </td>
                    <td>{assignment?.title || 'Unknown assignment'}</td>
                    <td>{new Date(submission.submittedDate).toLocaleDateString()}</td>
                    <td>{getStatusTag(submission.status)}</td>
                    <td>{getGradeBadge(submission.grade, maxGrade)}</td>
                    <td>
                      <button 
                        className="action-btn"
                        onClick={() => {
                          setCurrentSubmission(submission);
                          setGradeInput(submission.grade?.toString() || '');
                          setFeedbackInput(submission.comments || '');
                          setIsModalVisible(true);
                        }}
                      >
                        Grade
                      </button>
                      <button className="action-btn">
                        Download
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="empty-state">
                  No submissions found {searchText && `matching "${searchText}"`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalVisible && currentSubmission && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Grade Submission</h3>
              <button 
                className="close-btn" 
                onClick={() => setIsModalVisible(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="submission-info">
                <p>
                  <strong>Student:</strong> {
                    students.find(s => s.id === currentSubmission.studentId)?.name || 'Unknown'
                  }
                </p>
                <p>
                  <strong>Assignment:</strong> {
                    assignments.find(a => a.id === currentSubmission.assignmentId)?.title || 'Unknown'
                  }
                </p>
                <p>
                  <strong>Submitted:</strong> {new Date(currentSubmission.submittedDate).toLocaleString()}
                </p>
                <p>
                  <strong>File:</strong> {currentSubmission.file}
                </p>
              </div>
              
              <div className="form-group">
                <label>Grade</label>
                <input
                  type="number"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  min="0"
                  max={assignments.find(a => a.id === currentSubmission.assignmentId)?.maxScore || 100}
                />
              </div>
              
              <div className="form-group">
                <label>Feedback</label>
                <textarea
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="secondary-btn"
                onClick={() => setIsModalVisible(false)}
              >
                Cancel
              </button>
              <button 
                className="primary-btn"
                onClick={handleGradeSubmit}
              >
                Save Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};