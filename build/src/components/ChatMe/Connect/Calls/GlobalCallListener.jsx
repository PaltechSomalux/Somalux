import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../../../supabase';
import { listenIncomingCallsFor, updateCallStatus, writeSignalDirect } from './signaling';
import OneToOneCall from './OneToOneCall';

export default function GlobalCallListener() {
  const [currentUser, setCurrentUser] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  useEffect(() => {
    // mark global presence for other UIs to avoid duplicate modals
    try { window.__GLOBAL_CALL_LISTENER = true; } catch (_) {}
    return () => { try { delete window.__GLOBAL_CALL_LISTENER; } catch (_) {} };
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({ id: user.id, name: user.user_metadata?.full_name || 'You' });
      } else {
        setCurrentUser(null);
      }
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, name: session.user.user_metadata?.full_name || 'You' });
      } else {
        setCurrentUser(null);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = listenIncomingCallsFor(currentUser.id, null, (call) => {
      if (!activeCall) setIncomingCall(call);
    });
    return () => { try { unsub && unsub(); } catch (_) {} };
  }, [currentUser?.id, activeCall]);

  const remoteContact = useMemo(() => {
    if (!incomingCall && !activeCall) return null;
    const call = incomingCall || activeCall;
    const ids = Array.isArray(call?.participantsIds) ? call.participantsIds : [];
    const otherId = ids.find((id) => id && id !== currentUser?.id) || call?.initiator?.id;
    const otherName = (call?.initiator?.id === otherId ? call?.initiator?.name : (call?.participants || []).find(p => p?.id === otherId)?.name) || 'Contact';
    return { id: otherId, name: otherName };
  }, [incomingCall, activeCall, currentUser?.id]);

  const accept = async () => {
    if (!incomingCall || !currentUser?.id) return;
    try {
      await updateCallStatus(incomingCall.id, 'in_progress');
      await writeSignalDirect(incomingCall.id, 'accepted', { by: currentUser.id });
    } catch (_) {}
    setActiveCall({ id: incomingCall.id, mode: incomingCall.mode || 'voice', role: 'callee', contact: remoteContact, initiator: incomingCall.initiator });
    setIncomingCall(null);
  };

  const decline = async () => {
    if (!incomingCall || !currentUser?.id) return;
    try {
      await updateCallStatus(incomingCall.id, 'declined');
      await writeSignalDirect(incomingCall.id, 'hangup', { by: currentUser.id });
    } catch (_) {}
    setIncomingCall(null);
  };

  const onCloseActive = async () => {
    setActiveCall(null);
  };

  return (
    <>
      {incomingCall && !activeCall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000 }}>
          <div style={{ background: '#1f2c34', color: '#fff', padding: 20, borderRadius: 12, width: 320, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
            <h4 style={{ marginTop: 0, marginBottom: 8 }}>Incoming {incomingCall.mode === 'video' ? 'Video' : 'Voice'} Call</h4>
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>From: {incomingCall?.initiator?.name || 'Unknown'}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={decline} style={{ background: '#b3261e', color: '#fff', border: 0, padding: '8px 12px', borderRadius: 8 }}>Decline</button>
              <button onClick={accept} style={{ background: '#0b8457', color: '#fff', border: 0, padding: '8px 12px', borderRadius: 8 }}>Accept</button>
            </div>
          </div>
        </div>
      )}
      {activeCall && (
        <OneToOneCall call={activeCall} mode={activeCall.mode} currentUser={currentUser || {}} contact={remoteContact || {}} onClose={onCloseActive} />
      )}
    </>
  );
}
