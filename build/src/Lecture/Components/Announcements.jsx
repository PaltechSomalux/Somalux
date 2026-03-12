import React, { useState, useEffect } from 'react';
import moment from 'moment';
import "./Announcements.css";

export const Announcements = ({ announcements: initialAnnouncements = [] }) => {
  // Load from localStorage or initial props
  const [announcements, setAnnouncements] = useState(() => {
    const saved = localStorage.getItem('announcements');
    return saved ? JSON.parse(saved) : initialAnnouncements;
  });
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    course: '',
    content: '',
    pinned: false
  });
  const [searchText, setSearchText] = useState('');

  // Save to localStorage whenever announcements change
  useEffect(() => {
    localStorage.setItem('announcements', JSON.stringify(announcements));
  }, [announcements]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    const announcement = currentAnnouncement 
      ? {
          ...currentAnnouncement,
          ...formData,
          date: moment().format('YYYY-MM-DD')
        }
      : {
          id: Date.now(), // Using timestamp for better unique IDs
          title: formData.title,
          course: formData.course,
          content: formData.content,
          pinned: formData.pinned,
          date: moment().format('YYYY-MM-DD'),
          author: 'Prof. Smith'
        };

    const updatedAnnouncements = currentAnnouncement
      ? announcements.map(a => a.id === currentAnnouncement.id ? announcement : a)
      : [announcement, ...announcements];

    setAnnouncements(updatedAnnouncements);
    setIsModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      course: '',
      content: '',
      pinned: false
    });
    setCurrentAnnouncement(null);
  };

  const handleEdit = (announcement) => {
    setCurrentAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      course: announcement.course,
      content: announcement.content,
      pinned: announcement.pinned || false
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      const updatedAnnouncements = announcements.filter(a => a.id !== id);
      setAnnouncements(updatedAnnouncements);
    }
  };

  const togglePin = (id) => {
    const updatedAnnouncements = announcements.map(a => 
      a.id === id ? { ...a, pinned: !a.pinned } : a
    );
    setAnnouncements(updatedAnnouncements);
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      announcement.title.toLowerCase().includes(searchLower) ||
      announcement.content.toLowerCase().includes(searchLower) ||
      (announcement.course && announcement.course.toLowerCase().includes(searchLower))
    );
  });

  const renderAnnouncementCard = (announcement) => (
    <div key={announcement.id} className={`announcement-card ${announcement.pinned ? 'pinned' : ''}`}>
      <div className="announcement-header">
        <h4>{announcement.title}</h4>
        {announcement.pinned && <span className="pinned-badge">📌 Pinned</span>}
      </div>
      <div className="announcement-content">
        {announcement.content}
      </div>
      <div className="announcement-footer">
        {announcement.course && <span>{announcement.course}</span>}
        <span>Posted {moment(announcement.date).fromNow()}</span>
        <span>By {announcement.author || 'Unknown'}</span>
      </div>
      <div className="announcement-actions">
        <button 
          className="action-btn"
          onClick={() => handleEdit(announcement)}
        >
          Edit
        </button>
        <button 
          className="action-btn"
          onClick={() => togglePin(announcement.id)}
        >
          {announcement.pinned ? 'Unpin' : 'Pin'}
        </button>
        <button 
          className="action-btn danger"
          onClick={() => handleDelete(announcement.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );

  const renderModal = () => (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{currentAnnouncement ? 'Edit Announcement' : 'Create Announcement'}</h3>
          <button 
            className="close-btn" 
            onClick={() => {
              setIsModalVisible(false);
              resetForm();
            }}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Title*</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Announcement title"
              required
            />
          </div>
          <div className="form-group">
            <label>Course</label>
            <input
              type="text"
              name="course"
              value={formData.course}
              onChange={handleInputChange}
              placeholder="Course code (optional)"
            />
          </div>
          <div className="form-group">
            <label>Content*</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Announcement content"
              required
              rows={5}
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="pinned"
                checked={formData.pinned}
                onChange={handleInputChange}
              />
              Pin this announcement
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button 
            className="secondary-btn"
            onClick={() => {
              setIsModalVisible(false);
              resetForm();
            }}
          >
            Cancel
          </button>
          <button 
            className="primary-btn"
            onClick={handleSubmit}
            disabled={!formData.title.trim() || !formData.content.trim()}
          >
            {currentAnnouncement ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="announcements-view">
      <div className="section-header">
        <h2>Announcements</h2>
        <div className="header-actions">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button className="search-btn">🔍</button>
          </div>
          <button 
            className="primary-btn"
            onClick={() => setIsModalVisible(true)}
          >
            + Create Announcement
          </button>
        </div>
      </div>

      <div className="announcements-grid">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements
            .sort((a, b) => {
              // Pinned announcements first, then by date (newest first)
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              return moment(b.date).unix() - moment(a.date).unix();
            })
            .map(renderAnnouncementCard)
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📢</div>
            <p>
              {searchText 
                ? `No announcements found matching "${searchText}"`
                : 'No announcements yet. Create one to get started!'}
            </p>
          </div>
        )}
      </div>

      {isModalVisible && renderModal()}
    </div>
  );
};