import React from 'react';
import CallItem from './CallItem';

export default function CallList({ calls = [], onSelect = () => {}, onStartCall = () => {} }) {
  return (
    <div className="call-list">
      {calls.length === 0 ? (
        <div className="no-calls">No calls to show</div>
      ) : (
        calls.map(c => (
          <CallItem key={c.id} call={c} onClick={() => onSelect(c)} onStartCall={(mode) => onStartCall(c, mode)} />
        ))
      )}
    </div>
  );
}
