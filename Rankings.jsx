import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  Avatar,
  Chip,
  CircularProgress,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Alert
} from '@mui/material';
import {
  FiTrendingUp,
  FiAward,
  FiCheck,
  FiUsers,
  FiBook,
  FiDownload,
  FiEye,
  FiHeart,
  FiBarChart2,
  FiTarget,
  FiZap,
  FiPieChart,
  FiMessageSquare,
  FiList
} from 'react-icons/fi';
import { MdSchool, MdCategory, MdMovie, MdTrendingUp } from 'react-icons/md';
import TimeRangeSelector from './src/SomaLux/Books/Admin/pages/rankings/components/TimeRangeSelector';
import UsersRanking from './src/SomaLux/Books/Admin/pages/rankings/components/UsersRanking';
import BooksRanking from './src/SomaLux/Books/Admin/pages/rankings/components/BooksRanking';
import AuthorsRanking from './src/SomaLux/Books/Admin/pages/rankings/components/AuthorsRanking';
import CategoriesRanking from './src/SomaLux/Books/Admin/pages/rankings/components/CategoriesRanking';
import UniversitiesRanking from './src/SomaLux/Books/Admin/pages/rankings/components/UniversitiesRanking';
import PapersRanking from './src/SomaLux/Books/Admin/pages/rankings/components/PapersRanking';
import ReadingActivityRanking from './src/SomaLux/Books/Admin/pages/rankings/components/ReadingActivityRanking';
import AchievementsRanking from './src/SomaLux/Books/Admin/pages/rankings/components/AchievementsRanking';
import AdsRanking from './src/SomaLux/Books/Admin/pages/rankings/components/AdsRanking';
import GoalsRanking from './src/SomaLux/Books/Admin/pages/rankings/components/GoalsRanking';
import SubscribersRanking from './src/SomaLux/Books/Admin/pages/rankings/components/SubscribersRanking';
import EngagementRanking from './src/SomaLux/Books/Admin/pages/rankings/components/EngagementRanking';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

