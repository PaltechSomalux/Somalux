# Pure CSS Conversion Template

## Pattern for all remaining ranking components:

### Import Statement
```jsx
import React, { useState, useMemo } from 'react';
import TimeRangeSelector from './TimeRangeSelector';
import { calculateXScore, filterAndSortX } from '../utils/rankingCalculations';
import './XRanking.css';
```

### JSX Return Structure (replace all MUI components)
```jsx
<div className="x-ranking-container">
  <div className="x-ranking-search-bar">
    <input
      type="text"
      placeholder="Search..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="x-ranking-search-input"
    />
    <select value={filterMetric} onChange={(e) => setFilterMetric(e.target.value)} className="x-ranking-filter">
      {/* options */}
    </select>
    <TimeRangeSelector selected={timeRange} onChange={onTimeRangeChange} />
  </div>

  <div className="x-ranking-table-container">
    <table className="x-ranking-table">
      <thead className="x-ranking-table-head">
        <tr>
          {/* <th> headers */}
        </tr>
      </thead>
      <tbody>
        {/* <tr> rows with <td> cells */}
      </tbody>
    </table>
  </div>
</div>
```

### Key replacements:
- Box → div
- TextField → input[type="text"]
- FormControl/Select/MenuItem → select/option
- TableContainer/Paper → div
- Table/TableHead/TableBody/TableRow/TableCell → table/thead/tbody/tr/th/td
- Avatar → img
- Typography → div/span
- Rating → Unicode stars or simple display
- Tooltip → title attribute on element

### CSS Input Styling (add to all .css files):
```css
.x-ranking-search-input {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid #202c33;
  border-radius: 4px;
  color: #d0d0d0;
  font-size: 14px;
  font-family: inherit;
}

.x-ranking-search-input::placeholder {
  color: #8696a0;
}

.x-ranking-search-input:hover,
.x-ranking-search-input:focus {
  border-color: #00a884;
  outline: none;
}

.x-ranking-filter {
  min-width: 150px;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid #202c33;
  border-radius: 4px;
  color: #d0d0d0;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
}

.x-ranking-filter option {
  background: #1e293b;
  color: #d0d0d0;
}
```

### CSS Table Styling (add to all .css files):
```css
.x-ranking-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
}

.x-ranking-table-header-cell {
  font-weight: 600;
  color: #d0d0d0;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #202c33;
}

.x-ranking-right {
  text-align: right;
}

.x-ranking-table-row:hover {
  background-color: #202c33;
  box-shadow: 0 2px 4px rgba(0, 168, 132, 0.2);
}

.x-ranking-table-cell {
  padding: 12px;
  color: #d0d0d0;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}
```

## Components to update:
1. UsersRanking ✓
2. CategoriesRanking
3. UniversitiesRanking
4. PapersRanking
5. ReadingActivityRanking
6. AchievementsRanking
7. AdsRanking
8. GoalsRanking
9. SubscribersRanking
10. EngagementRanking
