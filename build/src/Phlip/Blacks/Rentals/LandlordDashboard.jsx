import React, { useState, useEffect } from 'react';
import { 
  Plus, House, ChartBar, Calendar, Bell, Check, X,
  Upload, Trash, Eye, Pencil, MapPin, Money, Users,
  Image as ImageIcon, VideoCamera, Star, TrendUp,
  EnvelopeSimple, Clock, PaperPlaneTilt, CalendarBlank,
  ChatCircleText, Lightning, ToggleLeft, ToggleRight
} from 'phosphor-react';
import './LandlordDashboard.css';
import { supabase } from '../../Books/supabaseClient';
import { getCache, setCache, delCacheByPrefix } from './cache';

const DASHBOARD_CACHE_TTL = 2 * 60 * 1000; // 2 minutes combined cache

export const LandlordDashboard = ({ user, getToken }) => {
  const [view, setView] = useState('dashboard'); // dashboard, listings, bookings, reminders
  const [stats, setStats] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ requested_quota: '', reason: '' });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  // Toast notification state
  const [toast, setToast] = useState({ visible: false, type: 'success', message: '' });
  // Add listing modal state
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  // Reminder settings state
  const [reminderSettings, setReminderSettings] = useState(null);
  const [loadingReminders, setLoadingReminders] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    if (view === 'reminders' && !reminderSettings) {
      loadReminderSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const loadDashboardData = async () => {
    if (!user) return;

    const combinedKey = `landlord:dashboard:${user.id}`;
    const cachedDashboard = getCache(combinedKey);
    if (cachedDashboard) {
      setStats(cachedDashboard.stats || null);
      setMyListings(cachedDashboard.listings || []);
      setBookingRequests(cachedDashboard.bookings || []);
      setQuotaInfo(cachedDashboard.quota || null);
      // quick show cached data while background refresh proceeds
    }

    if (!user) return;
    
    // Show spinner only if no cached data
    if (!cachedDashboard) setLoading(true);
    try {
      const token = await getToken();

      const statsKey = `landlord:stats:${user.id}`;
      const listingsKey = `landlord:my-listings:${user.id}`;
      const bookingsKey = `landlord:booking-requests:${user.id}`;
      const quotaKey = `landlord:quota:${user.id}`;

      const fetchIfNeeded = async (key, url, ttl = 60_000) => {
        const cached = getCache(key);
        if (cached) return cached;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data && data.success) setCache(key, data, ttl);
        return data;
      };

      const [statsData, listingsData, bookingsData, quotaJson] = await Promise.all([
        fetchIfNeeded(statsKey, 'http://localhost:5000/api/rentals/landlord/stats'),
        fetchIfNeeded(listingsKey, 'http://localhost:5000/api/rentals/my-listings', 30_000),
        fetchIfNeeded(bookingsKey, 'http://localhost:5000/api/rentals/booking-requests', 30_000),
        fetchIfNeeded(quotaKey, 'http://localhost:5000/api/rentals/me/quota')
      ]);

      if (statsData?.success) setStats(statsData.stats);
      if (listingsData?.success) setMyListings(listingsData.listings);
      if (bookingsData?.success) setBookingRequests(bookingsData.bookings);
      if (quotaJson?.success) setQuotaInfo(quotaJson);


    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      // store combined cache
      try {
        setCache(combinedKey, {
          stats,
          listings: myListings,
          bookings: bookingRequests,
          quota: quotaInfo
        }, DASHBOARD_CACHE_TTL);
      } catch (e) {}
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/rentals/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ booking_status: 'approved' })
      });
      
      if (res.ok) {
        showToast('success', 'Booking approved successfully!');
        // invalidate bookings cache so refreshed data is fetched
        delCacheByPrefix(`landlord:`);
        loadDashboardData();
      } else {
        showToast('error', 'Failed to approve booking');
      }
    } catch (error) {
      console.error('Error approving booking:', error);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/rentals/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ booking_status: 'rejected' })
      });
      
      if (res.ok) {
        showToast('success', 'Booking rejected');
        delCacheByPrefix(`landlord:`);
        loadDashboardData();
      } else {
        showToast('error', 'Failed to reject booking');
      }
    } catch (error) {
      console.error('Error rejecting booking:', error);
    }
  };

  if (loading) {
    return (
      <div className="landlord-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const handleRequestMore = () => setShowRequestModal(true);

  const showToast = (type, message) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: '', message: '' }), 4000);
  };

  const loadReminderSettings = async () => {
    setLoadingReminders(true);
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:5000/api/rentals/landlord/reminder-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReminderSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading reminder settings:', error);
    } finally {
      setLoadingReminders(false);
    }
  };

  const submitRequestMore = async () => {
    if (!requestForm.requested_quota || parseInt(requestForm.requested_quota) < 1) {
      showToast('error', 'Please enter a valid total listings number (≥1)');
      return;
    }
    setRequestSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:5000/api/rentals/me/quota-requests', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requested_quota: parseInt(requestForm.requested_quota), 
          reason: requestForm.reason || '' 
        })
      });
      const js = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast('error', js?.error || 'Failed to create request');
        return;
      }
      
      showToast('success', 'Request submitted successfully! Admin will review.');
      console.log('📧 Quota request response:', js);
      
      setShowRequestModal(false);
      setRequestForm({ requested_quota: '', reason: '' });
      await loadDashboardData();
    } catch (e) {
      console.error('Error sending request:', e);
      showToast('error', 'Error sending request');
    } finally {
      setRequestSubmitting(false);
    }
  };

  return (
    <div className="landlord-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <House size={32} weight="duotone" />
          <div>
            <h1>Landlord Dashboard</h1>
            <p>Manage your property listings and bookings</p>
            {quotaInfo && (
              <p style={{ color: '#8696a0', marginTop: 4 }}>
                Quota: {quotaInfo.currentCount}/{quotaInfo.quota} {quotaInfo.pendingRequest ? '(pending increase request)' : ''}
              </p>
            )}
          </div>
        </div>
        
        {quotaInfo?.canCreate ? (
          <button className="btn-primary" onClick={() => setShowAddListingModal(true)}>
            <Plus size={20} weight="bold" />
            Add New Listing
          </button>
        ) : (
          <button className="btn-secondary" disabled={!!quotaInfo?.pendingRequest} onClick={handleRequestMore} title={quotaInfo?.pendingRequest ? 'You already have a pending request' : 'Ask admin to increase your listings limit'}>
            <TrendUp size={20} weight="bold" />
            {quotaInfo?.pendingRequest ? 'Request Submitted' : 'Request More Listings'}
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={view === 'dashboard' ? 'active' : ''} 
          onClick={() => setView('dashboard')}
        >
          <ChartBar size={20} />
          Overview
        </button>
        <button 
          className={view === 'listings' ? 'active' : ''} 
          onClick={() => setView('listings')}
        >
          <House size={20} />
          My Listings ({myListings.length})
        </button>
        <button 
          className={view === 'bookings' ? 'active' : ''} 
          onClick={() => setView('bookings')}
        >
          <Calendar size={20} />
          Booking Requests ({bookingRequests.filter(b => b.booking_status === 'pending').length})
        </button>
        <button 
          className={view === 'reminders' ? 'active' : ''} 
          onClick={() => setView('reminders')}
        >
          <EnvelopeSimple size={20} />
          Payment Reminders
        </button>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {view === 'dashboard' && stats && (
          <DashboardOverview stats={stats} listings={myListings} />
        )}
        
        {view === 'listings' && (
          <MyListings listings={myListings} onRefresh={loadDashboardData} getToken={getToken} />
        )}
        
        {view === 'bookings' && (
          <BookingRequests 
            bookings={bookingRequests}
            onApprove={handleApproveBooking}
            onReject={handleRejectBooking}
          />
        )}

        {view === 'reminders' && (
          <PaymentReminders
            getToken={getToken}
            showToast={showToast}
            settings={reminderSettings}
            onSettingsUpdate={loadReminderSettings}
            loading={loadingReminders}
          />
        )}
      </div>

      {/* Request More Listings Modal */}
      <RequestMoreListingsModal 
        open={showRequestModal} 
        onClose={() => { if (!requestSubmitting) { setShowRequestModal(false); setRequestForm({ requested_quota: '', reason: '' }); } }} 
        onSubmit={submitRequestMore} 
        form={requestForm} 
        setForm={setRequestForm} 
        pending={requestSubmitting}
      />

      {/* Add Listing Modal */}
      <AddListingModal
        open={showAddListingModal}
        onClose={() => setShowAddListingModal(false)}
        getToken={getToken}
        onSuccess={() => {
          setShowAddListingModal(false);
          loadDashboardData();
        }}
        showToast={showToast}
      />

      {/* Toast Notification */}
      <Toast 
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ visible: false, type: '', message: '' })}
      />
    </div>
  );
};

