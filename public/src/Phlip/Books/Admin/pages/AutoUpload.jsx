import React, { useState, useEffect } from 'react';
import { FiUpload, FiFolderPlus, FiPlay, FiRefreshCw, FiCheck, FiX, FiClock, FiAlertCircle } from 'react-icons/fi';

const API_BASE = 'http://localhost:5000';

const AutoUpload = ({ userProfile }) => {
  const [booksDirectory, setBooksDirectory] = useState('D:\\new\\newTProj\\Campuslife-com\\src\\Phlip\\Books');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [currentProcess, setCurrentProcess] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showResumeConfirm, setShowResumeConfirm] = useState(false);
  const [incompleteProcess, setIncompleteProcess] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Surface any error set into a toast automatically
  useEffect(() => {
    if (error) showToast(error, 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // Poll for process status
  useEffect(() => {
    if (!currentProcess) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/api/elib/bulk-upload/status/${currentProcess.id}`);
        const data = await response.json();

        if (response.ok && data.ok && data.process) {
          // Ensure stats object exists
          const safeProcess = {
            ...data.process,
            stats: {
              total: data.process?.stats?.total ?? 0,
              processed: data.process?.stats?.processed ?? 0,
              successful: data.process?.stats?.successful ?? 0,
              failed: data.process?.stats?.failed ?? 0,
              skipped: data.process?.stats?.skipped ?? 0,
            }
          };
          setCurrentProcess(safeProcess);

          // Stop polling if completed or failed
          if (safeProcess.status === 'completed' || safeProcess.status === 'failed') {
            clearInterval(interval);
            fetchProcesses();  // Refresh process list
          }
        } else if (!response.ok) {
          clearInterval(interval);
          showToast(data?.error || 'Failed to get upload status', 'error');
          // Do not crash UI; keep the last known process state
        }
      } catch (err) {
        console.error('Failed to poll status:', err);
      }
    }, 2000);  // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [currentProcess?.id]);

  // Fetch all processes on mount and check for incomplete uploads
  useEffect(() => {
    fetchProcesses();
    checkIncompleteUploads();
  }, []);

  const checkIncompleteUploads = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/elib/bulk-upload/processes`);
      const data = await response.json();

      if (response.ok && data.ok) {
        // Find any process that was running but not completed
        const processes = (data.processes || []).map(p => ({
          ...p,
          stats: {
            total: p?.stats?.total ?? 0,
            processed: p?.stats?.processed ?? 0,
            successful: p?.stats?.successful ?? 0,
            failed: p?.stats?.failed ?? 0,
            skipped: p?.stats?.skipped ?? 0,
          }
        }));
        const incomplete = processes.find(p =>
          p.status === 'running' &&
          p.stats.processed < p.stats.total
        );

        if (incomplete) {
          setIncompleteProcess(incomplete);
        }
      } else if (!response.ok) {
        showToast(data?.error || 'Failed to list processes', 'error');
      }
    } catch (err) {
      console.error('Failed to check incomplete uploads:', err);
    }
  };

  const fetchProcesses = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/elib/bulk-upload/processes`);
      const data = await response.json();

      if (response.ok && data.ok) {
        const safe = (data.processes || []).map(p => ({
          ...p,
          stats: {
            total: p?.stats?.total ?? 0,
            processed: p?.stats?.processed ?? 0,
            successful: p?.stats?.successful ?? 0,
            failed: p?.stats?.failed ?? 0,
            skipped: p?.stats?.skipped ?? 0,
          }
        }));
        setProcesses(safe);
      } else if (!response.ok) {
        showToast(data?.error || 'Failed to fetch processes', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch processes:', err);
    }
  };

  const startUpload = async () => {
    if (!booksDirectory.trim()) {
      setError('Please enter a valid books directory path');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/elib/bulk-upload/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-email': userProfile?.email || 'admin'
        },
        body: JSON.stringify({
          booksDirectory,
          skipDuplicates,
          uploadedBy: userProfile?.id || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Friendly message for missing directory
        const msg = data?.error || 'Failed to start upload';
        showToast(msg.includes('Directory') ? msg : `Failed to start upload: ${msg}`, 'error');
        throw new Error(msg);
      }

      if (data.ok) {
        // Start tracking this process
        setCurrentProcess({
          id: data.processId,
          status: 'running',
          startedAt: new Date().toISOString(),
          booksDirectory,
          stats: { total: 0, processed: 0, successful: 0, failed: 0, skipped: 0 }
        });
        setIncompleteProcess(null); // Clear incomplete flag
        showToast('Bulk upload started', 'success');
      }
    } catch (err) {
      setError(err.message || 'Failed to start bulk upload');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <FiRefreshCw className="animate-spin" style={{ color: '#00a884' }} />;
      case 'completed':
        return <FiCheck style={{ color: '#00a884' }} />;
      case 'failed':
        return <FiX style={{ color: '#ea4335' }} />;
      default:
        return <FiClock style={{ color: '#8696a0' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return '#00a884';
      case 'completed': return '#00a884';
      case 'failed': return '#ea4335';
      default: return '#8696a0';
    }
  };

  const stopUpload = async () => {
    if (!currentProcess || currentProcess.status !== 'running') return;

    try {
      const response = await fetch(`${API_BASE}/api/elib/bulk-upload/stop/${currentProcess.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.ok) {
        setCurrentProcess({ ...currentProcess, status: 'stopped' });
        setShowStopConfirm(false);
        fetchProcesses();
      }
    } catch (err) {
      setError('Failed to stop upload: ' + err.message);
    }
  };

  const resumeUpload = () => {
    if (incompleteProcess) {
      setBooksDirectory(incompleteProcess.booksDirectory);
      setShowResumeConfirm(false);
      startUpload();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="panel">
      <div className="panel-title">Automatic Bulk Upload</div>
      <div style={{ color: '#8696a0', fontSize: '14px', marginBottom: '20px' }}>
        Automatically scan folders for PDFs, extract metadata using Google Books API, and upload to Supabase
      </div>

      {/* Resume Banner */}
      {incompleteProcess && !currentProcess && (
        <div style={{
          background: 'rgba(0, 168, 132, 0.1)',
          border: '1px solid #00a884',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ color: '#00a884', fontWeight: '600', marginBottom: '5px' }}>
              📂 Incomplete Upload Detected
            </div>
            <div style={{ color: '#8696a0', fontSize: '13px' }}>
              {incompleteProcess.stats.processed} of {incompleteProcess.stats.total} files uploaded from {incompleteProcess.booksDirectory}
            </div>
          </div>
          <button
            className="btn primary"
            onClick={() => setShowResumeConfirm(true)}
            style={{ marginLeft: '15px' }}
          >
            Resume Upload
          </button>
        </div>
      )}

      {/* Configuration Section */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <label className="label">Books Directory Path</label>
        <input
          className="input"
          type="text"
          placeholder="D:\\path\\to\\your\\books\\folder"
          value={booksDirectory}
          onChange={(e) => setBooksDirectory(e.target.value)}
          disabled={loading || (currentProcess && currentProcess.status === 'running')}
          style={{
            backgroundColor: '#1f2c33',
            color: '#ffffff',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '10px 12px',
            width: '100%',
            outline: 'none',
          }}
        />

        <div style={{ color: '#8696a0', fontSize: '12px', marginTop: '5px' }}>
          Enter the full path to your folder containing PDF files (can include subfolders)
        </div>

        <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="skip-duplicates"
            checked={skipDuplicates}
            onChange={(e) => setSkipDuplicates(e.target.checked)}
            disabled={loading || (currentProcess && currentProcess.status === 'running')}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="skip-duplicates" style={{ color: '#e9edef', cursor: 'pointer', userSelect: 'none' }}>
            Skip duplicate books (based on ISBN)
          </label>
        </div>

        {error && (
          <div style={{
            marginTop: '15px',
            padding: '12px',
            background: 'rgba(234, 67, 53, 0.1)',
            border: '1px solid rgba(234, 67, 53, 0.3)',
            borderRadius: '8px',
            color: '#ea4335',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FiAlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button
            className="btn primary"
            onClick={startUpload}
            disabled={loading || (currentProcess && currentProcess.status === 'running')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loading ? (
              <>
                <FiRefreshCw className="animate-spin" />
                Starting...
              </>
            ) : currentProcess && currentProcess.status === 'running' ? (
              <>
                <FiRefreshCw className="animate-spin" />
                Upload in Progress...
              </>
            ) : (
              <>
                <FiPlay />
                Start Bulk Upload
              </>
            )}
          </button>
          {currentProcess && currentProcess.status === 'running' && (
            <button
              className="btn"
              onClick={() => setShowStopConfirm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ea4335', color: 'white' }}
            >
              <FiX />
              Stop Upload
            </button>
          )}
        </div>
      </div>

      {/* Current Process Progress */}
      {currentProcess && (
        <div className="panel" style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {getStatusIcon(currentProcess.status)}
              <span style={{ color: '#e9edef', fontWeight: '500', fontSize: '16px' }}>
                Current Upload Progress
              </span>
            </div>
            <span style={{
              color: getStatusColor(currentProcess.status),
              fontSize: '14px',
              fontWeight: '500',
              textTransform: 'uppercase'
            }}>
              {currentProcess.status}
            </span>
          </div>

          <div style={{
            background: '#0b141a',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <div style={{ color: '#8696a0', fontSize: '12px', marginBottom: '8px' }}>
              {currentProcess.booksDirectory}
            </div>

            {/* Progress Bar */}
            {(currentProcess?.stats?.total ?? 0) > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#1f2c33',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(((currentProcess?.stats?.processed ?? 0) / (currentProcess?.stats?.total || 1)) * 100)}%`,
                    height: '100%',
                    background: '#00a884',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{
                  color: '#8696a0',
                  fontSize: '12px',
                  marginTop: '5px',
                  textAlign: 'center'
                }}>
                  {(currentProcess?.stats?.processed ?? 0)} / {(currentProcess?.stats?.total ?? 0)} files processed
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '12px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#00a884', fontSize: '24px', fontWeight: '600' }}>
                  {currentProcess?.stats?.successful ?? 0}
                </div>
                <div style={{ color: '#8696a0', fontSize: '12px' }}>Successful</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ea4335', fontSize: '24px', fontWeight: '600' }}>
                  {currentProcess?.stats?.failed ?? 0}
                </div>
                <div style={{ color: '#8696a0', fontSize: '12px' }}>Failed</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#8696a0', fontSize: '24px', fontWeight: '600' }}>
                  {currentProcess?.stats?.skipped ?? 0}
                </div>
                <div style={{ color: '#8696a0', fontSize: '12px' }}>Skipped</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#e9edef', fontSize: '24px', fontWeight: '600' }}>
                  {currentProcess?.stats?.total ?? 0}
                </div>
                <div style={{ color: '#8696a0', fontSize: '12px' }}>Total</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#8696a0' }}>
            Started: {formatDate(currentProcess.startedAt)}
            {currentProcess.completedAt && ` • Completed: ${formatDate(currentProcess.completedAt)}`}
          </div>
        </div>
      )}

      {/* Process History */}
      <div className="panel">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px'
        }}>
          <div className="panel-title" style={{ margin: 0 }}>Upload History</div>
          <button
            className="btn"
            onClick={fetchProcesses}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
          >
            <FiRefreshCw size={14} />
            Refresh
          </button>
        </div>

        {processes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#8696a0'
          }}>
            No upload history yet. Start your first bulk upload above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {processes.map((process) => (
              <div
                key={process.id}
                style={{
                  background: '#0b141a',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #1f2c33'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {getStatusIcon(process.status)}
                    <span style={{ color: '#e9edef', fontSize: '14px', fontWeight: '500' }}>
                      {process.id}
                    </span>
                  </div>
                  <span style={{
                    color: getStatusColor(process.status),
                    fontSize: '12px',
                    fontWeight: '500',
                    textTransform: 'uppercase'
                  }}>
                    {process.status}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#8696a0', marginBottom: '8px' }}>
                  {process.booksDirectory}
                </div>

                <div style={{
                  display: 'flex',
                  gap: '20px',
                  fontSize: '12px',
                  color: '#8696a0'
                }}>
                  <span>✅ {process?.stats?.successful ?? 0} successful</span>
                  <span>❌ {process?.stats?.failed ?? 0} failed</span>
                  <span>⏭️ {process?.stats?.skipped ?? 0} skipped</span>
                  <span>📚 {process?.stats?.total ?? 0} total</span>
                </div>

                <div style={{ fontSize: '11px', color: '#8696a0', marginTop: '8px' }}>
                  {formatDate(process.startedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '28px', right: '28px',
          maxWidth: '360px', width: 'calc(100% - 56px)',
          background: toast.type === 'error' ? '#3b1f20' : '#12321f',
          color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
          padding: '12px 16px', borderRadius: '10px', zIndex: 10000,
          boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', gap: '10px',
          transform: 'translateY(0)', opacity: 1, transition: 'all .25s ease'
        }}>
          <span style={{
            display: 'inline-block', width: 10, height: 10,
            borderRadius: '50%',
            background: toast.type === 'error' ? '#ef4444' : '#22c55e'
          }} />
          <span style={{ lineHeight: 1.4 }}>{toast.message}</span>
        </div>
      )}

      {/* Info Panel */}
      <div className="panel" style={{ marginTop: '20px', background: 'rgba(0, 168, 132, 0.1)', border: '1px solid rgba(0, 168, 132, 0.3)' }}>
        <div style={{ color: '#00a884', fontSize: '14px', fontWeight: '500', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiAlertCircle size={18} />
          How It Works
        </div>
        <ul style={{ color: '#8696a0', fontSize: '13px', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
          <li>Scans the specified folder and all subfolders for PDF files</li>
          <li>Extracts ISBN from filename (e.g., 9780140328721.pdf) or PDF content</li>
          <li>Fetches book metadata from Google Books API (title, author, cover, etc.)</li>
          <li>Uploads PDF and cover image to Supabase storage</li>
          <li>Saves complete book record to database</li>
          <li>Automatically resumes if interrupted (progress is saved)</li>
          <li>Skips duplicate books based on ISBN</li>
        </ul>
      </div>

      {/* Stop Confirmation Modal */}
      {showStopConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#1f2c33',
            borderRadius: '12px',
            padding: '25px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ color: '#e9edef', marginBottom: '15px' }}>Stop Upload?</h3>
            <p style={{ color: '#8696a0', marginBottom: '20px' }}>
              Are you sure you want to stop the upload? Progress will be saved and you can resume later.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn"
                onClick={() => setShowStopConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={stopUpload}
                style={{ background: '#ea4335' }}
              >
                Stop Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Confirmation Modal */}
      {showResumeConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#1f2c33',
            borderRadius: '12px',
            padding: '25px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ color: '#e9edef', marginBottom: '15px' }}>Resume Upload?</h3>
            <p style={{ color: '#8696a0', marginBottom: '20px' }}>
              Resume uploading from where you left off? ({incompleteProcess?.stats.processed || 0} of {incompleteProcess?.stats.total || 0} files already uploaded)
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn"
                onClick={() => setShowResumeConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={resumeUpload}
              >
                Resume Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoUpload;
