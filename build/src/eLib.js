import React, { useCallback, useEffect, useState } from 'react';
import { FiLock } from 'react-icons/fi';
import { ChatLockProvider } from './KissMe/Components/utils/ChatLockProvider';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Navbar1 } from "./Phlip/NavigationBar/Navbar1";
import "./Phlip/NavigationBar/Navbar1.css";
import { Registration } from "./Phlip/User/Registration/Registration";
import { MyProfile } from "./Phlip/User/UserProfile/MyProfile";
import { SettingsPanel } from "./Phlip/Settings/SettingsPanel";
import { University } from "./Phlip/University/University";
import { PaperPanel } from "./Phlip/PastPapers/Pastpapers";
import { LectureDashboard } from "./Nicasio/LecturesPanel";
import { BookManagement } from "./Phlip/BookDashboard/BookManagement";
import { SocialDashboard } from "./Phlip/Blacks/Blacks";
import { ConnectMe } from "./FuckOff/ConnectMe";
import { UserProfile } from "./Phlip/NavigationBar/MyProfile";
import { Onboarding } from "./Phlip/Onboarding/Onboarding";
import { BooksAdmin } from "./Phlip/Books/Admin/BooksAdmin";
import ReadingDashboard from "./Phlip/Books/ReadingDashboard/ReadingDashboard";
import { SubscriptionThanks } from "./Phlip/Subscriptions/SubscriptionThanks";
import { EmailSender } from "./Phlip/Admin/EmailSender";

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 🔥 GLOBAL FCM IMPORTS
import { onMessage } from 'firebase/messaging';
import { messaging } from './firebase';  // ✅ CHANGE TO THIS // 🔥 ADJUST PATH TO YOUR firebase.js
import { auth, db } from './firebase';
import { setGlobalToastHandler } from './utils/toastBus';
import { showGlobalToast } from './utils/toastBus';
import { useFCMToken } from './hooks/useFCMToken';
import { WebSocketProvider, useSharedWebSocket } from './Cult/WebSocketProvider';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';

// Reply Toast Component
const ReplyToast = ({ foregroundData, onSendReply, onClose, onView }) => {
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [replyLocked, setReplyLocked] = useState(false);

    useEffect(() => {
        let mounted = true;
        const checkLock = async () => {
            try {
                const isGroup = foregroundData.isGroup === true || foregroundData.type === 'new_group_message';
                if (!isGroup || !foregroundData.chatId) {
                    if (mounted) setReplyLocked(false);
                    return;
                }
                const gref = doc(db, 'groups', String(foregroundData.chatId));
                const snap = await getDoc(gref);
                if (!snap.exists()) { if (mounted) setReplyLocked(false); return; }
                const g = snap.data() || {};
                const onlyAdmins = !!g.onlyAdminsCanSend;
                if (!onlyAdmins) { if (mounted) setReplyLocked(false); return; }
                const user = auth.currentUser;
                const admins = Array.isArray(g.admins) ? g.admins : [];
                const isAdmin = !!(user && (g.createdBy === user.uid || admins.includes(user.uid)));
                if (mounted) setReplyLocked(!isAdmin);
            } catch (_) {
                if (mounted) setReplyLocked(false);
            }
        };
        checkLock();
        return () => { mounted = false; };
    }, [foregroundData?.chatId, foregroundData?.isGroup, foregroundData?.type]);

    const handleSendReply = async () => {
        if (!replyText.trim() || isSending) return;
        
        setIsSending(true);
        try {
            await onSendReply(replyText.trim());
            setReplyText('');
            
            // Show success toast
            onClose();
        } catch (error) {
            console.error('Failed to send reply:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendReply();
        }
    };

    // Build title: "SenderName · GroupName" for groups, "SenderName" for chats
    const displayTitle = foregroundData.isGroup && foregroundData.groupName
        ? `${foregroundData.senderName || 'Someone'} · ${foregroundData.groupName}`
        : (foregroundData.senderName || foregroundData.message || 'New message');

    return (
        <div style={{
            padding: '14px 16px',
            minWidth: '340px',
            maxWidth: '400px',
            background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
            position: 'relative'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginBottom: '10px'
            }}>
                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: foregroundData.isGroup
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '18px',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                    {displayTitle.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px'
                    }}>
                        <div style={{
                            fontSize: '15px',
                            fontWeight: '700',
                            color: '#1f2937',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {displayTitle}
                        </div>
                        <div style={{
                            background: foregroundData.isGroup ? '#f59e0b' : '#10b981',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '12px',
                            flexShrink: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            {foregroundData.isGroup ? 'GRP' : '1:1'}
                        </div>
                    </div>
                    <div style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                    }}>
                        {foregroundData.subtext || foregroundData.text || 'New message'}
                    </div>
                </div>
                {/* Close button */}
                <button
                    onClick={onClose}
                    aria-label="Close"
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 10,
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        border: 'none',
                        background: 'transparent',
                        color: '#6b7280',
                        fontSize: 16,
                        cursor: 'pointer',
                        lineHeight: 1
                    }}
                >
                    ×
                </button>
            </div>

            {/* Reply input or lock notice */}
            {replyLocked ? (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                    color: '#6b7280',
                    borderTop: '1px dashed #e5e7eb', marginTop: 10
                }}>
                    <FiLock style={{ color: '#d97706' }} />
                    <span style={{ fontSize: 13 }}>Only admins can send messages</span>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                }}>
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Quick reply..."
                        style={{
                            flex: 1,
                            padding: '9px 14px',
                            border: '1.5px solid #d1d5db',
                            borderRadius: '22px',
                            fontSize: '13px',
                            resize: 'none',
                            outline: 'none',
                            fontFamily: 'inherit',
                            minHeight: '38px',
                            maxHeight: '76px',
                            lineHeight: '1.5',
                            background: '#ffffff',
                            color: '#1f2937',
                            transition: 'border-color 0.15s'
                        }}
                        onFocus={e => e.target.style.borderColor = '#667eea'}
                        onBlur={e => e.target.style.borderColor = '#d1d5db'}
                        rows={1}
                    />
                    <button
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || isSending}
                        style={{
                            padding: '9px 18px',
                            backgroundColor: replyText.trim() && !isSending ? '#667eea' : '#d1d5db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '22px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: replyText.trim() && !isSending ? 'pointer' : 'not-allowed',
                            transition: 'all 0.15s',
                            minWidth: '68px',
                            height: '38px',
                            boxShadow: replyText.trim() && !isSending ? '0 2px 8px rgba(102, 126, 234, 0.3)' : 'none'
                        }}
                        onMouseOver={e => {
                            if (replyText.trim() && !isSending) e.currentTarget.style.backgroundColor = '#5568d3';
                        }}
                        onMouseOut={e => {
                            if (replyText.trim() && !isSending) e.currentTarget.style.backgroundColor = '#667eea';
                        }}
                    >
                        {isSending ? '...' : 'Send'}
                    </button>
                </div>
            )}
        </div>
    );
};

