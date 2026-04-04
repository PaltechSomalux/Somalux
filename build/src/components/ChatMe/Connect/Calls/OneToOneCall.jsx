import React, { useState, useEffect, useRef } from 'react';
import { Phone, VideoCamera, Microphone, SpeakerHigh, X } from 'phosphor-react';
import { listenSignals, writeSignalDirect, updateCallStatus } from './signaling';
import agoraClient from './agoraClient';
import agoraDefaults from './agoraConfig';

// Minimal WebRTC + Firestore signaling POC.
export default function OneToOneCall({ call = {}, mode = 'voice', currentUser = {}, contact = {}, onClose = () => {} }) {
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const pcRef = useRef(null);
  const signalsUnsubRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [usingAgora, setUsingAgora] = useState(false);
  const [agoraConnected, setAgoraConnected] = useState(false);
  const joiningRef = useRef(false);
  const joinedRef = useRef(false);

  useEffect(() => {
    const AGORA_APP_ID = process.env.REACT_APP_AGORA_APP_ID || agoraDefaults.AGORA_APP_ID;
    const AGORA_TOKEN = process.env.REACT_APP_AGORA_TOKEN || agoraDefaults.AGORA_TOKEN || null;
    if (AGORA_APP_ID) {
      // Use Agora path for calls
      (async () => {
        try {
          setUsingAgora(true);
          const channel = call.id || `call_${Date.now()}`;
          joiningRef.current = true;
          const doJoin = async () => await agoraClient.joinChannel({ appId: AGORA_APP_ID, token: AGORA_TOKEN, channel, uid: null, enableVideo: mode === 'video', onUserPublished: async (user, mediaType) => {
            try {
              if (mediaType === 'video') {
                const remoteVideoTrack = user.videoTrack;
                if (remoteVideoRef.current && remoteVideoTrack) remoteVideoTrack.play(remoteVideoRef.current);
                setAgoraConnected(true);
              }
              if (mediaType === 'audio') {
                const remoteAudioTrack = user.audioTrack;
                if (remoteAudioTrack) remoteAudioTrack.play();
                setAgoraConnected(true);
              }
              if (mediaType === 'leave') {
                setAgoraConnected(false);
              }
            } catch (e) { console.warn('Agora onUserPublished handler failed', e); }
          } });
          let joinedRes = null;
          try {
            joinedRes = await doJoin();
          } catch (err) {
            const msg = String(err?.message || err);
            if (msg.includes('OPERATION_ABORTED') || msg.includes('cancel token canceled')) {
              await new Promise(r => setTimeout(r, 350));
              joinedRes = await doJoin();
            } else {
              throw err;
            }
          }
          joinedRef.current = true;

          // attach local preview
          const local = agoraClient.getLocalTracks();
          if (local.videoTrack && localVideoRef.current) local.videoTrack.play(localVideoRef.current);

          // Notify callee via Firestore signaling and listen for hangup
          try {
            if (call.role === 'caller') {
              await writeSignalDirect(call.id, 'invite', { from: currentUser.id, channel });
            }
          } catch (e) {}

          try {
            signalsUnsubRef.current = listenSignals(call.id, (d) => {
              const t = d.type;
              if (t === 'hangup') {
                onClose();
              }
            });
          } catch (e) {}
        } catch (e) {
          console.error('Agora join failed', e);
          setUsingAgora(false);
        }
      })();
      // we won't run the in-file WebRTC flow when using Agora
      return () => {
        (async () => { try { if (signalsUnsubRef.current) signalsUnsubRef.current(); } catch (e) {} })();
        // Avoid leaving during StrictMode test cleanup before join completes
        (async () => { try { if (joinedRef.current) await agoraClient.leaveChannel(); } catch (e) {} })();
        joiningRef.current = false;
      };
    }
    // else fallthrough to existing WebRTC code
    let mounted = true;

    const createPeerConnection = () => {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        });
        pc.ontrack = (ev) => {
          if (!mounted) return;
          setRemoteStream(ev.streams[0]);
        };

        pc.onicecandidate = async (ev) => {
          if (!ev.candidate) return;
          try {
            const candidatePayload = ev.candidate && ev.candidate.toJSON ? ev.candidate.toJSON() : ev.candidate;
            await writeSignalDirect(call.id, 'ice', { from: currentUser.id, candidate: candidatePayload });
          } catch (e) { console.warn('send ice failed', e); }
        };

        pcRef.current = pc;
        return pc;
      } catch (e) {
        console.error('Failed to create RTCPeerConnection', e);
        pcRef.current = null;
        return null;
      }
    };

    // Ensure a live RTCPeerConnection
    if (!pcRef.current || (pcRef.current && pcRef.current.signalingState === 'closed')) {
      createPeerConnection();
    }

    const startLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === 'video' });
        setLocalStream(stream);
        const pc = pcRef.current;
        if (pc && stream) stream.getTracks().forEach(t => pc.addTrack(t, stream));
        return stream;
      } catch (e) {
        console.warn('getUserMedia failed', e);
        // don't throw: allow answering without local media
        setLocalStream(null);
        return null;
      }
    };

    const safeSetRemoteDescription = async (pc, sdpObj) => {
      if (!pc || !sdpObj) return false;
      const maxRetries = 6;
      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdpObj));
          return true;
        } catch (err) {
          // If wrong state for answer, wait a bit for localDescription to be set
          if (err && err.name === 'InvalidStateError') {
            if (sdpObj.type === 'answer') {
              await new Promise(r => setTimeout(r, 300));
              attempt += 1;
              continue;
            }
          }
          console.warn('safeSetRemoteDescription failed', err);
          return false;
        }
      }
      console.warn('safeSetRemoteDescription: exhausted retries');
      return false;
    };

    const handleSignal = async (msg) => {
      if (!msg || !msg.type) return;
      const { type, payload } = msg;
      try {
        const pc = pcRef.current || createPeerConnection();
        if (type === 'offer' && payload?.sdp) {
          // Callee path: set remote, create answer
          await startLocalMedia();
          const ok = await safeSetRemoteDescription(pc, payload.sdp);
          if (!ok) return;
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          const sdpPayload = pc.localDescription ? { type: pc.localDescription.type, sdp: pc.localDescription.sdp } : null;
          await writeSignalDirect(call.id, 'answer', { from: currentUser.id, sdp: sdpPayload });
        } else if (type === 'answer' && payload?.sdp) {
          const ok = await safeSetRemoteDescription(pc, payload.sdp);
          if (!ok) {
            console.warn('Failed to apply remote answer');
          }
        } else if (type === 'ice' && payload?.candidate) {
          try {
            const candidateObj = payload.candidate;
            if (candidateObj) await pc.addIceCandidate(new RTCIceCandidate(candidateObj));
          } catch (e) { console.warn('addIceCandidate failed', e); }
        } else if (type === 'invite') {
          // For caller we might ignore; callee will get invite as trigger
        } else if (type === 'hangup') {
          onClose();
        }
      } catch (e) {
        console.warn('handleSignal error', e);
      }
    };

    (async () => {
      // set up listener for signals
      signalsUnsubRef.current = listenSignals(call.id, (d) => {
        // Firestore signal documents may include { type, payload }
        const t = d.type;
        const p = d.payload || d;
        handleSignal({ type: t, payload: p });
      });

      // If caller, create offer
      if (call.role === 'caller') {
        await startLocalMedia();
        try {
          const pc = pcRef.current || createPeerConnection();
          if (!pc || pc.signalingState === 'closed') {
            console.warn('PeerConnection is closed before createOffer, skipping offer');
          } else {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            const sdpPayload = pc.localDescription ? { type: pc.localDescription.type, sdp: pc.localDescription.sdp } : null;
            await writeSignalDirect(call.id, 'offer', { from: currentUser.id, sdp: sdpPayload });
          }
        } catch (e) {
          console.warn('createOffer/send offer failed', e);
        }
      }
    })();

    return () => {
      mounted = false;
      try { if (signalsUnsubRef.current) signalsUnsubRef.current(); } catch (e) {}
      try { if (pcRef.current) pcRef.current.getSenders().forEach(s => s.track && s.track.stop()); } catch (e) {}
      try { if (pcRef.current) pcRef.current.close(); } catch (e) {}
      pcRef.current = null;
    };
  }, [call?.id, call?.role, currentUser?.id, mode, onClose]);

  useEffect(() => {
    if (!usingAgora) return;
    try {
      const { audioTrack } = agoraClient.getLocalTracks();
      if (audioTrack && typeof audioTrack.setEnabled === 'function') {
        audioTrack.setEnabled(!muted);
      }
    } catch (e) {}
  }, [muted, usingAgora]);

  const handleHangup = async () => {
    try {
      await writeSignalDirect(call.id, 'hangup', { from: currentUser.id });
      await updateCallStatus(call.id, 'ended');
    } catch (e) {}
    if (usingAgora) {
      try { await agoraClient.leaveChannel(); } catch (e) {}
    }
    if (pcRef.current) {
      try { pcRef.current.getSenders().forEach(s => s.track && s.track.stop()); } catch (e) {}
      try { pcRef.current.close(); } catch (e) {}
    }
    onClose();
  };

  return (
    <div className="active-call-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 12 }}>
      <div className="active-call" style={{ width: 'min(96vw, 980px)', background: '#111b21', color: '#e9edef', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div className="active-call-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{contact?.name || call?.contact?.name || 'Call'}</h4>
          <button className="close" onClick={handleHangup} style={{ background: 'transparent', border: 0, color: '#d1d7db', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div className="active-call-body" style={{ padding: 12 }}>
          {usingAgora ? (
            <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', background: '#0b141a' }}>
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                <div ref={remoteVideoRef} style={{ position: 'absolute', inset: 0 }} />
              </div>
              <div style={{ position: 'absolute', right: 12, bottom: 12, width: '28%', maxWidth: 220, minWidth: 110, aspectRatio: '4 / 3', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.35)', background: '#000' }}>
                <div ref={localVideoRef} style={{ width: '100%', height: '100%' }} />
              </div>
              <div style={{ position: 'absolute', left: 12, top: 12, background: 'rgba(0,0,0,0.45)', color: '#fff', padding: '6px 10px', borderRadius: 999, fontSize: 12 }}>
                {mode === 'video' ? 'Video call' : 'Voice call'} • {agoraConnected ? 'Connected' : 'Connecting...'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12 }}>
              <div className="active-avatar" style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: '#233138', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 600 }}>
                {contact?.avatar ? <img src={contact.avatar} alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (contact?.name || 'U').charAt(0)}
              </div>
              <div className="active-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="active-mode" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, opacity: 0.9 }}>{mode === 'voice' ? <Phone /> : <VideoCamera />} {mode.toUpperCase()}</div>
                <div className="active-status" style={{ fontSize: 13, opacity: 0.8 }}>{remoteStream ? 'Connected' : 'Connecting...'}</div>
              </div>
            </div>
          )}
        </div>
        <div className="active-call-controls" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setMuted(!muted)} className={muted ? 'active' : ''} style={{ background: muted ? '#27343a' : '#1f2c34', border: '1px solid rgba(255,255,255,0.08)', color: '#d1d7db', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}>
            <Microphone style={{ marginRight: 6 }} /> {muted ? 'Unmute' : 'Mute'}
          </button>
          <button onClick={() => setSpeaker(!speaker)} className={speaker ? 'active' : ''} style={{ background: speaker ? '#27343a' : '#1f2c34', border: '1px solid rgba(255,255,255,0.08)', color: '#d1d7db', padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}>
            <SpeakerHigh style={{ marginRight: 6 }} /> Speaker
          </button>
          <button onClick={handleHangup} className="hangup" style={{ background: '#b3261e', border: 0, color: '#fff', padding: '8px 14px', borderRadius: 10, cursor: 'pointer' }}>End</button>
        </div>
      </div>
    </div>
  );
}