const COLORS = ['#00a884', '#34B7F1', '#FFCC00', '#f15e6c', '#8b5cf6', '#22d3ee', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

const getBackendOrigin = () => {
  const { protocol, hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:5000`;
  }
  return '';
};

const MedalBadge = ({ rank }) => {
  if (rank === 1) return <span style={{ fontSize: '20px' }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: '20px' }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: '20px' }}>🥉</span>;
  return null;
};

const GenericRankingTable = ({ data, columns, loading, emptyMessage }) => {
  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
  if (!data || data.length === 0) return <Alert severity="info">{emptyMessage || 'No data available'}</Alert>;

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 1, boxShadow: 'none', background: 'transparent' }}>
      <Table>
        <TableHead sx={{ background: '#1e293b', borderBottom: '2px solid #202c33' }}>
          <TableRow>
            {columns.map((col, idx) => (
              <TableCell key={idx} align={col.align || 'left'} sx={{ fontWeight: 700, color: '#e9edef' }}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#202c33' } }}>
              {columns.map((col, cidx) => (
                <TableCell key={cidx} align={col.align || 'left'} sx={{ color: '#cfd8dc' }}>
                  {col.render ? col.render(row, idx) : row[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const RankingCard = ({ icon: Icon, label, value, color }) => (
  <Card sx={{ background: '#111b21', borderRadius: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.2, padding: 0.75 }}>
      <Typography variant="caption" sx={{ color: '#8696a0', fontWeight: 400, fontSize: '0.65rem' }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#e9edef', fontSize: '1.1rem' }}>
          {value}
        </Typography>
        <Box sx={{ fontSize: 10, px: 0.5, py: 0.15, borderRadius: 999, background: `${color}15`, color: color }}>
          📊
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const RankingTableRow = ({ rank, user, score, displayName, avatarUrl, email, tier, metrics, subscriptionTier }) => (
  <TableRow sx={{ '&:hover': { backgroundColor: '#202c33' } }}>
    <TableCell sx={{ fontWeight: 700, color: rank <= 3 ? '#f15e6c' : '#e9edef' }}>
      {rank <= 3 && <span>{'🥇🥈🥉'[rank - 1]}</span>} #{rank}
    </TableCell>
    <TableCell>
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar src={avatarUrl} sx={{ width: 40, height: 40, background: '#34B7F1' }}>
          {displayName?.charAt(0)?.toUpperCase()}
        </Avatar>
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#e9edef' }}>{displayName}</Typography>
            {subscriptionTier === 'premium' && (
              <FiCheck size={14} style={{ color: '#2196F3' }} title="Premium" />
            )}
            {subscriptionTier === 'premium_pro' && (
              <FiAward size={14} style={{ color: '#FFD700' }} title="Premium Pro" />
            )}
          </Box>
          <Typography variant="caption" sx={{ color: '#8696a0' }}>{email}</Typography>
        </Box>
      </Box>
    </TableCell>
    <TableCell align="center">
      <Chip label={tier} size="small" sx={{ background: tier === 'superuser' ? '#f15e6c' : '#34B7F1', color: 'white' }} />
    </TableCell>
    <TableCell align="right" sx={{ fontWeight: 700, color: '#00a884' }}>{Math.round(score)}</TableCell>
    {metrics && Object.values(metrics).map((value, idx) => <TableCell key={idx} align="right"><Typography variant="caption" sx={{ color: '#cfd8dc' }}>{Math.round(value)}</Typography></TableCell>)}
  </TableRow>
);

const Rankings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('monthly');
  const [rankings, setRankings] = useState([]);
  const [userActivityStats, setUserActivityStats] = useState([]);
  const [bookStats, setBookStats] = useState([]);
  const [authorStats, setAuthorStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [universityStats, setUniversityStats] = useState([]);
  const [pastPaperStats, setPastPaperStats] = useState([]);
  const [readingActivityStats, setReadingActivityStats] = useState([]);
  const [achievementStats, setAchievementStats] = useState([]);
  const [adsStats, setAdsStats] = useState([]);
  const [goalsStats, setGoalsStats] = useState([]);
  const [subscribersStats, setSubscribersStats] = useState([]);
  const [engagementStats, setEngagementStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all rankings
  useEffect(() => {
    const fetchAllRankings = async () => {
      try {
        setLoading(true);
        const origin = getBackendOrigin();

        const requests = [
          { url: `${origin}/api/admin/user-rankings`, setState: setRankings },
          { url: `${origin}/api/admin/rankings/user-activity?timeRange=${timeRange}`, setState: setUserActivityStats },
          { url: `${origin}/api/admin/rankings/books?timeRange=${timeRange}`, setState: setBookStats },
          { url: `${origin}/api/admin/rankings/authors?timeRange=${timeRange}`, setState: setAuthorStats },
          { url: `${origin}/api/admin/rankings/categories?timeRange=${timeRange}`, setState: setCategoryStats },
          { url: `${origin}/api/admin/rankings/universities?timeRange=${timeRange}`, setState: setUniversityStats },
          { url: `${origin}/api/admin/rankings/past-papers?timeRange=${timeRange}`, setState: setPastPaperStats },
          { url: `${origin}/api/admin/rankings/reading-activity?timeRange=${timeRange}`, setState: setReadingActivityStats },
          { url: `${origin}/api/admin/rankings/achievements?timeRange=${timeRange}`, setState: setAchievementStats },
          { url: `${origin}/api/admin/rankings/ads-performance?timeRange=${timeRange}`, setState: setAdsStats },
          { url: `${origin}/api/admin/rankings/reading-goals?timeRange=${timeRange}`, setState: setGoalsStats },
          { url: `${origin}/api/admin/rankings/subscribers`, setState: setSubscribersStats },
          { url: `${origin}/api/admin/rankings/engagement?timeRange=${timeRange}`, setState: setEngagementStats }
        ];

        const responses = await Promise.all(
          requests.map(req =>
            fetch(req.url)
              .then(res => res.ok ? res.json() : null)
              .catch(() => null)
              .then(data => ({ data, setState: req.setState }))
          )
        );

        responses.forEach(({ data, setState }) => {
          if (data?.ok && Array.isArray(data.rankings)) {
            setState(data.rankings);
          }
        });
      } catch (error) {
        console.error('Failed to fetch rankings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRankings();
  }, [timeRange]);

  const filteredRankings = useMemo(() => {
    return rankings.filter(r =>
      !searchTerm || 
      r.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rankings, searchTerm]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSearchTerm('');
  };

  return (
    <Box sx={{ p: 3, background: 'transparent', minHeight: '100vh' }}>
      {/* HEADER */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <FiBarChart2 size={32} color="#00a884" />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#e9edef', fontSize: '1.1rem' }}>
            System Rankings & Analytics
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#8696a0', fontSize: '0.75rem' }}>
          Real-time rankings for all platform entities with dynamic data
        </Typography>
      </Box>

      {/* STATS OVERVIEW */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={2.4}>
          <RankingCard label="Active Users" value={rankings.length} color="#00a884" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <RankingCard label="Books Ranked" value={bookStats.length} color="#34B7F1" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <RankingCard label="Top Author" value={authorStats[0]?.author || '-'} color="#8b5cf6" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <RankingCard label="Categories" value={categoryStats.length} color="#f15e6c" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <RankingCard label="Universities" value={universityStats.length} color="#22d3ee" />
        </Grid>
      </Grid>

      {/* TABS */}
      <Card sx={{ borderRadius: 2, background: '#111b21', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid #202c33',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, color: '#8696a0' },
            '& .Mui-selected': { color: '#00a884' },
            '& .MuiTabs-indicator': { backgroundColor: '#00a884' }
          }}
        >
          <Tab label="👥 Users" />
          <Tab label="📖 Books" />
          <Tab label="✍️ Authors" />
          <Tab label="📚 Categories" />
          <Tab label="🏫 Universities" />
          <Tab label="📄 Papers" />
          <Tab label="📖 Reading" />
          <Tab label="🏆 Achievements" />
          <Tab label="📊 Ads" />
          <Tab label="🎯 Goals" />
          <Tab label="⭐ Subscribers" />
          <Tab label="💬 Engagement" />
        </Tabs>

        <CardContent sx={{ p: 3, background: '#111b21' }}>
          {/* TAB 0: USERS */}
          {tabValue === 0 && (
            <UsersRanking
              userActivityStats={userActivityStats}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          )}

          {/* TAB 1: BOOKS */}
          {tabValue === 1 && (
            <BooksRanking
              bookStats={bookStats}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              loading={loading}
            />
          )}

          {/* TAB 2: AUTHORS */}
          {tabValue === 2 && (
            <AuthorsRanking
              authorStats={authorStats}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              loading={loading}
            />
          )}

          {/* TAB 3: CATEGORIES */}
          {tabValue === 3 && (
            <CategoriesRanking
              categoryStats={categoryStats}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              loading={loading}
            />
          )}

          {/* TAB 4: UNIVERSITIES */}
          {tabValue === 4 && (
            <UniversitiesRanking
              universityStats={universityStats}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              loading={loading}
            />
          )}

          {/* TAB 5: PAPERS */}
          {tabValue === 5 && (
            <PapersRanking
              pastPaperStats={pastPaperStats}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              loading={loading}
            />
          )}

          {/* TAB 6: READING ACTIVITY */}
          {tabValue === 6 && (
            <ReadingActivityRanking
              readingActivityStats={readingActivityStats}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              loading={loading}
            />
          )}

          {/* TAB 7: ACHIEVEMENTS */}
          {tabValue === 7 && (
            <AchievementsRanking
              achievementStats={achievementStats}
              loading={loading}
            />
          )}

          {/* TAB 8: ADS */}
          {tabValue === 8 && (
            <AdsRanking
              adsStats={adsStats}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              loading={loading}
            />
          )}

          {/* TAB 9: GOALS */}
          {tabValue === 9 && (
            <GoalsRanking
              goalsStats={goalsStats}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              loading={loading}
            />
          )}

          {/* TAB 10: SUBSCRIBERS */}
          {tabValue === 10 && (
            <SubscribersRanking
              subscribersStats={subscribersStats}
              loading={loading}
            />
          )}

          {/* TAB 11: ENGAGEMENT */}
          {tabValue === 11 && (
            <EngagementRanking
              engagementStats={engagementStats}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Rankings;
