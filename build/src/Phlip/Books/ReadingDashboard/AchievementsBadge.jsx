import React, { useState, useEffect } from 'react';
import { FiAward, FiLock } from 'react-icons/fi';
import './AchievementsBadge.css';

const AchievementsBadge = ({ userId, achievements }) => {
  const [allAchievements, setAllAchievements] = useState([]);
  const [filter, setFilter] = useState('all'); // all, earned, locked

  useEffect(() => {
    fetchAllAchievements();
  }, []);

  const fetchAllAchievements = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/reading/achievements/${userId}`);
      const data = await response.json();
      if (data.ok) {
        setAllAchievements(data.allAchievements);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const earnedCodes = new Set(achievements.map(a => a.achievement_code));

  const getTierColor = (tier) => {
    switch (tier) {
      case 'bronze': return '#cd7f32';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      case 'platinum': return '#e5e4e2';
      default: return '#8696a0';
    }
  };

  const getTierGlow = (tier) => {
    switch (tier) {
      case 'bronze': return '0 0 10px rgba(205, 127, 50, 0.5)';
      case 'silver': return '0 0 10px rgba(192, 192, 192, 0.5)';
      case 'gold': return '0 0 15px rgba(255, 215, 0, 0.6)';
      case 'platinum': return '0 0 20px rgba(229, 228, 226, 0.8)';
      default: return 'none';
    }
  };

  const filteredAchievements = allAchievements.filter(achievement => {
    const isEarned = earnedCodes.has(achievement.code);
    if (filter === 'earned') return isEarned;
    if (filter === 'locked') return !isEarned;
    return true;
  });

  const earnedCount = achievements.length;
  const totalCount = allAchievements.length;
  const completionPercent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  return (
    <div className="achievements-container">
      {/* Header Stats */}
      <div className="achievements-header">
        <div className="achievements-title">
          <FiAward size={32} color="#ffd700" />
          <h2>Achievements</h2>
        </div>
        
        <div className="achievements-progress">
          <div className="progress-circle">
            <svg width="120" height="120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#2a3942"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#00a884"
                strokeWidth="8"
                strokeDasharray={`${(completionPercent / 100) * 314} 314`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="progress-text">
              <div className="progress-percent">{completionPercent}%</div>
              <div className="progress-count">{earnedCount}/{totalCount}</div>
            </div>
          </div>
          <div className="progress-stats">
            <div>🏆 {earnedCount} Unlocked</div>
            <div>🔒 {totalCount - earnedCount} Locked</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="achievements-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({totalCount})
        </button>
        <button 
          className={`filter-btn ${filter === 'earned' ? 'active' : ''}`}
          onClick={() => setFilter('earned')}
        >
          Earned ({earnedCount})
        </button>
        <button 
          className={`filter-btn ${filter === 'locked' ? 'active' : ''}`}
          onClick={() => setFilter('locked')}
        >
          Locked ({totalCount - earnedCount})
        </button>
      </div>

      {/* Achievements Grid */}
      <div className="achievements-grid">
        {filteredAchievements.map(achievement => {
          const isEarned = earnedCodes.has(achievement.code);
          const earnedData = achievements.find(a => a.achievement_code === achievement.code);
          
          return (
            <div 
              key={achievement.code}
              className={`achievement-card ${isEarned ? 'earned' : 'locked'}`}
              style={{
                borderColor: isEarned ? getTierColor(achievement.tier) : '#2a3942'
              }}
            >
              {isEarned && (
                <div className="achievement-glow" style={{ boxShadow: getTierGlow(achievement.tier) }}></div>
              )}
              
              <div className="achievement-icon-large" style={{
                opacity: isEarned ? 1 : 0.3
              }}>
                {isEarned ? achievement.icon : '🔒'}
              </div>

              <div className="achievement-tier" style={{
                color: isEarned ? getTierColor(achievement.tier) : '#8696a0'
              }}>
                {achievement.tier.toUpperCase()}
              </div>

              <div className="achievement-title">
                {achievement.title}
              </div>

              <div className="achievement-description">
                {achievement.description}
              </div>

              {isEarned && earnedData && (
                <div className="achievement-earned-date">
                  Earned: {new Date(earnedData.earned_at).toLocaleDateString()}
                </div>
              )}

              {!isEarned && (
                <div className="achievement-requirement">
                  🎯 {getRequirementText(achievement.requirement)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="no-achievements">
          <FiLock size={48} color="#8696a0" />
          <p>No achievements in this category</p>
        </div>
      )}
    </div>
  );
};

const getRequirementText = (requirement) => {
  switch (requirement.type) {
    case 'books_completed':
      return `Complete ${requirement.count} books`;
    case 'monthly_books':
      return `Complete ${requirement.count} books in a month`;
    case 'streak':
      return `Maintain ${requirement.days}-day reading streak`;
    case 'genres':
      return `Read books from ${requirement.count} different genres`;
    case 'early_year':
      return `Complete ${requirement.count} books before March`;
    case 'goal_achieved':
      return `Achieve your yearly reading goal`;
    case 'goal_exceeded':
      return `Exceed your yearly goal by ${requirement.percent - 100}%`;
    default:
      return 'Special achievement';
  }
};

export default AchievementsBadge;
