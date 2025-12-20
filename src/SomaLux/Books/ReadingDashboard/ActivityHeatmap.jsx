import React from 'react';
import './ActivityHeatmap.css';

const ActivityHeatmap = ({ activity }) => {
  // Generate last 365 days
  const generateHeatmapData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      data.push({
        date: dateStr,
        count: activity[dateStr] || 0,
        day: date.getDay(),
        month: date.getMonth(),
        displayDate: date
      });
    }
    
    return data;
  };

  const heatmapData = generateHeatmapData();

  // Group by weeks
  const weeks = [];
  let currentWeek = [];
  
  // Pad the first week to start on Sunday
  const firstDayOfWeek = heatmapData[0].day;
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }

  heatmapData.forEach((day, index) => {
    currentWeek.push(day);
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Add remaining days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const getColor = (count) => {
    if (count === 0) return '#0b1216';
    if (count === 1) return '#0e4429';
    if (count === 2) return '#006d32';
    if (count >= 3 && count < 5) return '#26a641';
    return '#39d353';
  };

  const getDayLabel = (dayIndex) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  };

  const getMonthLabel = (monthIndex) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
  };

  const monthPositions = [];
  let currentMonth = -1;
  weeks.forEach((week, weekIndex) => {
    week.forEach(day => {
      if (day && day.month !== currentMonth) {
        currentMonth = day.month;
        monthPositions.push({ month: currentMonth, position: weekIndex });
      }
    });
  });

  const totalActivity = Object.values(activity).reduce((a, b) => a + b, 0);
  const activeDays = Object.keys(activity).length;

  return (
    <div className="activity-heatmap">
      <div className="heatmap-stats">
        <div className="heatmap-stat">
          <span className="stat-value">{totalActivity}</span>
          <span className="stat-label">reading sessions</span>
        </div>
        <div className="heatmap-stat">
          <span className="stat-value">{activeDays}</span>
          <span className="stat-label">active days</span>
        </div>
      </div>

      <div className="heatmap-container">
        {/* Month labels */}
        <div className="heatmap-months">
          {monthPositions.map((pos, index) => (
            <div 
              key={index} 
              className="month-label"
            >
              {getMonthLabel(pos.month)}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="heatmap-grid">
          {/* Day labels */}
          <div className="day-labels">
            {[1, 3, 5].map(dayIndex => (
              <div key={dayIndex} className="day-label">
                {getDayLabel(dayIndex)}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="weeks-container">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="week-column">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="day-cell"
                    style={{
                      backgroundColor: day ? getColor(day.count) : 'transparent'
                    }}
                    title={day ? `${day.displayDate.toLocaleDateString()}: ${day.count} session${day.count !== 1 ? 's' : ''}` : ''}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="heatmap-legend">
          <span>Less</span>
          {[0, 1, 2, 3, 5].map(count => (
            <div
              key={count}
              className="legend-cell"
              style={{ backgroundColor: getColor(count) }}
              title={`${count} sessions`}
            ></div>
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
