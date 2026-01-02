import React, { useEffect, useState, useMemo } from 'react';
import { FiBook, FiDownload, FiStar, FiSearch, FiTrendingUp, FiHeart, FiUsers, FiMessageSquare, FiThumbsUp } from 'react-icons/fi';
import { MdFavoriteBorder } from 'react-icons/md';
import { fetchStats } from '../api';
import { getAllAuthorsEngagementStats } from '../authorInteractionsApi';
import './Authors.css';

const Authors = () => {
  const [stats, setStats] = useState(null);
  const [engagementStats, setEngagementStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('engagement');
  const [timeRange, setTimeRange] = useState('monthly');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [statsData, engageData] = await Promise.all([
          fetchStats(),
          getAllAuthorsEngagementStats(100)
        ]);
        
        setStats(statsData);
        
        // Create engagement stats map for quick lookup by author name
        const engageMap = {};
        engageData.forEach(stat => {
          engageMap[stat.author_name] = stat;
        });
        setEngagementStats(engageMap);
      } catch (error) {
        console.error('Failed to load authors stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredAndSorted = useMemo(() => {
    if (!stats || !stats.authors) return [];

    let filtered = stats.authors.filter(author =>
      author.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      const authorEngageA = engagementStats[a.name] || {};
      const authorEngageB = engagementStats[b.name] || {};

      switch (sortBy) {
        case 'engagement':
          return (authorEngageB.engagement_score || 0) - (authorEngageA.engagement_score || 0);
        case 'books':
          return b.bookCount - a.bookCount;
        case 'downloads':
          return b.totalDownloads - a.totalDownloads;
        case 'followers':
          return (authorEngageB.followers_count || 0) - (authorEngageA.followers_count || 0);
        case 'likes':
          return (authorEngageB.likes_count || 0) - (authorEngageA.likes_count || 0);
        case 'rating':
          return parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return (authorEngageB.engagement_score || 0) - (authorEngageA.engagement_score || 0);
      }
    });

    return filtered;
  }, [stats, searchTerm, sortBy, engagementStats]);

  const overallStats = useMemo(() => {
    if (!stats || !stats.authors) return { 
      totalAuthors: 0, 
      totalBooks: 0, 
      totalDL: 0, 
      avgRating: 0,
      totalFollowers: 0,
      totalLikes: 0,
      totalLoves: 0,
      totalComments: 0
    };

    const totalBooks = stats.authors.reduce((sum, a) => sum + (a.bookCount || 0), 0);
    const totalDL = stats.authors.reduce((sum, a) => sum + (a.totalDownloads || 0), 0);
    const avgRating = stats.authors.length > 0
      ? (stats.authors.reduce((sum, a) => sum + (parseFloat(a.avgRating) || 0), 0) / stats.authors.length).toFixed(1)
      : 0;
    
    // Sum engagement metrics
    const totalFollowers = Object.values(engagementStats).reduce((sum, stat) => sum + (stat.followers_count || 0), 0);
    const totalLikes = Object.values(engagementStats).reduce((sum, stat) => sum + (stat.likes_count || 0), 0);
    const totalLoves = Object.values(engagementStats).reduce((sum, stat) => sum + (stat.loves_count || 0), 0);
    const totalComments = Object.values(engagementStats).reduce((sum, stat) => sum + (stat.comments_count || 0), 0);

    return {
      totalAuthors: stats.authors.length,
      totalBooks,
      totalDL,
      avgRating,
      totalFollowers,
      totalLikes,
      totalLoves,
      totalComments
    };
  }, [stats, engagementStats]);

  if (loading) {
    return (
      <div className="authors-page">
        <div className="authors-loading">
          <div className="authors-spinner"></div>
          <p>Loading authors data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="authors-page">
      {/* Header */}
      <div className="authors-header">
        <div className="authors-title-section">
          <h1 className="authors-title">
            <FiTrendingUp /> Authors Analytics
          </h1>
          <p className="authors-subtitle">Comprehensive author performance and engagement metrics</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="authors-stats-grid">
        <div className="authors-stat-card">
          <div className="authors-stat-icon authors-stat-icon-1">
            <FiBook />
          </div>
          <div className="authors-stat-content">
            <div className="authors-stat-label">Total Authors</div>
            <div className="authors-stat-value">{overallStats.totalAuthors}</div>
          </div>
        </div>

        <div className="authors-stat-card">
          <div className="authors-stat-icon authors-stat-icon-2">
            <FiBook />
          </div>
          <div className="authors-stat-content">
            <div className="authors-stat-label">Total Books</div>
            <div className="authors-stat-value">{overallStats.totalBooks}</div>
          </div>
        </div>

        <div className="authors-stat-card">
          <div className="authors-stat-icon authors-stat-icon-3">
            <FiDownload />
          </div>
          <div className="authors-stat-content">
            <div className="authors-stat-label">Total Downloads</div>
            <div className="authors-stat-value">{overallStats.totalDL.toLocaleString()}</div>
          </div>
        </div>

        <div className="authors-stat-card">
          <div className="authors-stat-icon authors-stat-icon-4">
            <FiStar />
          </div>
          <div className="authors-stat-content">
            <div className="authors-stat-label">Avg Rating</div>
            <div className="authors-stat-value">{overallStats.avgRating}⭐</div>
          </div>
        </div>

        <div className="authors-stat-card">
          <div className="authors-stat-icon authors-stat-icon-5">
            <FiUsers />
          </div>
          <div className="authors-stat-content">
            <div className="authors-stat-label">Total Followers</div>
            <div className="authors-stat-value">{overallStats.totalFollowers}</div>
          </div>
        </div>

        <div className="authors-stat-card">
          <div className="authors-stat-icon authors-stat-icon-6">
            <MdFavoriteBorder />
          </div>
          <div className="authors-stat-content">
            <div className="authors-stat-label">Total Likes</div>
            <div className="authors-stat-value">{overallStats.totalLikes}</div>
          </div>
        </div>

        <div className="authors-stat-card">
          <div className="authors-stat-icon authors-stat-icon-7">
            <FiHeart />
          </div>
          <div className="authors-stat-content">
            <div className="authors-stat-label">Total Loves</div>
            <div className="authors-stat-value">{overallStats.totalLoves}</div>
          </div>
        </div>

        <div className="authors-stat-card">
          <div className="authors-stat-icon authors-stat-icon-8">
            <FiMessageSquare />
          </div>
          <div className="authors-stat-content">
            <div className="authors-stat-label">Total Comments</div>
            <div className="authors-stat-value">{overallStats.totalComments}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="authors-controls">
        <div className="authors-control-group">
          <label className="authors-label">Search Author</label>
          <div className="authors-search-wrapper">
            <FiSearch className="authors-search-icon" />
            <input
              type="text"
              placeholder="Search by author name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="authors-search-input"
            />
          </div>
        </div>

        <div className="authors-control-group">
          <label className="authors-label">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="authors-select"
          >
            <option value="engagement">Engagement Score</option>
            <option value="followers">Followers</option>
            <option value="likes">Likes</option>
            <option value="books">Books Count</option>
            <option value="downloads">Downloads</option>
            <option value="rating">Rating</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="authors-table-wrapper">
        <table className="authors-table">
          <thead className="authors-table-head">
            <tr>
              <th className="authors-table-header authors-rank-col">Rank</th>
              <th className="authors-table-header authors-name-col">Author Name</th>
              <th className="authors-table-header authors-num-col">Books</th>
              <th className="authors-table-header authors-num-col">Downloads</th>
              <th className="authors-table-header authors-num-col">Followers</th>
              <th className="authors-table-header authors-num-col">Likes</th>
              <th className="authors-table-header authors-num-col">Loves</th>
              <th className="authors-table-header authors-num-col">Rating</th>
              <th className="authors-table-header authors-num-col">Score</th>
            </tr>
          </thead>
          <tbody className="authors-table-body">
            {filteredAndSorted.length > 0 ? (
              filteredAndSorted.map((author, idx) => {
                const engage = engagementStats[author.name] || {};
                const engScore = engage.engagement_score || 0;
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

                return (
                  <tr key={author.id} className="authors-table-row">
                    <td className="authors-table-cell authors-rank-col">
                      <span className="authors-rank-badge">{medal}</span>
                    </td>
                    <td className="authors-table-cell authors-name-col">
                      <div className="authors-author-name">
                        {author.name === 'Unknown' ? '👤 Unknown Author' : author.name}
                      </div>
                    </td>
                    <td className="authors-table-cell authors-num-col">
                      <span className="authors-metric-plain authors-books-count">{author.bookCount}</span>
                    </td>
                    <td className="authors-table-cell authors-num-col">
                      <span className="authors-metric-plain authors-downloads-count">{author.totalDownloads}</span>
                    </td>
                    <td className="authors-table-cell authors-num-col">
                      <span className="authors-metric-plain authors-followers-count">{engage.followers_count || 0}</span>
                    </td>
                    <td className="authors-table-cell authors-num-col">
                      <span className="authors-metric-plain authors-likes-count">
                        <FiThumbsUp className="authors-metric-icon" />
                        {engage.likes_count || 0}
                      </span>
                    </td>
                    <td className="authors-table-cell authors-num-col">
                      <span className="authors-metric-plain authors-loves-count">
                        <FiHeart className="authors-metric-icon" />
                        {engage.loves_count || 0}
                      </span>
                    </td>
                    <td className="authors-table-cell authors-num-col">
                      <span className="authors-rating-plain">
                        {engage.average_rating > 0 ? engage.average_rating.toFixed(1) : '—'} ⭐
                      </span>
                    </td>
                    <td className="authors-table-cell authors-num-col">
                      <span className="authors-score-plain">{engScore.toFixed(2)}</span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className="authors-table-row authors-empty-row">
                <td colSpan="9" className="authors-table-cell authors-empty-message">
                  No authors found matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="authors-summary">
        <div className="authors-summary-item">
          <span className="authors-summary-label">Showing</span>
          <span className="authors-summary-value">{filteredAndSorted.length} of {overallStats.totalAuthors}</span>
          <span className="authors-summary-label">authors</span>
        </div>
      </div>
    </div>
  );
};

export default Authors;
