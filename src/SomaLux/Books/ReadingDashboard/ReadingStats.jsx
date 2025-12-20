import React from 'react';
import { FiBook, FiFileText, FiCompass, FiTrendingUp, FiZap } from 'react-icons/fi';
import './ReadingStats.css';

const ReadingStats = ({ stats }) => {
  if (!stats) return null;

  const { overall, streak } = stats;

  const statCards = [
    {
      icon: <FiBook size={28} color="#00a884" />,
      label: 'Books Completed',
      value: overall?.total_books_completed || 0,
      subtext: `${overall?.total_books_started || 0} in progress`,
      color: '#00a884'
    },
    {
      icon: <FiFileText size={28} color="#6366f1" />,
      label: 'Pages Read',
      value: (overall?.total_pages_read || 0).toLocaleString(),
      subtext: `~${Math.round((overall?.avg_pages_per_book || 0))} avg per book`,
      color: '#6366f1'
    },
    {
      icon: <FiCompass size={28} color="#f59e0b" />,
      label: 'Genres Explored',
      value: overall?.genres_explored || 0,
      subtext: 'Different categories',
      color: '#f59e0b'
    },
    {
      icon: <FiZap size={28} color="#ef4444" />,
      label: 'Current Streak',
      value: `${streak?.current_streak || 0} days`,
      subtext: `Best: ${streak?.longest_streak || 0} days`,
      color: '#ef4444'
    }
  ];

  return (
    <div className="reading-stats-container">
      <h2>Your Reading Stats</h2>
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className="stat-card"
            style={{ borderTop: `4px solid ${card.color}` }}
          >
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
              <div className="stat-subtext">{card.subtext}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Reading Level */}
      <div className="reading-level-section">
        <h3>Reading Level</h3>
        <div className="reading-level-card">
          {getReadingLevel(overall?.total_books_completed || 0)}
        </div>
      </div>
    </div>
  );
};

const getReadingLevel = (booksRead) => {
  let level, title, nextLevel, booksToNext, icon;

  if (booksRead < 5) {
    level = 1;
    title = "Beginner";
    nextLevel = "Bookworm";
    booksToNext = 5 - booksRead;
    icon = "📖";
  } else if (booksRead < 20) {
    level = 2;
    title = "Bookworm";
    nextLevel = "Reader";
    booksToNext = 20 - booksRead;
    icon = "🐛";
  } else if (booksRead < 50) {
    level = 3;
    title = "Reader";
    nextLevel = "Scholar";
    booksToNext = 50 - booksRead;
    icon = "📚";
  } else if (booksRead < 100) {
    level = 4;
    title = "Scholar";
    nextLevel = "Master";
    booksToNext = 100 - booksRead;
    icon = "🎓";
  } else {
    level = 5;
    title = "Master Reader";
    nextLevel = null;
    booksToNext = 0;
    icon = "🏆";
  }

  return (
    <div className="level-display">
      <div className="level-icon">{icon}</div>
      <div className="level-info">
        <div className="level-title">
          Level {level}: {title}
        </div>
        {nextLevel && (
          <div className="level-progress-text">
            {booksToNext} books until {nextLevel}
          </div>
        )}
        {!nextLevel && (
          <div className="level-progress-text max-level">
            🎉 Maximum Level Reached!
          </div>
        )}
      </div>
      {nextLevel && (
        <div className="level-progress-bar">
          <div 
            className="level-progress-fill"
            style={{ width: `${((booksRead % (level * 20)) / (level * 20)) * 100}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default ReadingStats;