const WSSetup = () => {
    const { setCurrentUser } = useSharedWebSocket();
    useEffect(() => {
        const unsub = auth.onAuthStateChanged((user) => {
            if (user) {
                setCurrentUser({ uid: user.uid, name: user.displayName || user.email || 'User' });
            }
        });
        return () => unsub();
    }, [setCurrentUser]);
    return null;
};

const WSChatAutoJoin = () => {
    const { joinChat } = useSharedWebSocket();
    useEffect(() => {
        let unsubChats = null;
        const unsubAuth = auth.onAuthStateChanged((user) => {
            if (unsubChats) {
                unsubChats();
                unsubChats = null;
            }
            if (user) {
                const coll = collection(db, 'userChats', user.uid, 'chats');
                unsubChats = onSnapshot(coll, (snap) => {
                    const contacts = snap.docs
                        .filter((d) => d.id !== 'trigger' && !d.data().isDeleted)
                        .map((d) => d.id);
                    contacts.forEach((contactUid) => {
                        const chatId = [user.uid, contactUid].sort().join('_');
                        joinChat(chatId, user.uid, user.displayName || user.email || 'User');
                    });
                });
            }
        });
        return () => {
            if (unsubChats) unsubChats();
            unsubAuth();
        };
    }, [joinChat]);
    return null;
};