// Payment Reminders Component
const PaymentReminders = ({ getToken, showToast, settings, onSettingsUpdate, loading }) => {
  const [autoRemindersEnabled, setAutoRemindersEnabled] = useState(true);
  const [daysBefore, setDaysBefore] = useState(5);
  const [sendType, setSendType] = useState('now'); // now, scheduled
  const [subject, setSubject] = useState('Payment Reminder - Rent Due Soon');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [customMessage, setCustomMessage] = useState('');
  const [messageType, setMessageType] = useState('payment'); // payment, custom
  const [sending, setSending] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (settings) {
      setAutoRemindersEnabled(settings.auto_reminders_enabled ?? true);
      setDaysBefore(settings.days_before_month_end ?? 5);
      // If backend provides a default subject, use it
      if (settings.default_reminder_subject) setSubject(settings.default_reminder_subject);
    }
  }, [settings]);

  const saveAutoReminderSettings = async () => {
    setSavingSettings(true);
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:5000/api/rentals/landlord/reminder-settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          auto_reminders_enabled: autoRemindersEnabled,
          days_before_month_end: daysBefore
        })
      });

      if (res.ok) {
        showToast('success', 'Reminder settings saved successfully!');
        onSettingsUpdate();
      } else {
        showToast('error', 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('error', 'Error saving settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const sendReminder = async () => {
    if (messageType === 'custom' && !customMessage.trim()) {
      showToast('error', 'Please enter a custom message');
      return;
    }

    if (sendType === 'scheduled' && !scheduledDate) {
      showToast('error', 'Please select a date for scheduled sending');
      return;
    }

    setSending(true);
    try {
      const token = await getToken();
      const payload = {
        message_type: messageType,
        send_type: sendType,
        custom_message: messageType === 'custom' ? customMessage : null,
        scheduled_date: sendType === 'scheduled' ? scheduledDate : null,
        subject: subject,
        scheduled_time: sendType === 'scheduled' ? scheduledTime : null
      };

      const res = await fetch('http://localhost:5000/api/rentals/landlord/send-reminder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        if (sendType === 'now') {
          showToast('success', `Reminder sent to ${data.sent_count || 0} tenant(s)!`);
        } else {
          showToast('success', 'Reminder scheduled successfully!');
        }
        setCustomMessage('');
      } else {
        showToast('error', data.error || 'Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      showToast('error', 'Error sending reminder');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="reminders-loading">
        <div className="spinner"></div>
        <p>Loading reminder settings...</p>
      </div>
    );
  }

  return (
    <div className="payment-reminders">
      {/* Automatic Reminders Section */}
      <div className="reminders-section">
        <div className="section-header">
          <div className="section-header-content">
            <Lightning size={24} weight="duotone" className="section-icon" />
            <div>
              <h3>Automatic Payment Reminders</h3>
              <p>Set up automated email reminders for your tenants</p>
            </div>
          </div>
          <button
            className={`toggle-btn ${autoRemindersEnabled ? 'active' : ''}`}
            onClick={() => setAutoRemindersEnabled(!autoRemindersEnabled)}
          >
            {autoRemindersEnabled ? (
              <ToggleRight size={32} weight="fill" />
            ) : (
              <ToggleLeft size={32} weight="fill" />
            )}
          </button>
        </div>

        <div className="reminders-card">
          <div className="form-group">
            <label>
              <Clock size={18} weight="duotone" />
              Send reminder (days before month end)
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={daysBefore}
              onChange={(e) => setDaysBefore(parseInt(e.target.value) || 5)}
              disabled={!autoRemindersEnabled}
            />
            <small className="helper-text">
              Tenants will receive payment reminders {daysBefore} days before the end of each month
            </small>
          </div>

          <div className="reminder-preview">
            <h4>
              <EnvelopeSimple size={18} weight="duotone" />
              Preview: Automatic Reminder Email
            </h4>
            <div className="email-preview">
              <div className="email-subject">
                <strong>Subject:</strong> {subject}
              </div>
              <div className="email-body">
                <p>Dear Tenant,</p>
                <p>This is a friendly reminder that your monthly rent payment is due in {daysBefore} days.</p>
                <p><strong>Payment Details:</strong></p>
                <ul>
                  <li>Amount: KES [Monthly Rent]</li>
                  <li>Due Date: [End of Month]</li>
                  <li>Property: [Property Name]</li>
                </ul>
                <p>Please ensure timely payment to avoid any inconvenience.</p>
                <p>Thank you for your cooperation!</p>
              </div>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={saveAutoReminderSettings}
            disabled={savingSettings}
          >
            {savingSettings ? (
              <>
                <div className="spinner-small"></div>
                Saving...
              </>
            ) : (
              <>
                <Check size={20} weight="bold" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Manual Reminders Section */}
      <div className="reminders-section">
        <div className="section-header">
          <div className="section-header-content">
            <PaperPlaneTilt size={24} weight="duotone" className="section-icon" />
            <div>
              <h3>Send Manual Reminder</h3>
              <p>Send payment reminders or custom messages to your tenants</p>
            </div>
          </div>
        </div>

        <div className="reminders-card">
          {/* Message Type Selection */}
          <div className="form-group">
            <label>Message Type</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="messageType"
                  value="payment"
                  checked={messageType === 'payment'}
                  onChange={(e) => setMessageType(e.target.value)}
                />
                <Money size={18} weight="duotone" />
                Payment Reminder
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="messageType"
                  value="custom"
                  checked={messageType === 'custom'}
                  onChange={(e) => setMessageType(e.target.value)}
                />
                <ChatCircleText size={18} weight="duotone" />
                Custom Message
              </label>
            </div>
          </div>

          {/* Custom Message Input */}
          {messageType === 'custom' && (
            <>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>

              <div className="form-group">
                <label>Custom Message</label>
                <textarea
                  rows={6}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="E.g., Wishing you a Merry Christmas and a Happy New Year! Thank you for being a great tenant."
                />
                <small className="helper-text">
                  Write a personalized message for your tenants (greetings, announcements, etc.)
                </small>
              </div>
            </>
          )}

          {/* Send Type Selection */}
          <div className="form-group">
            <label>When to Send</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="sendType"
                  value="now"
                  checked={sendType === 'now'}
                  onChange={(e) => setSendType(e.target.value)}
                />
                <Lightning size={18} weight="duotone" />
                Send Now
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="sendType"
                  value="scheduled"
                  checked={sendType === 'scheduled'}
                  onChange={(e) => setSendType(e.target.value)}
                />
                <CalendarBlank size={18} weight="duotone" />
                Schedule for Later
              </label>
            </div>
          </div>

          {/* Scheduled Date/Time */}
          {sendType === 'scheduled' && (
            <div className="form-grid">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            className="btn-primary btn-send"
            onClick={sendReminder}
            disabled={sending}
          >
            {sending ? (
              <>
                <div className="spinner-small"></div>
                Sending...
              </>
            ) : (
              <>
                <PaperPlaneTilt size={20} weight="bold" />
                {sendType === 'now' ? 'Send Now' : 'Schedule Reminder'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="reminders-info">
        <Bell size={24} weight="duotone" />
        <div>
          <h4>How Payment Reminders Work</h4>
          <ul>
            <li>Automatic reminders are sent to all active tenants with approved bookings</li>
            <li>Manual reminders can be sent immediately or scheduled for a specific date/time</li>
            <li>Custom messages allow you to send greetings, announcements, or special notices</li>
            <li>All emails are sent from the Campus Life system with professional branding</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Toast Notification Component
const Toast = ({ visible, type, message, onClose }) => {
  if (!visible) return null;
  
  const icons = {
    success: <Check size={20} weight="bold" />,
    error: <X size={20} weight="bold" />,
    info: <Bell size={20} weight="bold" />
  };

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">
        {icons[type]}
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>
        <X size={16} weight="bold" />
      </button>
    </div>
  );
};

// Request More Listings Modal
const RequestMoreListingsModal = ({ open, onClose, onSubmit, form, setForm, pending }) => {
  if (!open) return null;
  const invalid = !form.requested_quota || parseInt(form.requested_quota) < 1;
  
  return (
    <div className="ld-modal-overlay" role="dialog" aria-modal="true" onClick={(e) => {
      if (e.target.className === 'ld-modal-overlay' && !pending) onClose();
    }}>
      <div className="ld-modal ld-modal-professional">
        <div className="ld-modal-header">
          <div className="ld-modal-header-content">
            <TrendUp size={24} weight="duotone" className="ld-modal-icon" />
            <h3>Request More Listings</h3>
          </div>
          <button className="ld-modal-close" onClick={onClose} disabled={pending}>
            <X size={20} weight="bold" />
          </button>
        </div>
        <div className="ld-modal-body">
          <p className="ld-modal-description">
            Request an increase in your listing quota. Our admin team will review your request and get back to you.
          </p>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Total Listings Desired *</label>
              <input 
                type="number" 
                min="1" 
                value={form.requested_quota}
                onChange={(e)=>setForm({ ...form, requested_quota: e.target.value })}
                placeholder="e.g., 5"
                className={invalid ? 'input-error' : ''}
                disabled={pending}
              />
              {invalid && (
                <small className="error-text">Please enter a number 1 or higher</small>
              )}
            </div>
            <div className="form-group full-width">
              <label>Reason (Optional)</label>
              <textarea 
                rows={4}
                value={form.reason}
                onChange={(e)=>setForm({ ...form, reason: e.target.value })}
                placeholder="Explain why you need more listings, e.g., additional properties available for rent..."
                disabled={pending}
              />
              <small className="helper-text">Help us understand your needs better</small>
            </div>
          </div>
        </div>
        <div className="ld-modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onSubmit} disabled={pending || invalid}>
            {pending ? (
              <>
                <div className="spinner-small"></div>
                Submitting...
              </>
            ) : (
              <>
                <Check size={20} weight="bold" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ stats, listings }) => {
  return (
    <div className="dashboard-overview">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0, 168, 132, 0.1)', color: '#00a884' }}>
            <House size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalListings}</h3>
            <p>Total Listings</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.activeBookings}</h3>
            <p>Active Bookings</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 193, 7, 0.1)', color: '#ffc107' }}>
            <Money size={24} />
          </div>
          <div className="stat-content">
            <h3>KES {stats.totalEarnings.toLocaleString()}</h3>
            <p>This Month</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(255, 87, 34, 0.1)', color: '#ff5722' }}>
            <Bell size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingRequests}</h3>
            <p>Pending Requests</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>Recent Listings</h3>
        <div className="activity-list">
          {listings.slice(0, 5).map(listing => (
            <div key={listing.id} className="activity-item">
              <div className="activity-icon">
                <House size={20} />
              </div>
              <div className="activity-content">
                <h4>{listing.title}</h4>
                <p>{listing.area_name} • {listing.available_rooms} rooms available</p>
              </div>
              <div className="activity-status">
                <span className={`status-badge ${listing.status}`}>
                  {listing.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// My Listings Component
const MyListings = ({ listings, onRefresh, getToken }) => {
  const [viewListing, setViewListing] = useState(null);
  const [editListing, setEditListing] = useState(null);
  const [editData, setEditData] = useState(null);
  const [editNewFiles, setEditNewFiles] = useState([]);

  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      const token = await getToken();
      await fetch(`http://localhost:5000/api/rentals/listings/${listingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await fetch(`http://localhost:5000/api/rentals/listings/${listingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        // Show success - would need to pass showToast as prop
        // For now using alert as fallback
        alert('Listing deleted successfully');
        delCacheByPrefix(`landlord:`);
        onRefresh();
      } else {
        alert('Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  };

  const openEdit = (l) => {
    setEditListing(l);
    setEditData({
      title: l.title || '',
      description: l.description || '',
      area_name: l.area_name || '',
      address: l.address || '',
      monthly_rent: l.monthly_rent || '',
      deposit: l.deposit || '',
      total_rooms: l.total_rooms || 1,
      available_rooms: l.available_rooms || l.total_rooms || 1,
      property_type: l.property_type || 'bedsitter',
      gender_restriction: l.gender_restriction || 'any',
      images: Array.isArray(l.images) ? [...l.images] : []
    });
    setEditNewFiles([]);
  };

  const saveEdit = async () => {
    if (!editListing || !editData) return;
    try {
      const token = await getToken();
      let finalImages = Array.isArray(editData.images) ? [...editData.images] : [];

      if (editNewFiles.length > 0) {
        const bucket = supabase.storage.from('rental-images');
        const uploads = [];
        const ts = Date.now();
        const basePath = `${editListing.landlord_phone || 'landlord'}/${editListing.id}`;
        const remaining = Math.max(0, 5 - finalImages.length);
        const filesToUpload = Array.from(editNewFiles).slice(0, remaining);
        filesToUpload.forEach((file, idx) => {
          const path = `${basePath}/${ts}_${idx}_${file.name}`;
          uploads.push(bucket.upload(path, file, { upsert: false }));
        });
        const results = await Promise.all(uploads);
        const uploadedUrls = results.map((r) => {
          if (r.error) throw r.error;
          const path = r.data.path;
          const { data: pub } = bucket.getPublicUrl(path);
          return pub.publicUrl;
        });
        finalImages = [...finalImages, ...uploadedUrls].slice(0, 5);
      }

      const res = await fetch(`http://localhost:5000/api/rentals/listings/${editListing.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...editData,
          total_rooms: parseInt(editData.total_rooms || 1),
          available_rooms: parseInt(editData.available_rooms || 1),
          monthly_rent: Number(editData.monthly_rent || 0),
          deposit: Number(editData.deposit || 0),
          images: finalImages
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to update listing${err?.error ? `: ${err.error}` : ''}`);
        return;
      }
      alert('Listing updated successfully');
      setEditListing(null);
      setEditData(null);
      setEditNewFiles([]);
      // invalidate caches for landlord and refresh
      delCacheByPrefix(`landlord:`);
      onRefresh();
    } catch (e) {
      console.error('Error updating listing:', e);
      alert('Error updating listing');
    }
  };

  return (
    <div className="my-listings">
      <div className="listings-list">
        {listings.map(listing => (
          <div key={listing.id} className="listing-item">
            <div className="listing-item-image">
              <img 
                src={listing.images?.[0] || 'https://via.placeholder.com/200'} 
                alt={listing.title}
              />
              <span className={`status-badge ${listing.status}`}>
                {listing.status}
              </span>
            </div>
            
            <div className="listing-item-content">
              <h3>{listing.title}</h3>
              <div className="listing-item-meta">
                <span><MapPin size={16} /> {listing.area_name}</span>
                <span><Money size={16} /> KES {listing.monthly_rent.toLocaleString()}/mo</span>
                <span><Eye size={16} /> {listing.views_count} views</span>
                {listing.average_rating > 0 && (
                  <span><Star size={16} weight="fill" /> {listing.average_rating.toFixed(1)}</span>
                )}
              </div>
              <div className="listing-item-availability">
                <Users size={16} />
                {listing.available_rooms} / {listing.total_rooms} rooms available
              </div>
            </div>

            <div className="listing-item-actions">
              {/** Determine if listing has any bookings to lock destructive actions */}
              {(() => { /* inline IIFE for simple derivation without changing structure */ return null; })()}
              <button type="button" className="btn-icon" title="Edit" aria-label="Edit listing" onClick={() => openEdit(listing)}>
                ✏️
                {/* <Pencil size={20} weight="fill" style={{ color: '#e9edef' }} /> */}
              </button>
              <button type="button" className="btn-icon" title="View" aria-label="View listing" onClick={() => setViewListing(listing)}>
                👁️
                {/* <Eye size={20} weight="fill" style={{ color: '#e9edef' }} /> */}
              </button>
              <button 
                type="button"
                className="btn-icon delete"
                title={(listing?.rental_bookings?.[0]?.count || 0) > 0 ? 'Cannot delete: listing has bookings' : 'Delete'}
                aria-label="Delete listing"
                disabled={(listing?.rental_bookings?.[0]?.count || 0) > 0}
                onClick={() => {
                  if ((listing?.rental_bookings?.[0]?.count || 0) > 0) return;
                  handleDelete(listing.id);
                }}
              >
                🗑
                {/* <Trash size={20} weight="fill" style={{ color: '#f44336' }} /> */}
              </button>
            </div>
          </div>
        ))}
      </div>

      {viewListing && (
        <div className="ld-modal-overlay" role="dialog" aria-modal="true">
          <div className="ld-modal">
            <div className="ld-modal-header">
              <h3>{viewListing.title}</h3>
              <button className="ld-modal-close" onClick={() => setViewListing(null)}>✕</button>
            </div>
            <div className="ld-modal-body">
              <div className="ld-modal-grid">
                <div className="ld-modal-image">
                  <img src={viewListing.images?.[0] || 'https://via.placeholder.com/640x360'} alt={viewListing.title} />
                </div>
                <div className="ld-modal-details">
                  <p>{viewListing.description}</p>
                  <div className="ld-detail-row"><strong>Area:</strong> {viewListing.area_name}</div>
                  <div className="ld-detail-row"><strong>Address:</strong> {viewListing.address}</div>
                  <div className="ld-detail-row"><strong>Type:</strong> {viewListing.property_type.replace('_',' ')}</div>
                  <div className="ld-detail-row"><strong>Rent:</strong> KES {Number(viewListing.monthly_rent).toLocaleString()}</div>
                  <div className="ld-detail-row"><strong>Deposit:</strong> KES {Number(viewListing.deposit).toLocaleString()}</div>
                  <div className="ld-detail-row"><strong>Rooms:</strong> {viewListing.available_rooms}/{viewListing.total_rooms}</div>
                  {viewListing.distance_from_gate && (
                    <div className="ld-detail-row"><strong>Distance:</strong> {viewListing.distance_from_gate} km</div>
                  )}
                </div>
              </div>
            </div>
            <div className="ld-modal-actions">
              <button className="btn-secondary" onClick={() => setViewListing(null)}>Close</button>
              <button className="btn-primary" onClick={() => { setViewListing(null); openEdit(viewListing); }}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {editListing && editData && (
        <div className="ld-modal-overlay" role="dialog" aria-modal="true">
          <div className="ld-modal">
            <div className="ld-modal-header">
              <h3>Edit Listing</h3>
              <button className="ld-modal-close" onClick={() => { setEditListing(null); setEditData(null); setEditNewFiles([]); }}>✕</button>
            </div>
            <div className="ld-modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={editData.title} onChange={e=>setEditData({...editData, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Area</label>
                  <input type="text" value={editData.area_name} onChange={e=>setEditData({...editData, area_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input type="text" value={editData.address} onChange={e=>setEditData({...editData, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Monthly Rent (KES)</label>
                  <input type="number" value={editData.monthly_rent} onChange={e=>setEditData({...editData, monthly_rent: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Deposit (KES)</label>
                  <input type="number" value={editData.deposit} onChange={e=>setEditData({...editData, deposit: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea rows={4} value={editData.description} onChange={e=>setEditData({...editData, description: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Total Rooms</label>
                  <input type="number" min="1" value={editData.total_rooms} onChange={e=>setEditData({...editData, total_rooms: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Available Rooms</label>
                  <input type="number" min="0" value={editData.available_rooms} readOnly disabled />
                  <small style={{ color: '#8696a0' }}>Managed automatically by booking approvals/cancellations.</small>
                </div>

                <div className="form-group full-width">
                  <label>Photos (max 5)</label>
                  <div className="ld-images-grid">
                    {(editData.images || []).map((url, idx) => (
                      <div key={idx} className="ld-image-item">
                        <img src={url} alt={`img-${idx}`} />
                        <button type="button" className="ld-image-remove" onClick={() => {
                          const next = [...(editData.images || [])];
                          next.splice(idx, 1);
                          setEditData({ ...editData, images: next });
                        }}>✕</button>
                      </div>
                    ))}
                    {(editData.images?.length || 0) < 5 && (
                      <label className="ld-image-upload">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const remaining = 5 - (editData.images?.length || 0);
                            const next = [...editNewFiles, ...files].slice(0, remaining);
                            setEditNewFiles(next);
                          }}
                          style={{ display: 'none' }}
                        />
                        <span>+ Add Photos ({editNewFiles.length})</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="ld-modal-actions">
              <button className="btn-secondary" onClick={() => { setEditListing(null); setEditData(null); }}>Cancel</button>
              <button className="btn-primary" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Booking Requests Component
const BookingRequests = ({ bookings, onApprove, onReject }) => {
  return (
    <div className="booking-requests">
      {bookings.length === 0 ? (
        <div className="empty-state">
          <Calendar size={64} weight="light" />
          <h3>No Booking Requests</h3>
          <p>You'll see booking requests here when students apply</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map(booking => (
            <div key={booking.id} className="booking-item">
              <div className="booking-header">
                <div className="booking-property">
                  <img 
                    src={booking.rental_listings?.images?.[0] || 'https://via.placeholder.com/100'} 
                    alt="Property"
                  />
                  <div>
                    <h4>{booking.rental_listings?.title}</h4>
                    <p>KES {booking.total_amount.toLocaleString()}</p>
                  </div>
                </div>
                <span className={`status-badge ${booking.booking_status}`}>
                  {booking.booking_status}
                </span>
              </div>

              <div className="booking-details">
                <div className="detail-item student">
                  <label>Student:</label>
                  {(() => {
                    const s = booking.student || {};
                    const displayName = s.name || s.email || 'N/A';
                    const phone = s.phone || booking.payment_phone || 'N/A';
                    const avatar = s.avatar_url || '';
                    const initials = (displayName || 'S').trim().charAt(0).toUpperCase();
                    return (
                      <div className="student-info">
                        {avatar ? (
                          <img className="student-avatar" src={avatar} alt={displayName} />
                        ) : (
                          <div className="student-avatar placeholder">{initials}</div>
                        )}
                        <div className="student-meta">
                          <div className="student-name">{displayName}</div>
                          <div className="student-phone">{phone}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="detail-item">
                  <label>Move-in Date:</label>
                  <span>{new Date(booking.move_in_date).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <label>Duration:</label>
                  <span>{booking.duration_months} months</span>
                </div>
                {booking.is_group_booking && (
                  <div className="detail-item">
                    <label>Group Booking:</label>
                    <span>Yes ({booking.group_members?.length || 0} members)</span>
                  </div>
                )}
              </div>

              {booking.booking_status === 'pending' && (
                <div className="booking-actions">
                  <button 
                    className="btn-approve"
                    onClick={() => onApprove(booking.id)}
                  >
                    <Check size={18} weight="bold" />
                    Approve
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => onReject(booking.id)}
                  >
                    <X size={18} weight="bold" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Add Listing Modal Component
const AddListingModal = ({ open, onClose, getToken, onSuccess, showToast }) => {
  if (!open) return null;

  return (
    <div className="ld-modal-overlay" role="dialog" aria-modal="true" onClick={(e) => {
      if (e.target.className === 'ld-modal-overlay') onClose();
    }}>
      <div className="ld-modal ld-modal-large ld-modal-professional">
        <AddListingFormContent 
          getToken={getToken}
          onSuccess={onSuccess}
          showToast={showToast}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

// Add Listing Form Content Component
const AddListingFormContent = ({ getToken, onSuccess, showToast, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'bedsitter',
    address: '',
    area_name: '',
    university_id: '',
    distance_from_gate: '',
    walking_minutes: '',
    monthly_rent: '',
    deposit: '',
    total_rooms: 1,
    available_rooms: 1,
    landlord_name: '',
    landlord_phone: '',
    has_wifi: false,
    has_24h_water: false,
    has_24h_electricity: false,
    has_security: false,
    gender_restriction: 'any'
  });

  const [submitting, setSubmitting] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [listingFee, setListingFee] = useState({ amountKes: 0, currency: 'KES', loading: true, error: null });
  const [paymentRef, setPaymentRef] = useState(null);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cacheKey = 'universities';
        const cached = getCache(cacheKey);
        if (cached) {
          setUniversities(cached);
        } else {
          const res = await fetch('http://localhost:5000/api/rentals/universities');
          const data = await res.json();
          if (data.success) {
            setUniversities(data.universities);
            setCache(cacheKey, data.universities, 1000 * 60 * 60 * 6);
          }
        }
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setListingFee(prev => ({ ...prev, loading: true, error: null }));
        const token = await getToken();
        if (!token) {
          setListingFee({ amountKes: 0, currency: 'KES', loading: false, error: 'Not authenticated' });
          return;
        }

        const res = await fetch('http://localhost:5000/api/rentals/me/platform-settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const js = await res.json().catch(() => ({}));

        if (!res.ok || !js.success) {
          setListingFee({ amountKes: 0, currency: 'KES', loading: false, error: js.error || 'Failed to load listing fee' });
          return;
        }

        const fee = typeof js.listingFeeKes === 'number' ? js.listingFeeKes : parseInt(js.listingFeeKes, 10) || 0;
        setListingFee({
          amountKes: fee,
          currency: js.currency || 'KES',
          loading: false,
          error: null
        });
      } catch (e) {
        console.error('Error loading landlord listing fee:', e);
        setListingFee({ amountKes: 0, currency: 'KES', loading: false, error: 'Failed to load listing fee' });
      }
    })();
  }, [getToken]);

  const handleStartPayment = async () => {
    if (!listingFee.amountKes || listingFee.amountKes <= 0) return;

    try {
      setPaymentLoading(true);
      setPaymentError(null);
      const token = await getToken();
      if (!token) {
        setPaymentError('Session expired. Please sign in again.');
        return;
      }

      const res = await fetch('http://localhost:5000/api/rentals/landlord/listing-fee/paystack/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      const js = await res.json().catch(() => ({}));
      if (!res.ok || !js.success) {
        setPaymentError(js.error || 'Failed to start payment. Please try again.');
        return;
      }

      if (!js.authorizationUrl || !js.reference) {
        setPaymentError('Invalid Paystack initialize response.');
        return;
      }

      setPaymentRef(js.reference);
      setAwaitingPayment(true);
      setPaymentVerified(false);

      try {
        window.open(js.authorizationUrl, '_blank', 'noopener,noreferrer');
      } catch (_) {
        window.location.href = js.authorizationUrl;
      }
    } catch (e) {
      console.error('Listing fee payment init failed', e);
      setPaymentError('Failed to start payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!paymentRef) return;

    try {
      setPaymentLoading(true);
      setPaymentError(null);
      const token = await getToken();
      if (!token) {
        setPaymentError('Session expired. Please sign in again.');
        return;
      }

      const res = await fetch('http://localhost:5000/api/rentals/landlord/listing-fee/paystack/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reference: paymentRef })
      });

      const js = await res.json().catch(() => ({}));
      if (!res.ok || !js.success) {
        setPaymentError(js.error || 'Verification failed. Please try again.');
        return;
      }

      setAwaitingPayment(false);
      setPaymentVerified(true);
      setPaymentRef(null);
      showToast('success', 'Listing fee payment verified. You can now create your listing.');
    } catch (e) {
      console.error('Listing fee payment verify failed', e);
      setPaymentError('Failed to verify payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (listingFee.amountKes > 0 && !paymentVerified) {
      showToast('error', 'Please complete and verify the listing fee payment before creating a listing.');
      return;
    }
    setSubmitting(true);

    try {
      const token = await getToken();
      let imageUrls = [];
      if (imageFiles.length > 0) {
        const bucket = supabase.storage.from('rental-images');
        const uploads = [];
        const ts = Date.now();
        imageFiles.slice(0, 5).forEach((file, idx) => {
          const path = `${formData.landlord_phone || 'landlord'}/${ts}_${idx}_${file.name}`;
          uploads.push(bucket.upload(path, file, { upsert: false }));
        });
        const results = await Promise.all(uploads);
        const publicUrls = results.map((r, idx) => {
          if (r.error) throw r.error;
          const path = r.data.path;
          const { data: pub } = bucket.getPublicUrl(path);
          return pub.publicUrl;
        });
        imageUrls = publicUrls;
      }
      const res = await fetch('http://localhost:5000/api/rentals/listings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          images: imageUrls
        })
      });

      if (res.ok) {
        const result = await res.json().catch(() => ({}));
        console.log('📧 Listing creation response:', result);
        showToast('success', 'Listing created successfully! Awaiting admin approval.');
        onSuccess();
      } else {
        const err = await res.json().catch(() => ({}));
        const errorMsg = err?.error || 'Failed to create listing';
        showToast('error', errorMsg);
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Error creating listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="ld-modal-header">
        <div className="ld-modal-header-content">
          <Plus size={24} weight="duotone" className="ld-modal-icon" />
          <h3>Add New Property Listing</h3>
        </div>
        <button className="ld-modal-close" onClick={onCancel} disabled={submitting}>
          <X size={20} weight="bold" />
        </button>
      </div>
      
      <div className="ld-modal-body">
        <p className="ld-modal-description">
          Fill in the details below to create a new rental listing. All fields marked with * are required.
        </p>

        <form onSubmit={handleSubmit} id="add-listing-form">
        <div className="form-grid">
          <div className="form-group">
            <label>University *</label>
            <select
              required
              value={formData.university_id}
              onChange={(e) => setFormData({ ...formData, university_id: e.target.value })}
            >
              <option value="">Select University</option>
              {universities.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Property Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Modern Bedsitter Near JKUAT"
            />
          </div>

          <div className="form-group">
            <label>Property Type *</label>
            <select
              value={formData.property_type}
              onChange={(e) => setFormData({...formData, property_type: e.target.value})}
            >
              <option value="bedsitter">Bedsitter</option>
              <option value="single">Single Room</option>
              <option value="one_bedroom">One Bedroom</option>
              <option value="shared_2">Sharing (2 people)</option>
              <option value="shared_3">Sharing (3 people)</option>
              <option value="shared_4">Sharing (4 people)</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label>Description *</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe your property, amenities, rules..."
            />
          </div>

          <div className="form-group">
            <label>Area Name *</label>
            <input
              type="text"
              required
              value={formData.area_name}
              onChange={(e) => setFormData({...formData, area_name: e.target.value})}
              placeholder="e.g., Juja, Gate B"
            />
          </div>

          <div className="form-group">
            <label>Full Address *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Complete address"
            />
          </div>

          <div className="form-group">
            <label>Distance from University Gate (km)</label>
            <input
              type="number"
              step="0.1"
              value={formData.distance_from_gate}
              onChange={(e) => setFormData({...formData, distance_from_gate: e.target.value})}
              placeholder="e.g., 1.5"
            />
          </div>

          <div className="form-group">
            <label>Walking Time (minutes)</label>
            <input
              type="number"
              value={formData.walking_minutes}
              onChange={(e) => setFormData({...formData, walking_minutes: e.target.value})}
              placeholder="e.g., 15"
            />
          </div>

          <div className="form-group">
            <label>Monthly Rent (KES) *</label>
            <input
              type="number"
              required
              value={formData.monthly_rent}
              onChange={(e) => setFormData({...formData, monthly_rent: e.target.value})}
              placeholder="e.g., 8000"
            />
          </div>

          <div className="form-group">
            <label>Deposit (KES) *</label>
            <input
              type="number"
              required
              value={formData.deposit}
              onChange={(e) => setFormData({...formData, deposit: e.target.value})}
              placeholder="e.g., 8000"
            />
          </div>

          <div className="form-group">
            <label>Total Rooms *</label>
            <input
              type="number"
              required
              min="1"
              value={formData.total_rooms}
              onChange={(e) => setFormData({...formData, total_rooms: parseInt(e.target.value), available_rooms: parseInt(e.target.value)})}
            />
          </div>

          <div className="form-group">
            <label>Your Name *</label>
            <input
              type="text"
              required
              value={formData.landlord_name}
              onChange={(e) => setFormData({...formData, landlord_name: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Contact Phone *</label>
            <input
              type="tel"
              required
              value={formData.landlord_phone}
              onChange={(e) => setFormData({...formData, landlord_phone: e.target.value})}
              placeholder="07XXXXXXXX"
            />
          </div>

          <div className="form-group full-width">
            <label>Property Images (max 5)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const next = [...imageFiles, ...files].slice(0, 5);
                setImageFiles(next);
              }}
            />
            <small>{imageFiles.length}/5 selected</small>
          </div>

          <div className="form-group">
            <label>Gender Restriction</label>
            <select
              value={formData.gender_restriction}
              onChange={(e) => setFormData({...formData, gender_restriction: e.target.value})}
            >
              <option value="any">Any</option>
              <option value="male_only">Male Only</option>
              <option value="female_only">Female Only</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label>Amenities</label>
            <div className="checkbox-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.has_wifi}
                  onChange={(e) => setFormData({...formData, has_wifi: e.target.checked})}
                />
                Wi-Fi
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.has_24h_water}
                  onChange={(e) => setFormData({...formData, has_24h_water: e.target.checked})}
                />
                24/7 Water
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.has_24h_electricity}
                  onChange={(e) => setFormData({...formData, has_24h_electricity: e.target.checked})}
                />
                24/7 Electricity
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.has_security}
                  onChange={(e) => setFormData({...formData, has_security: e.target.checked})}
                />
                Security
              </label>
            </div>
          </div>

          <div className="form-group full-width">
            <label>Listing Fee</label>
            <div className="ld-listing-fee-row">
              <div>
                {listingFee.loading ? (
                  <span className="status-badge info">Loading fee...</span>
                ) : listingFee.error ? (
                  <span className="status-badge error">{listingFee.error}</span>
                ) : listingFee.amountKes > 0 ? (
                  <span className="status-badge warning">
                    Listing fee: {listingFee.currency} {listingFee.amountKes.toLocaleString()} per listing
                  </span>
                ) : (
                  <span className="status-badge success">Listings are currently free</span>
                )}
                {listingFee.amountKes > 0 && (
                  <p className="helper-text" style={{ marginTop: 6 }}>
                    You must pay this one-time fee before creating this listing. 
                  </p>
                )}
              </div>

              {listingFee.amountKes > 0 && (
                <div className="ld-payment-actions">
                  {!paymentVerified && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleStartPayment}
                      disabled={paymentLoading || listingFee.loading}
                    >
                      {paymentLoading && awaitingPayment ? 'Payment in progress...' : 'Pay For This Rental Listing'}
                    </button>
                  )}
                  {awaitingPayment && !paymentVerified && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleVerifyPayment}
                      disabled={paymentLoading}
                      style={{ marginLeft: 8 }}
                    >
                      {paymentLoading && !paymentRef ? 'Verifying...' : 'Verify Payment'}
                    </button>
                  )}
                  {paymentVerified && (
                    <span className="status-badge success" style={{ marginLeft: 8 }}>
                      Payment verified
                    </span>
                  )}
                </div>
              )}
            </div>
            {paymentError && (
              <div className="error-text" style={{ marginTop: 6 }}>{paymentError}</div>
            )}
          </div>
        </div>

        </form>
      </div>
      
      <div className="ld-modal-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          <X size={20} weight="bold" />
          Cancel
        </button>
        <button
          type="submit"
          form="add-listing-form"
          className="btn-primary"
          disabled={submitting || (listingFee.amountKes > 0 && !paymentVerified)}
        >
          {submitting ? (
            <>
              <div className="spinner-small"></div>
              Creating Listing...
            </>
          ) : (
            <>
              <Check size={20} weight="bold" />
              Create Listing
            </>
          )}
        </button>
      </div>
    </>
  );
};
