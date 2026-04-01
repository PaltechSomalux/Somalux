import React, { useState } from 'react';
import { clearAllCaches, getCacheStats, getSupabaseUsageReport, migrateAvatarsToProfilesTable } from '../api';
import { useAdminUI } from '../AdminUIContext';

const StorageCleanup = ({ userProfile }) => {
  const [loading, setLoading] = useState(false);
  // const [report, setReport] = useState(null);
  // const [cleanupResults, setCleanupResults] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [cacheCleared, setCacheCleared] = useState(null);
  const [usageReport, setUsageReport] = useState(null);
  const [migrationResults, setMigrationResults] = useState(null);
  const { confirm, showToast } = useAdminUI();

  const isAdmin = userProfile?.role === 'admin' || 
    ['campuslives254@gmail.com', 'paltechsomalux@gmail.com'].includes(userProfile?.email);

  // Orphaned files report disabled
  // const handleGetReport = async () => {
  //   if (!isAdmin) {
  //     showToast({ type: 'error', message: 'Only admins can access storage management.' });
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const data = await getOrphanedFilesReport();
  //     setReport(data);
  //     showToast({ type: 'success', message: 'Orphaned files report generated.' });
  //   } catch (error) {
  //     console.error('Failed to get report:', error);
  //     showToast({ type: 'error', message: 'Failed to generate report.' });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Cleanup disabled
  // const handleCleanup = async () => {
  //   if (!isAdmin) {
  //     showToast({ type: 'error', message: 'Only admins can access storage management.' });
  //     return;
  //   }

  //   const ok = await confirm({
  //     title: 'Clean up orphaned files?',
  //     message: 'This will permanently delete all files in storage that have no corresponding database records. This action cannot be undone.',
  //     confirmLabel: 'Delete Orphaned Files',
  //     cancelLabel: 'Cancel',
  //     variant: 'danger',
  //   });

  //   if (!ok) return;

  //   setLoading(true);
  //   try {
  //     const results = await cleanupOrphanedFiles();
  //     setCleanupResults(results);
  //     showToast({ type: 'success', message: 'Cleanup completed! Check the results below.' });
  //   } catch (error) {
  //     console.error('Failed to cleanup:', error);
  //     showToast({ type: 'error', message: 'Cleanup failed.' });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleGetCacheStats = async () => {
    if (!isAdmin) {
      showToast({ type: 'error', message: 'Only admins can access storage management.' });
      return;
    }

    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
      showToast({ type: 'success', message: 'Cache statistics loaded.' });
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      showToast({ type: 'error', message: 'Failed to load cache statistics.' });
    }
  };

  const handleClearCache = async () => {
    if (!isAdmin) {
      showToast({ type: 'error', message: 'Only admins can access storage management.' });
      return;
    }

    const ok = await confirm({
      title: 'Clear all caches?',
      message: `This will clear ${cacheStats?.cache_items || '?'} cached items from browser storage. Users will need to reload pages to see updates.`,
      confirmLabel: 'Clear Caches',
      cancelLabel: 'Cancel',
      variant: 'warning',
    });

    if (!ok) return;

    try {
      const result = clearAllCaches();
      setCacheCleared(result);
      setCacheStats(null);
      showToast({ type: 'success', message: `Cleared ${result.cleared} cache items.` });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      showToast({ type: 'error', message: 'Failed to clear cache.' });
    }
  };

  const handleGetUsageReport = async () => {
    if (!isAdmin) {
      showToast({ type: 'error', message: 'Only admins can access storage management.' });
      return;
    }

    setLoading(true);
    try {
      const report = await getSupabaseUsageReport();
      setUsageReport(report);
      showToast({ type: 'success', message: 'Usage report loaded.' });
    } catch (error) {
      console.error('Failed to get usage report:', error);
      showToast({ type: 'error', message: 'Failed to load usage report.' });
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateAvatars = async () => {
    if (!isAdmin) {
      showToast({ type: 'error', message: 'Only admins can access storage management.' });
      return;
    }

    const ok = await confirm({
      title: 'Migrate avatars to profiles table?',
      message: 'This will migrate existing avatar files from storage to user profiles table. This will link avatars to users so they display correctly. This action cannot be undone.',
      confirmLabel: 'Migrate Avatars',
      cancelLabel: 'Cancel',
      variant: 'warning',
    });

    if (!ok) return;

    setLoading(true);
    try {
      const results = await migrateAvatarsToProfilesTable();
      setMigrationResults(results);
      if (results.success) {
        showToast({ 
          type: 'success', 
          message: `Avatar migration completed! Migrated: ${results.migrated}, Skipped: ${results.skipped}, Errors: ${results.errors}.` 
        });
      } else {
        showToast({ 
          type: 'error', 
          message: `Avatar migration failed: ${results.error}` 
        });
      }
    } catch (error) {
      console.error('Failed to migrate avatars:', error);
      showToast({ type: 'error', message: 'Avatar migration failed.' });
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
      {/* USAGE DASHBOARD */}
      <div className="panel">
        <div className="panel-title">📊 Supabase Usage & Billing</div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#8696a0', marginBottom: '12px' }}>
            Monitor your Supabase database and storage usage. Note: Billing information refreshes within 1 hour.
          </p>
        </div>

        <div className="actions" style={{ marginBottom: '16px' }}>
          <button 
            className="btn primary" 
            onClick={handleGetUsageReport}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh Usage Report'}
          </button>
        </div>

        {usageReport && !usageReport.error && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#e9edef', marginBottom: '12px' }}>📈 Database Tables</h4>
            <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: '800px', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '200px' }}>Table Name</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Row Count</th>
                    <th style={{ width: '150px', textAlign: 'right' }}>Est. Size (MB)</th>
                  </tr>
                </thead>
                <tbody>
                  {usageReport.database?.tables && Object.entries(usageReport.database.tables).map(([table, data]) => (
                    <tr key={table}>
                      <td style={{ textTransform: 'capitalize' }}>{table}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00a884' }}>{data.rows.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: '#00a884' }}>{data.estimated_size_mb}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {usageReport && !usageReport.error && usageReport.storage?.buckets && (
          <div>
            <h4 style={{ color: '#e9edef', marginBottom: '12px' }}>💾 Storage Buckets</h4>
            <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="table" style={{ minWidth: '1000px', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '200px' }}>Bucket Name</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>File Count</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Size (GB)</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Size (MB)</th>
                    <th style={{ width: '150px', textAlign: 'right' }}>Size (Bytes)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(usageReport.storage.buckets).map(([bucket, data]) => (
                    <tr key={bucket}>
                      <td style={{ textTransform: 'capitalize' }}>{bucket.replace(/_/g, ' ')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00a884' }}>{data.files.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00a884' }}>{data.size_gb}</td>
                      <td style={{ textAlign: 'right', color: '#8696a0' }}>{data.size_mb}</td>
                      <td style={{ textAlign: 'right', color: '#6b7280', fontSize: '0.9rem' }}>{data.size_bytes.toLocaleString()}</td>
                    </tr>
                  ))}
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#0b141a', boxShadow: 'inset 0 2px 0 rgba(0, 168, 132, 0.4)' }}>
                    <td style={{ color: '#00a884' }}>TOTAL</td>
                    <td style={{ textAlign: 'right', color: '#00a884' }}>{Object.values(usageReport.storage.buckets).reduce((sum, b) => sum + b.files, 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: '#00a884' }}>{usageReport.summary?.total_storage_gb || 0}</td>
                    <td style={{ textAlign: 'right', color: '#00a884' }}>{(parseFloat(usageReport.summary?.total_storage_gb || 0) * 1024).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#00a884' }}>{(parseFloat(usageReport.summary?.total_storage_gb || 0) * 1024 * 1024 * 1024).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {usageReport?.error && (
          <div className="panel" style={{ padding: '12px', backgroundColor: '#7f1d1d', borderRadius: '4px' }}>
            <div style={{ color: '#fca5a5' }}>
              ⚠️ Error: {usageReport.error}
            </div>
          </div>
        )}

        {/* Billing Summary */}
        <div className="panel">
          <h4 style={{ color: '#e9edef', marginBottom: '12px' }}>💳 Billing Summary</h4>
          <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <table className="table" style={{ minWidth: '900px', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '300px' }}>Metric</th>
                  <th style={{ width: '300px', textAlign: 'right' }}>Usage</th>
                  <th style={{ width: '300px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Database Size</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00a884' }}>
                    {usageReport?.summary?.total_database_size_gb || '0'} GB
                  </td>
                  <td style={{ textAlign: 'center', color: '#a3e635' }}>✓ Tracked</td>
                </tr>
                <tr>
                  <td>Storage Size</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00a884' }}>
                    {usageReport?.summary?.total_storage_size_gb || '0'} GB
                  </td>
                  <td style={{ textAlign: 'center', color: '#a3e635' }}>✓ Tracked</td>
                </tr>
                <tr>
                  <td>Total Combined Size</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00a884' }}>
                    {usageReport?.summary?.total_combined_size_gb || '0'} GB
                  </td>
                  <td style={{ textAlign: 'center', color: '#a3e635' }}>✓ Calculated</td>
                </tr>
                <tr>
                  <td>Total Database Rows</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00a884' }}>
                    {(usageReport?.summary?.total_rows || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center', color: '#a3e635' }}>✓ Counted</td>
                </tr>
                <tr>
                  <td>Total Files</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00a884' }}>
                    {(usageReport?.summary?.total_files || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center', color: '#a3e635' }}>✓ Counted</td>
                </tr>
                <tr>
                  <td>Authenticated Users (ALL)</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00a884' }}>
                    {usageReport?.summary?.authenticated_users || '0'} users
                  </td>
                  <td style={{ textAlign: 'center', color: '#a3e635' }}>✓ Comprehensive Count</td>
                </tr>
                <tr>
                  <td>Users with Profiles</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00a884' }}>
                    {usageReport?.summary?.users_with_profiles || '0'} users
                  </td>
                  <td style={{ textAlign: 'center', color: '#a3e635' }}>✓ Tracked</td>
                </tr>
                <tr>
                  <td>Paper Uploads</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00a884' }}>
                    {usageReport?.billing?.users?.users_with_book_uploads || '0'} users
                  </td>
                  <td style={{ textAlign: 'center', color: '#a3e635' }}>✓ Active</td>
                </tr>
                <tr>
                  <td>Users with Paper Uploads</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00a884' }}>
                    {usageReport?.billing?.users?.users_with_paper_uploads || '0'} users
                  </td>
                  <td style={{ textAlign: 'center', color: '#a3e635' }}>✓ Active</td>
                </tr>
                {usageReport?.summary?.users_without_profiles > 0 && (
                  <tr>
                    <td>Users Pending Profile Completion</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#f59e0b' }}>
                      {usageReport?.summary?.users_without_profiles || '0'} users
                    </td>
                    <td style={{ textAlign: 'center', color: '#f59e0b' }}>⚠️ Pending</td>
                  </tr>
                )}
                <tr>
                  <td>Monthly Active Users (30 days)</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00a884' }}>
                    {usageReport?.summary?.monthly_active_users || '0'} / 10 MAU
                  </td>
                  <td style={{ textAlign: 'center', color: usageReport?.summary?.monthly_active_users > 10 ? '#fca5a5' : '#a3e635' }}>
                    {usageReport?.summary?.monthly_active_users > 10 ? '⚠️ Over limit' : '✓ Within limit'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ 
            padding: '12px', 
            backgroundColor: '#1f2937', 
            borderRadius: '4px',
            boxShadow: 'inset 3px 0 0 rgba(245, 158, 11, 0.3)'
          }}>
            <h5 style={{ color: '#f59e0b', marginBottom: '8px', fontWeight: '600' }}>📋 User Counting Methodology</h5>
            <div style={{ color: '#8696a0', fontSize: '0.85rem', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '6px' }}>
                • <strong>Authenticated Users (ALL):</strong> Total from multiple sources (backend API, profiles, uploaders) - Most comprehensive count
              </div>
              <div style={{ marginBottom: '6px' }}>
                • <strong>Users with Profiles:</strong> Users who have completed profile setup
              </div>
              <div style={{ marginBottom: '6px' }}>
                • <strong>Users with Paper Uploads:</strong> Users who have uploaded past papers to your system
              </div>
              <div style={{ marginBottom: '6px' }}>
                • <strong>Users with Paper Uploads:</strong> Users who have uploaded past papers to your system
              </div>
              <div style={{ marginBottom: '6px' }}>
                • <strong>Monthly Active Users:</strong> Users with profile updates in the last 30 days
              </div>
              <div style={{ marginBottom: '6px' }}>
                • <strong>Database & Storage:</strong> Sizes are accurately calculated from your Supabase project
              </div>
              <div>
                • <strong>Refresh Rate:</strong> Data updates every time you click "Refresh Usage Report"
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AVATAR MIGRATION SECTION */}
      <div className="panel">
        <div className="panel-title">👤 Avatar Migration to Profiles</div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#8696a0', marginBottom: '12px' }}>
            Link existing avatar files from storage to user profiles. This will ensure all user avatars display correctly in the admin dashboard.
          </p>
        </div>

        <div className="actions" style={{ marginBottom: '16px' }}>
          <button 
            className="btn primary" 
            onClick={handleMigrateAvatars}
            disabled={loading}
            style={{ backgroundColor: '#3b82f6' }}
          >
            {loading ? 'Migrating...' : 'Migrate Avatars to Profiles'}
          </button>
        </div>

        {migrationResults && (
          <div className="panel" style={{ marginBottom: '16px', backgroundColor: '#1a1a2e' }}>
            <h4 style={{ color: '#e9edef', marginBottom: '12px' }}>📊 Migration Results</h4>
            
            {migrationResults.success ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#0b141a', borderRadius: '4px', borderLeft: '4px solid #10b981' }}>
                  <div style={{ color: '#8696a0', fontSize: '0.9rem' }}>Migrated Profiles</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                    {migrationResults.migrated}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#0b141a', borderRadius: '4px', borderLeft: '4px solid #6b7280' }}>
                  <div style={{ color: '#8696a0', fontSize: '0.9rem' }}>Skipped (Already Linked)</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6b7280' }}>
                    {migrationResults.skipped}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#0b141a', borderRadius: '4px', borderLeft: '4px solid #ef4444' }}>
                  <div style={{ color: '#8696a0', fontSize: '0.9rem' }}>Errors</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                    {migrationResults.errors}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '12px', backgroundColor: '#7f1d1d', borderRadius: '4px', color: '#fca5a5' }}>
                ❌ Migration failed: {migrationResults.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* STORAGE SECTION */}
      <div className="panel">
        <div className="panel-title">Storage Cleanup & Orphaned Files Management</div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#8696a0', marginBottom: '12px' }}>
            Scan Supabase storage for files that have no corresponding database records and optionally delete them.
          </p>
        </div>

        {/* Orphaned files cleanup sections disabled */}
      </div>

      {/* CACHE MANAGEMENT SECTION */}
      <div className="panel">
        <div className="panel-title">Cache Management</div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#8696a0', marginBottom: '12px' }}>
            Clear browser cache to free up storage and force fresh data loads for all users.
          </p>
        </div>

        <div className="actions" style={{ marginBottom: '16px', gap: '8px' }}>
          <button 
            className="btn" 
            onClick={handleGetCacheStats}
            disabled={loading}
          >
            Get Cache Stats
          </button>
          {cacheStats && (
            <button 
              className="btn" 
              onClick={handleClearCache}
              disabled={loading}
              style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none' }}
            >
              {loading ? 'Clearing...' : 'Clear All Caches'}
            </button>
          )}
        </div>

        {cacheStats && (
          <div className="panel" style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#e9edef', marginBottom: '12px' }}>📊 Cache Statistics</h4>
            
            <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
              <table className="table" style={{ minWidth: '700px', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '300px' }}>Cache Item</th>
                    <th style={{ width: '150px', textAlign: 'right' }}>Key/Count</th>
                    <th style={{ width: '150px', textAlign: 'right' }}>Size (KB)</th>
                  </tr>
                </thead>
                <tbody>
                  {cacheStats.items && cacheStats.items.length > 0 ? (
                    <>
                      {cacheStats.items.slice(0, 10).map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ wordBreak: 'break-word', maxWidth: '300px' }}>
                            <span style={{ color: '#8696a0', fontSize: '0.85rem' }}>{item.key}</span>
                          </td>
                          <td style={{ textAlign: 'right', color: '#00a884' }}>—</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#00a884' }}>{item.sizeKB}</td>
                        </tr>
                      ))}
                      {cacheStats.items.length > 10 && (
                        <tr style={{ fontWeight: 'bold', backgroundColor: '#0b141a' }}>
                          <td style={{ color: '#8696a0' }}>... {cacheStats.items.length - 10} more items</td>
                          <td colSpan={2} style={{ textAlign: 'right', color: '#00a884' }}>
                            Scroll to see all
                          </td>
                        </tr>
                      )}
                    </>
                  ) : (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: '#8696a0' }}>No cache items found</td>
                    </tr>
                  )}
                  <tr style={{ fontWeight: 'bold', backgroundColor: '#0b141a', borderTop: '2px solid #00a884' }}>
                    <td>TOTAL ITEMS</td>
                    <td style={{ textAlign: 'right', color: '#00a884' }}>{cacheStats.cache_items}</td>
                    <td style={{ textAlign: 'right', color: '#00a884' }}>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {cacheCleared && (
          <div className="panel">
            <h4 style={{ color: '#a3e635', marginBottom: '12px' }}>✅ Cache Cleared Successfully</h4>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ minWidth: '600px', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '300px' }}>Metric</th>
                      <th style={{ width: '300px', textAlign: 'center' }}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Cache Items Cleared</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#a3e635' }}>
                        {cacheCleared.cleared}
                      </td>
                    </tr>
                    <tr style={{ fontWeight: 'bold', backgroundColor: '#0b141a', borderTop: '2px solid #a3e635' }}>
                      <td>Status</td>
                      <td style={{ textAlign: 'center', color: '#a3e635' }}>✓ Complete</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {cacheCleared.keys && cacheCleared.keys.length > 0 && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#1f2937', 
                borderRadius: '4px',
                marginTop: '12px',
                boxShadow: 'inset 3px 0 0 rgba(163, 230, 53, 0.3)'
              }}>
                <div style={{ color: '#cfd8dc', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px' }}>
                  Cleared Items ({cacheCleared.keys.length}):
                </div>
                <div style={{ color: '#8696a0', fontSize: '0.85rem', lineHeight: '1.6' }}>
                  {cacheCleared.keys.slice(0, 10).map((key, idx) => (
                    <div key={idx}>• {key}</div>
                  ))}
                  {cacheCleared.keys.length > 10 && (
                    <div style={{ marginTop: '4px', color: '#6b7280' }}>
                      ... and {cacheCleared.keys.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageCleanup;
