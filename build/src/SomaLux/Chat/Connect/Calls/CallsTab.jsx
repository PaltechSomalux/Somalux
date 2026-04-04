import React, { useState } from 'react';
import CallList from './CallList';
import CallDetail from './CallDetail';
import CallControls from './CallControls';
import OneToOneCall from './OneToOneCall';
import GroupCall from './GroupCall';
import './Calls.css';
import { Phone, VideoCamera } from 'phosphor-react';

const mockCalls = [
  {
    id: 'c1',
    type: 'one-to-one',
    mode: 'voice',
    direction: 'outgoing',
    name: 'Alice Johnson',
    avatar: '',
    time: '2 hours ago',
    status: 'completed'
  },
  {
    id: 'c2',
    type: 'one-to-one',
    mode: 'video',
    direction: 'incoming',
    name: 'Ben K.',
    avatar: '',
    time: 'Yesterday',
    status: 'missed'
  },
  {
    id: 'c3',
    type: 'group',
    mode: 'voice',
    direction: 'outgoing',
    name: 'Project Squad',
    avatar: '',
    time: '3 days ago',
    status: 'completed'
  }
];

export default function CallsTab({ user, isMobile }) {
  const [calls] = useState(mockCalls);
  const [filter, setFilter] = useState('all'); // all, one, group, missed
  const [modeFilter, setModeFilter] = useState('all'); // all, voice, video
  const [selected, setSelected] = useState(null);
  const [activeCallUI, setActiveCallUI] = useState(null); // 'one' or 'group' with payload

  const filtered = calls.filter(c => {
    if (filter === 'one' && c.type !== 'one-to-one') return false;
    if (filter === 'group' && c.type !== 'group') return false;
    if (filter === 'missed' && c.status !== 'missed') return false;
    if (modeFilter !== 'all' && c.mode !== modeFilter) return false;
    return true;
  });

  return (
    <div className="calls-tab">
      <div className="calls-header">
        <h2>Calls</h2>
        <div className="calls-actions">
          <button className={`calls-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`calls-filter ${filter === 'one' ? 'active' : ''}`} onClick={() => setFilter('one')}>1:1</button>
          <button className={`calls-filter ${filter === 'group' ? 'active' : ''}`} onClick={() => setFilter('group')}>Group</button>
          <button className={`calls-filter ${filter === 'missed' ? 'active' : ''}`} onClick={() => setFilter('missed')}>Missed</button>
          <div className="calls-mode">
            <button className={`mode ${modeFilter === 'all' ? 'active' : ''}`} onClick={() => setModeFilter('all')}>All</button>
            <button className={`mode ${modeFilter === 'voice' ? 'active' : ''}`} onClick={() => setModeFilter('voice')} title="Voice"><Phone weight="bold" /></button>
            <button className={`mode ${modeFilter === 'video' ? 'active' : ''}`} onClick={() => setModeFilter('video')} title="Video"><VideoCamera weight="bold" /></button>
          </div>
        </div>
      </div>

      <div className="calls-body">
        <div className="calls-list-column">
          <CallList calls={filtered} onSelect={(c) => setSelected(c)} onStartCall={(c, mode) => setActiveCallUI({ type: c.type, call: c, mode })} />
        </div>
        <div className="calls-detail-column">
          {selected ? (
            <CallDetail call={selected} onClose={() => setSelected(null)} onStartCall={(mode) => setActiveCallUI({ type: selected.type, call: selected, mode })} />
          ) : (
            <div className="calls-empty">
              <p>Select a call to view details or start a new call.</p>
            </div>
          )}
        </div>
      </div>

      {activeCallUI && activeCallUI.type === 'one-to-one' && (
        <OneToOneCall call={activeCallUI.call} mode={activeCallUI.mode} onClose={() => setActiveCallUI(null)} />
      )}

      {activeCallUI && activeCallUI.type === 'group' && (
        <GroupCall call={activeCallUI.call} mode={activeCallUI.mode} onClose={() => setActiveCallUI(null)} />
      )}

    </div>
  );
}
