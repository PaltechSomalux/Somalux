import React, { useState } from 'react';
import { getOrphanedFilesReport, cleanupOrphanedFiles } from './src/SomaLux/Books/Admin/api';
import { useAdminUI } from './src/SomaLux/Books/AdminUIContext';

const StorageCleanup = ({ userProfile }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [cleanupResults, setCleanupResults] = useState(null);
  const { confirm, showToast } = useAdminUI();

  const isAdmin = userProfile?.role === 'admin' || 
    ['campuslives254@gmail.com', 'paltechsomalux@gmail.com'].includes(userProfile?.email);

  const handleGetReport = async () => {
    if (!isAdmin) {
      showToast({ type: 'error', message: 'Only admins can access storage management.' });
      return;
    }

    setLoading(true);
    try {
      const data = await getOrphanedFilesReport();
      setReport(data);
      showToast({ type: 'success', message: 'Orphaned files report generated.' });
    } catch (error) {
      console.error('Failed to get report:', error);
      showToast({ type: 'error', message: 'Failed to generate report.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!isAdmin) {
      showToast({ type: 'error', message: 'Only admins can access storage management.' });
      return;
    }

    const ok = await confirm({
      title: 'Clean up orphaned files?',
      message: 'This will permanently delete all files in storage that have no corresponding database records. This action cannot be undone.',
      confirmLabel: 'Delete Orphaned Files',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });

    if (!ok) return;

    setLoading(true);
    try {
      const results = await cleanupOrphanedFiles();
      setCleanupResults(results);
      showToast({ type: 'success', message: 'Cleanup completed! Check the results below.' });
    } catch (error) {
      console.error('Failed to cleanup:', error);
      showToast({ type: 'error', message: 'Cleanup failed.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="panel" style={{ padding: '16px', textAlign: 'center', color: '#8696a0' }}>
        <p>You don't have permission to access storage management.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="panel">
        <div className="panel-title">Storage Cleanup & Orphaned Files Management</div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#8696a0', marginBottom: '12px' }}>
            Scan Supabase storage for files that have no corresponding database records and optionally delete them.
          </p>
        </div>

        <div className="actions" style={{ marginBottom: '16px', gap: '8px' }}>
          <button 
            className="btn primary" 
            onClick={handleGetReport}
            disabled={loading}
          >
            {loading ? 'Scanning...' : 'Scan for Orphaned Files'}
          </button>
          {report && (
            <button 
              className="btn" 
              onClick={handleCleanup}
              disabled={loading}
              style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none' }}
            >
              {loading ? 'Cleaning...' : 'Delete Orphaned Files'}
            </button>
          )}
        </div>

        {report && (
          <div className="panel" style={{ padding: '12px', backgroundColor: '#1a1a1a', marginBottom: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ color: '#00a884', marginBottom: '8px' }}>📊 Storage Report</h4>
              
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#cfd8dc', fontSize: '0.9rem', marginBottom: '4px' }}>
                  <strong>Books Bucket (elib-books):</strong>
                </div>
                <div style={{ color: '#8696a0', fontSize: '0.85rem', marginLeft: '8px' }}>
                  Total Files: {report.books_bucket.total} | Orphaned: {report.books_bucket.orphaned}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#cfd8dc', fontSize: '0.9rem', marginBottom: '4px' }}>
                  <strong>Past Papers Bucket:</strong>
                </div>
                <div style={{ color: '#8696a0', fontSize: '0.85rem', marginLeft: '8px' }}>
                  Total Files: {report.past_papers_bucket.total} | Orphaned: {report.past_papers_bucket.orphaned}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#cfd8dc', fontSize: '0.9rem', marginBottom: '4px' }}>
                  <strong>University Covers Bucket:</strong>
                </div>
                <div style={{ color: '#8696a0', fontSize: '0.85rem', marginLeft: '8px' }}>
                  Total Files: {report.university_covers_bucket.total} | Orphaned: {report.university_covers_bucket.orphaned}
                </div>
              </div>

              {(report.books_bucket.files.length > 0 || 
                report.past_papers_bucket.files.length > 0 || 
                report.university_covers_bucket.files.length > 0) && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px', 
                  backgroundColor: '#1f2937', 
                  borderRadius: '4px',
                  borderLeft: '3px solid #fbbf24'
                }}>
                  <div style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    ⚠️ Orphaned Files Detected
                  </div>
                  
                  {report.books_bucket.files.length > 0 && (
                    <div style={{ marginBottom: '8px', fontSize: '0.85rem' }}>
                      <div style={{ color: '#cfd8dc' }}>Books:</div>
                      <div style={{ color: '#8696a0', marginLeft: '8px', wordBreak: 'break-all' }}>
                        {report.books_bucket.files.slice(0, 5).join(', ')}
                        {report.books_bucket.files.length > 5 && ` ... and ${report.books_bucket.files.length - 5} more`}
                      </div>
                    </div>
                  )}
                  
                  {report.past_papers_bucket.files.length > 0 && (
                    <div style={{ marginBottom: '8px', fontSize: '0.85rem' }}>
                      <div style={{ color: '#cfd8dc' }}>Past Papers:</div>
                      <div style={{ color: '#8696a0', marginLeft: '8px', wordBreak: 'break-all' }}>
                        {report.past_papers_bucket.files.slice(0, 5).join(', ')}
                        {report.past_papers_bucket.files.length > 5 && ` ... and ${report.past_papers_bucket.files.length - 5} more`}
                      </div>
                    </div>
                  )}

                  {report.university_covers_bucket.files.length > 0 && (
                    <div style={{ fontSize: '0.85rem' }}>
                      <div style={{ color: '#cfd8dc' }}>University Covers:</div>
                      <div style={{ color: '#8696a0', marginLeft: '8px', wordBreak: 'break-all' }}>
                        {report.university_covers_bucket.files.slice(0, 5).join(', ')}
                        {report.university_covers_bucket.files.length > 5 && ` ... and ${report.university_covers_bucket.files.length - 5} more`}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {cleanupResults && (
          <div className="panel" style={{ padding: '12px', backgroundColor: '#1a1a1a' }}>
            <h4 style={{ color: '#00a884', marginBottom: '8px' }}>✅ Cleanup Results</h4>
            
            <div style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
              <div style={{ color: '#cfd8dc', marginBottom: '4px' }}>
                Book PDFs Deleted: <strong style={{ color: '#00a884' }}>{cleanupResults.books_pdf_deleted.length}</strong>
              </div>
              <div style={{ color: '#cfd8dc', marginBottom: '4px' }}>
                Book Covers Deleted: <strong style={{ color: '#00a884' }}>{cleanupResults.books_cover_deleted.length}</strong>
              </div>
              <div style={{ color: '#cfd8dc', marginBottom: '4px' }}>
                Past Papers Deleted: <strong style={{ color: '#00a884' }}>{cleanupResults.past_papers_deleted.length}</strong>
              </div>
              <div style={{ color: '#cfd8dc' }}>
                University Covers Deleted: <strong style={{ color: '#00a884' }}>{cleanupResults.university_covers_deleted.length}</strong>
              </div>
            </div>

            {cleanupResults.errors.length > 0 && (
              <div style={{ 
                marginTop: '12px', 
                padding: '8px', 
                backgroundColor: '#7f1d1d',
                borderRadius: '4px'
              }}>
                <div style={{ color: '#fca5a5', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  ⚠️ Errors:
                </div>
                {cleanupResults.errors.map((err, i) => (
                  <div key={i} style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '4px' }}>
                    • {err}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageCleanup;
