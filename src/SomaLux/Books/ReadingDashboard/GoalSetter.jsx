import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { FiTarget, FiPlus, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';
import './GoalSetter.css';

const GoalSetter = ({ userId, goals, onGoalCreated, onGoalUpdated }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [goalType, setGoalType] = useState('yearly');
  const [targetBooks, setTargetBooks] = useState(50);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);

  // If there is any active goal that is not yet completed, prevent creating another
  const hasActiveIncompleteGoal = Array.isArray(goals) && goals.some(g => g.is_active && (g.current_progress || 0) < (g.target_books || 0));

  const handleCreateGoal = async () => {
    // Prevent creation if there is an active incomplete goal
    if (hasActiveIncompleteGoal) {
      alert('You already have an active goal that is not yet finished. Finish it before creating a new goal.');
      return;
    }

    if (!targetBooks || targetBooks <= 0) {
      alert('Please enter a valid target');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch('http://localhost:5000/api/reading/goals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId,
          goalType,
          targetBooks: parseInt(targetBooks),
          year: parseInt(selectedYear),
          month: goalType === 'monthly' ? parseInt(selectedMonth) : null
        })
      });

      const data = await response.json();
      if (data.ok) {
        setShowCreateForm(false);
        setTargetBooks(50);
        // Pass the newly created goal back to the parent so it can update immediately
        try { onGoalCreated && onGoalCreated(data.goal); } catch (e) { console.warn('onGoalCreated handler failed', e); }
        alert('✅ Goal created successfully!');
      } else {
        alert('Failed to create goal: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch(`http://localhost:5000/api/reading/goals/${goalId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ isActive: false })
      });

      const data = await response.json();
      if (data.ok) {
        onGoalUpdated();
        alert('Goal deleted');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="goal-setter-container">
      <div className="goal-setter-header">
        <h2>Reading Goals</h2>
        <button 
          className="btn-primary"
          onClick={() => {
            if (hasActiveIncompleteGoal) {
              alert("You haven't completed your existing active goal yet. Finish it before creating a new one.");
              return;
            }
            setShowCreateForm(!showCreateForm);
          }}
          title={hasActiveIncompleteGoal ? 'Finish your active goal first' : 'Create a new goal'}
        >
          <FiPlus /> {showCreateForm ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      {/* Create Goal Form */}
      {showCreateForm && (
        <div className="create-goal-form">
          <h3>Create New Goal</h3>
          
          <div className="form-group">
            <label>Goal Type</label>
            <div className="goal-type-selector">
              <button 
                className={`type-btn ${goalType === 'yearly' ? 'active' : ''}`}
                onClick={() => setGoalType('yearly')}
              >
                📅 Yearly
              </button>
              <button 
                className={`type-btn ${goalType === 'monthly' ? 'active' : ''}`}
                onClick={() => setGoalType('monthly')}
              >
                📆 Monthly
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Target Books</label>
              <input 
                type="number" 
                className="input-field"
                value={targetBooks}
                onChange={(e) => setTargetBooks(e.target.value)}
                min="1"
                max="365"
              />
            </div>

            <div className="form-group">
              <label>Year</label>
              <select 
                className="select-field"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {goalType === 'monthly' && (
              <div className="form-group">
                <label>Month</label>
                <select 
                  className="select-field"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {monthNames.map((month, index) => (
                    <option key={index} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button 
            className="btn-primary btn-create"
            onClick={handleCreateGoal}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Goal'}
          </button>
        </div>
      )}

      {/* Active Goals List */}
      <div className="goals-list">
        <h3>Active Goals</h3>
        
        {goals.length === 0 ? (
          <div className="no-goals">
            <FiTarget size={48} color="#8696a0" />
            <p>No active goals yet</p>
            <p className="subtext">Create your first goal to start tracking your progress!</p>
          </div>
        ) : (
          <div className="goals-grid">
            {goals.map(goal => (
              <div key={goal.id} className="goal-card">
                <div className="goal-card-header">
                  <div className="goal-type-badge">
                    {goal.goal_type === 'yearly' ? '📅' : '📆'} 
                    {goal.goal_type === 'yearly' ? ` ${goal.year}` : ` ${monthNames[goal.month - 1]} ${goal.year}`}
                  </div>
                  <button 
                    className="btn-icon-danger"
                    onClick={() => handleDeleteGoal(goal.id)}
                    title="Delete goal"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>

                <div className="goal-target">
                  <FiTarget size={24} color="#00a884" />
                  <span>Read {goal.target_books} books</span>
                </div>

                <div className="goal-progress-section">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${Math.min((goal.current_progress / goal.target_books) * 100, 100)}%`,
                        backgroundColor: goal.current_progress >= goal.target_books ? '#10b981' : '#00a884'
                      }}
                    ></div>
                  </div>
                  <div className="progress-stats">
                    <span className="progress-current">{goal.current_progress} / {goal.target_books}</span>
                    <span className="progress-percent">
                      {Math.round((goal.current_progress / goal.target_books) * 100)}%
                    </span>
                  </div>
                </div>

                {goal.current_progress >= goal.target_books && (
                  <div className="goal-achieved">
                    <FiCheck size={18} />
                    Goal Achieved! 🎉
                  </div>
                )}

                {goal.current_progress < goal.target_books && (
                  <div className="goal-remaining">
                    {goal.target_books - goal.current_progress} books remaining
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Goals */}
      {goals.length === 0 && (
        <div className="suggested-goals">
          <h3>Popular Goals</h3>
          <div className="suggestions-grid">
            <div className="suggestion-card" onClick={() => {
              setGoalType('yearly');
              setTargetBooks(12);
              setShowCreateForm(true);
            }}>
              <div className="suggestion-icon">📚</div>
              <div className="suggestion-title">1 Book/Month</div>
              <div className="suggestion-desc">12 books in 2025</div>
            </div>

            <div className="suggestion-card" onClick={() => {
              setGoalType('yearly');
              setTargetBooks(52);
              setShowCreateForm(true);
            }}>
              <div className="suggestion-icon">🚀</div>
              <div className="suggestion-title">1 Book/Week</div>
              <div className="suggestion-desc">52 books in 2025</div>
            </div>

            <div className="suggestion-card" onClick={() => {
              setGoalType('monthly');
              setTargetBooks(5);
              setShowCreateForm(true);
            }}>
              <div className="suggestion-icon">⚡</div>
              <div className="suggestion-title">Speed Reader</div>
              <div className="suggestion-desc">5 books this month</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalSetter;