function ELib() {
    // Ensure FCM token is generated and stored for the current user globally
    const { token: fcmToken } = useFCMToken();
    // 🔥 GLOBAL FOREGROUND TOAST HANDLER WITH REPLY FUNCTIONALITY
    const showGlobalForegroundToast = useCallback((foregroundData) => {
        console.log('🌍 GLOBAL TOAST TRIGGERED:', foregroundData);
        
        // Function to send reply
        const sendReply = async (replyText) => {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                console.error('No authenticated user');
                return;
            }

            try {
                const isGroup = foregroundData.isGroup === true || foregroundData.type === 'new_group_message';
                
                if (isGroup) {
                    // Guard: block if onlyAdminsCanSend and user is not admin
                    try {
                        const gref = doc(db, 'groups', String(foregroundData.chatId));
                        const gsnap = await getDoc(gref);
                        if (gsnap.exists()) {
                            const g = gsnap.data() || {};
                            if (g.onlyAdminsCanSend) {
                                const admins = Array.isArray(g.admins) ? g.admins : [];
                                const userIsAdmin = (g.createdBy === currentUser.uid) || admins.includes(currentUser.uid);
                                if (!userIsAdmin) {
                                    throw new Error('Only admins can send messages');
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('Reply blocked by admin-only setting');
                        return;
                    }
                    // Send group message
                    const response = await fetch('http://localhost:5000/send-group-message', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            groupId: foregroundData.chatId,
                            sender: currentUser.uid,
                            senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
                            text: replyText
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to send group message');
                    }
                } else {
                    // Send 1-on-1 message
                    const response = await fetch('http://localhost:5000/send', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            sender: currentUser.uid,
                            receiver: foregroundData.senderId,
                            text: replyText
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to send message');
                    }
                }

                console.log('✅ Reply sent successfully');
            } catch (error) {
                console.error('❌ Error sending reply:', error);
                throw error;
            }
        };

        toast(
            ({ closeToast }) => (
                <ReplyToast 
                    foregroundData={foregroundData}
                    onSendReply={sendReply}
                    onClose={closeToast}
                />
            ),
            {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                closeButton: false,
                style: {
                    borderRadius: '18px',
                    background: '#ffffff',
                    color: '#1f2937',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                    border: 'none',
                    padding: '0',
                    minHeight: '110px',
                    maxHeight: '190px',
                    overflow: 'hidden'
                },
            }
        );
    }, []);

    // 🔥 GLOBAL FOREGROUND LISTENER - Routed through toast-bus with dedupe and self-suppression
    useEffect(() => {
        console.log('🚀 FCM foreground listener ready');
        const unsubscribe = onMessage(messaging, (payload) => {
            try {
                if (payload?.data?.foreground) {
                    const fd = JSON.parse(payload.data.foreground);
                    // Inject messageId if provided for dedupe
                    if (payload.data.messageId) fd.messageId = payload.data.messageId;
                    // Suppress self-toasts
                    const currentUid = auth.currentUser?.uid || null;
                    const senderId = fd.senderId || fd.sender || null;
                    if (!(senderId && currentUid && String(senderId) === String(currentUid))) {
                        // Route through global toast bus for dedupe with WS
                        showGlobalToast(fd);
                    }
                } else {
                    // Fallback construct from data
                    const isGroup = payload?.data?.isGroup === 'true';
                    const fd = {
                        enabled: true,
                        position: 'top-right',
                        message: isGroup ? `${payload.data.senderName || 'New Friend'} in group` : `Message from ${payload.data.senderName || 'New Friend'}`,
                        subtext: payload?.data?.message || '',
                        duration: 4000,
                        chatId: payload?.data?.chatId,
                        senderId: payload?.data?.sender,
                        senderName: payload?.data?.senderName,
                        text: payload?.data?.message,
                        isGroup,
                        messageId: payload?.data?.messageId,
                        timestamp: Date.now(),
                    };
                    // Suppress self-toasts
                    const currentUid = auth.currentUser?.uid || null;
                    const senderId = fd.senderId || null;
                    if (!(senderId && currentUid && String(senderId) === String(currentUid))) {
                        // Route through global toast bus for dedupe with WS
                        showGlobalToast(fd);
                    }
                }
            } catch (e) {
                console.error('❌ Failed to handle FCM foreground message:', e);
            }
        });

        return () => {
            console.log('🛑 FCM foreground listener stopped');
            unsubscribe();
        };
    }, [showGlobalForegroundToast]);

    // 🌐 Register global toast handler so other modules (like WebSocketProvider) can trigger toasts instantly
    useEffect(() => {
        setGlobalToastHandler(showGlobalForegroundToast);
        return () => setGlobalToastHandler(null);
    }, [showGlobalForegroundToast]);

    return (
        <div className="eLib">
            <ChatLockProvider>
                <WebSocketProvider>
                    <WSSetup />
                    <WSChatAutoJoin />
                    <Router>
                        <Navbar1 />

                        <ToastContainer
                            position="top-right"
                            autoClose={4000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            closeButton={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            style={{ maxWidth: '350px' }}
                        />

                <Routes>
                    <Route path="/" element={<Navigate to="/BookManagement" replace />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/Registration" element={<Registration />} />
                    <Route path="/MyProfile" element={<MyProfile />} />
                    <Route path="/SettingsPanel" element={<SettingsPanel />} />
                    <Route path="/University" element={<University />} />
                    <Route path="/PaperPanel" element={<PaperPanel />} />
                    <Route path="/universities" element={<University />} />
                    <Route path="/papers" element={<PaperPanel />} />
                    <Route path="/LectureDashboard" element={<LectureDashboard />} />
                    <Route path="/BookManagement" element={<BookManagement />} />
                    <Route path="/books/admin/*" element={<BooksAdmin />} />
                    <Route path="/books/reading-dashboard" element={<ReadingDashboard />} />
                    <Route path="/SocialDashboard" element={<SocialDashboard />} />
                    <Route path="/ConnectMe" element={
                        <ConnectMe onForegroundToast={showGlobalForegroundToast} />
                    } />
                    <Route path="/profile" element={<UserProfile isProfilePage={true} />} />
                    <Route path="/settings" element={<UserProfile isSettingsPage={true} />} />
                    <Route path="/subscription/thanks" element={<SubscriptionThanks />} />
                    <Route path="/admin/email" element={<EmailSender />} />
                </Routes>
                </Router>
              </WebSocketProvider>
            </ChatLockProvider>
        </div>
    );
}

export default ELib;