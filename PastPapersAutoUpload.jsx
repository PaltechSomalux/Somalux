import React, { useState, useEffect } from 'react';
import { FiUpload, FiFolderPlus, FiPlay, FiRefreshCw, FiCheck, FiX, FiClock, FiAlertCircle } from 'react-icons/fi';

const API_BASE = 'http://localhost:5000';

const PastPapersAutoUpload = ({ userProfile, asSubmission = false }) => {
  const [papersDirectory, setPapersDirectory] = useState('');
  const [currentProcess, setCurrentProcess] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showResumeConfirm, setShowResumeConfirm] = useState(false);
  const [incompleteProcess, setIncompleteProcess] = useState(null);
  const [toast, setToast] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 12;

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error]);

  const isOwnedByCurrentUser = (process) => {
    if (!userProfile) return !asSubmission;

    const currentId = userProfile?.id || userProfile?.uid || userProfile?.user_id || null;
    const currentEmail = (userProfile?.email || userProfile?.email_address || '').toLowerCase();

    const ownerId = process.uploadedBy || process.uploaded_by || process.userId || process.user_id || null;
    const ownerEmail = (process.startedByEmail || process.actorEmail || process.started_by_email || process.user_email || process.email || '').toLowerCase();

    if (currentId && ownerId && String(currentId) === String(ownerId)) return true;
    if (currentEmail && ownerEmail && currentEmail === ownerEmail) return true;
    return false;
  };

  // Poll for process status
  useEffect(() => {
    if (!currentProcess) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/api/elib/bulk-upload-pastpapers/status/${currentProcess.id}`);
        const data = await response.json();

        if (response.ok && data.ok && data.process) {
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

          if (safeProcess.status === 'completed' || safeProcess.status === 'failed') {
            clearInterval(interval);
            fetchProcesses();
          }
        } else if (!response.ok) {
          clearInterval(interval);
          showToast(data?.error || 'Failed to get upload status', 'error');
        }
      } catch (err) {
        console.error('Failed to poll status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentProcess?.id]);

  const fetchProcesses = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/elib/bulk-upload-pastpapers/processes`);
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

        const scoped = asSubmission ? safe.filter((p) => isOwnedByCurrentUser(p)) : safe;
        setProcesses(scoped);

        // Check for incomplete process on mount
        const incomplete = scoped.find(p => p.status === 'stopped' && p.stats.processed < p.stats.total);
        if (incomplete && !currentProcess) {
          setIncompleteProcess(incomplete);
        }
      }
    } catch (err) {
      console.error('Failed to fetch processes:', err);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 10000);
    return () => clearInterval(interval);
  }, []);

  const startUpload = async () => {
    if (!papersDirectory.trim()) {
      setError('Please enter a valid directory path');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const actorEmail = userProfile?.email || userProfile?.email_address || null;
      const actorName = userProfile?.displayName || userProfile?.name || userProfile?.display_name || null;
      const response = await fetch(`${API_BASE}/api/elib/bulk-upload-pastpapers/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-email': actorEmail || 'admin',
          'x-actor-name': actorName || ''
        },
        body: JSON.stringify({
          papersDirectory,
          uploadedBy: userProfile?.id || userProfile?.uid || userProfile?.user_id || null,
          asSubmission: !!asSubmission
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error || 'Failed to start upload';
        showToast(msg.includes('Directory') ? msg : `Failed to start upload: ${msg}`, 'error');
        throw new Error(msg);
      }

      if (data.ok) {
        setCurrentProcess({
          id: data.processId,
          status: 'running',
          startedAt: new Date().toISOString(),
          papersDirectory,
          stats: { total: 0, processed: 0, successful: 0, failed: 0, skipped: 0 }
        });
        setIncompleteProcess(null);
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
      const response = await fetch(`${API_BASE}/api/elib/bulk-upload-pastpapers/stop/${currentProcess.id}`, {
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
      setPapersDirectory(incompleteProcess.papersDirectory);
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
      <div className="panel-title">Past Papers Automatic Bulk Upload</div>
      <div style={{ color: '#8696a0', fontSize: '12px', marginBottom: '8px' }}>
        Scan folders for PDFs, extract past paper details using OCR, and upload automatically
      </div>

      {/* Resume Banner */}
      {incompleteProcess && !currentProcess && (
        <div style={{
          background: 'rgba(0, 168, 132, 0.1)',
          border: '1px solid #00a884',
          borderRadius: '4px',
          padding: '8px',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ color: '#00a884', fontWeight: '600', marginBottom: '2px' }}>
              📂 Incomplete Upload Detected
            </div>
            <div style={{ color: '#8696a0', fontSize: '13px' }}>
              {incompleteProcess.stats.processed} of {incompleteProcess.stats.total} papers uploaded from {incompleteProcess.papersDirectory}
            </div>
          </div>
          <button
            className="btn primary"
            onClick={() => setShowResumeConfirm(true)}
            style={{ marginLeft: '8px' }}
          >
            Resume Upload
          </button>
        </div>
      )}

      {/* Configuration Section */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        {asSubmission && (
          <div style={{
            marginBottom: '12px',
            padding: '10px 12px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 8,
            color: '#c7d2fe',
            fontSize: 13
          }}>
            Your uploads will be sent for admin review. They will appear to others after approval.
          </div>
        )}
        <label className="label">Papers Directory Path</label>
        <input
          className="input"
          type="text"
          placeholder="D:\\path\\to\\your\\scanned\\pastpapers"
          value={papersDirectory}
          onChange={(e) => setPapersDirectory(e.target.value)}
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
          Enter the full path to your folder containing scanned past paper PDFs
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
                <FiRefreshCw className="animate-spin" size={18} />
                Starting...
              </>
            ) : (
              <>
                <FiPlay size={18} />
                Start Upload
              </>
            )}
          </button>

          {currentProcess && currentProcess.status === 'running' && (
            <button
              className="btn"
              onClick={() => setShowStopConfirm(true)}
              style={{ color: '#ea4335' }}
            >
              Stop Upload
            </button>
          )}
        </div>
      </div>

      {/* Current Process */}
      {currentProcess && (
        <div className="panel" style={{ marginBottom: '20px', background: 'rgba(0, 168, 132, 0.05)', border: '1px solid #00a884' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            {getStatusIcon(currentProcess.status)}
            <div>
              <div style={{ color: '#e9edef', fontWeight: '600' }}>
                {currentProcess.status === 'running' ? 'Uploading...' : currentProcess.status === 'completed' ? 'Upload Complete' : 'Upload Failed'}
              </div>
              <div style={{ color: '#8696a0', fontSize: '12px' }}>
                {formatDate(currentProcess.startedAt)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {currentProcess.stats.total > 0 && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#8696a0', fontSize: '12px' }}>Progress</span>
                  <span style={{ color: '#00a884', fontSize: '12px', fontWeight: '600' }}>
                    {currentProcess.stats.processed} / {currentProcess.stats.total}
                  </span>
                </div>
                <div style={{
                  height: '8px',
                  background: '#374151',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    background: '#00a884',
                    width: `${(currentProcess.stats.processed / currentProcess.stats.total) * 100}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '12px' }}>
                <div style={{ padding: '8px', background: 'rgba(0, 168, 132, 0.1)', borderRadius: '4px' }}>
                  <div style={{ color: '#8696a0' }}>Successful</div>
                  <div style={{ color: '#00a884', fontWeight: '600', fontSize: '16px' }}>{currentProcess.stats.successful}</div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(234, 67, 53, 0.1)', borderRadius: '4px' }}>
                  <div style={{ color: '#8696a0' }}>Failed</div>
                  <div style={{ color: '#ea4335', fontWeight: '600', fontSize: '16px' }}>{currentProcess.stats.failed}</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Stops confirm dialog */}
      {showStopConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1f2c33',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#e9edef', marginBottom: '8px' }}>
                Stop Upload?
              </div>
              <div style={{ color: '#8696a0', fontSize: '14px' }}>
                Stopping will pause the upload. You can resume it later.
              </div>
            </div>
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

      {/* Upload History */}
      <div className="panel">
        <div className="panel-title">Upload History</div>
        {processes.length === 0 ? (
          <div style={{ color: '#8696a0', textAlign: 'center', padding: '20px' }}>
            No uploads yet
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {processes.slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE).map(p => (
              <div key={p.id} style={{
                padding: '12px',
                background: '#1f2c33',
                border: '1px solid #374151',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {getStatusIcon(p.status)}
                  <div>
                    <div style={{ color: '#e9edef', fontSize: '14px', fontWeight: '500' }}>
                      {p.papersDirectory}
                    </div>
                    <div style={{ color: '#8696a0', fontSize: '12px' }}>
                      {p.stats.successful} successful, {p.stats.failed} failed, {p.stats.skipped} skipped
                    </div>
                    <div style={{ color: '#8696a0', fontSize: '11px' }}>
                      {formatDate(p.startedAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {processes.length > HISTORY_PAGE_SIZE && (
          <div className="actions" style={{ marginTop: '12px' }}>
            <button
              className="btn"
              disabled={historyPage <= 1}
              onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span style={{ color: '#cfd8dc' }}>Page {historyPage} of {Math.ceil(processes.length / HISTORY_PAGE_SIZE)}</span>
            <button
              className="btn"
              disabled={historyPage >= Math.ceil(processes.length / HISTORY_PAGE_SIZE)}
              onClick={() => setHistoryPage(p => Math.min(Math.ceil(processes.length / HISTORY_PAGE_SIZE), p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: toast.type === 'error' ? '#ea4335' : '#00a884',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 1001
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default PastPapersAutoUpload;
