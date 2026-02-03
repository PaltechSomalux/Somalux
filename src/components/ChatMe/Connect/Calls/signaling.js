/* eslint-disable no-undef */
import { collection, doc, addDoc, setDoc, onSnapshot, updateDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase';

// Simple Firestore-based signaling helper (POC).
// Writes a call document to `calls/{callId}` and signaling messages to `calls/{callId}/signals`.

export async function createCallRecord(callData) {
  // callData: { initiator: {id,name}, participants: [{id,name}], mode }
  const callsRef = collection(db, 'calls');
  const participantIds = [
    callData?.initiator?.id,
    ...((callData?.participants || []).map(p => p?.id).filter(Boolean) || [])
  ].filter(Boolean);
  const docRef = await addDoc(callsRef, {
    ...callData,
    participantsIds: participantIds,
    status: 'ringing',
    createdAt: serverTimestamp()
  });
  return { id: docRef.id, ref: docRef };
}

export async function updateCallStatus(callId, status) {
  try {
    const callRef = doc(db, 'calls', callId);
    await updateDoc(callRef, { status, updatedAt: serverTimestamp() });
  } catch (e) {
    console.warn('updateCallStatus failed', e);
  }
}

export async function sendSignal(callId, payload) {
  const signalsRef = collection(db, 'calls', callId, 'signals');
  const docRef = await addDoc(signalsRef, {
    ...payload,
    timestamp: serverTimestamp()
  });
  return docRef.id;
}

export function listenSignals(callId, onMessage) {
  const q = query(collection(db, 'calls', callId, 'signals'), orderBy('timestamp'));
  const unsub = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const data = change.doc.data();
        onMessage({ id: change.doc.id, ...data });
      }
    });
  }, (err) => console.warn('listenSignals error', err));
  return unsub;
}

export async function writeSignalDirect(callId, type, payload = {}) {
  return sendSignal(callId, { type, payload });
}

export function listenIncomingCallsFor(userId, contactId, onIncoming) {
  if (!userId) return () => {};
  const q = query(
    collection(db, 'calls'),
    where('participantsIds', 'array-contains', userId)
  );
  const unsub = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const data = change.doc.data();
        if (data?.status !== 'ringing') return;
        // Determine the other participant in this call relative to userId
        const ids = Array.isArray(data.participantsIds) ? data.participantsIds : [];
        const otherId = ids.find(id => id && id !== userId) || data?.initiator?.id;
        const involvesContact = contactId ? (otherId === contactId) : true;
        const isCaller = data?.initiator?.id === userId;
        if (involvesContact && !isCaller) {
          onIncoming({ id: change.doc.id, ...data });
        }
      }
    });
  }, (err) => console.warn('listenIncomingCallsFor error', err));
  return unsub;
}
