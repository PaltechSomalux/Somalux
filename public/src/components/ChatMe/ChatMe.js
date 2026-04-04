import React, { useCallback, useEffect, useState } from 'react';
import { FiLock } from 'react-icons/fi';
import { ChatLockProvider } from './ChatList/Components/utils/ChatLockProvider';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Supabase
import { supabase } from '../../supabase';
import { LoginModal } from './Chat/LoginModal';
import { showGlobalToast } from './utils/toastBus';
import { WebSocketProvider, useSharedWebSocket } from './Group/WebSocketProvider';
import { API_BASE } from './config';

// ConnectMe
import { ConnectMe } from './Connect/ConnectMe';

// Reply Toast
const ReplyToast = ({ foregroundData, onSendReply, onClose }) => {
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
                
                const { data: group, error } = await supabase
                    .from('groups')
                    .select('*')
                    .eq('id', String(foregroundData.chatId))
                    .single();
                    
                if (error || !group) {
                    if (mounted) setReplyLocked(false);
                    return;
                }

                const onlyAdmins = !!group.only_admins_can_send;
                if (!onlyAdmins) {
                    if (mounted) setReplyLocked(false);
                    return;
                }

                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) {
                    if (mounted) setReplyLocked(false);
                    return;
                }

                const { data: members } = await supabase
                    .from('group_members')
                    .select('role')
                    .eq('group_id', group.id)
                    .eq('user_id', user.id)
                    .single();

                const isAdmin = members?.role === 'admin';
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
            onClose();
        } catch (error) {
            if (error instanceof Error) {
                console.error('Failed to send reply:', error.message, error.stack);
            } else {
                console.error('Failed to send reply:', JSON.stringify(error));
            }
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
                    fontWeight: 700,
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
                            fontWeight: 700,
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

            {replyLocked ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    color: '#6b7280',
                    borderTop: '1px dashed #e5e7eb',
                    marginTop: 10
                }}>
                    <FiLock style={{ color: '#d97706' }} />
                    <span style={{ fontSize: 13 }}>Only admins can send messages</span>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
                            fontWeight: 700,
                            cursor: replyText.trim() && !isSending ? 'pointer' : 'not-allowed',
                            transition: 'all 0.15s',
                            minWidth: '68px',
                            height: '38px',
                            boxShadow: replyText.trim() && !isSending ? '0 2px 8px rgba(102, 126, 234, 0.3)' : 'none'
                        }}
                        onMouseOver={(e) => {
                            if (replyText.trim() && !isSending) e.currentTarget.style.backgroundColor = '#5568d3';
                        }}
                        onMouseOut={(e) => {
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

// WebSocket User Setup
const WSSetup = () => {
    const { setCurrentUser } = useSharedWebSocket();
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                // Provide richer user info to WS provider
                setCurrentUser({
                    id: session.user.id,
                    name: session.user.user_metadata?.name || session.user.email || 'User',
                    displayName: session.user.user_metadata?.name || null,
                    photoURL: session.user.user_metadata?.avatar_url || null,
                    email: session.user.email || null
                });
            } else {
                // Clear current user in WS provider when signed out
                setCurrentUser(null);
            }
        });
        return () => subscription?.unsubscribe();
    }, [setCurrentUser]);
    return null;
};

function ELib({ onChatSelected, onChatWindowActive, onBackFromChat }) {
    const [showLogin, setShowLogin] = React.useState(false);
    const [authError, setAuthError] = React.useState('');
    const [authSuccess, setAuthSuccess] = React.useState('');
    const [isAuthenticating, setIsAuthenticating] = React.useState(false);

    const showGlobalForegroundToast = useCallback((foregroundData) => {
        const sendReply = async (replyText) => {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error('Not authenticated');

            const isGroup = foregroundData.isGroup === true || foregroundData.type === 'new_group_message';

            if (isGroup) {
                const { data: group } = await supabase
                    .from('groups')
                    .select('*')
                    .eq('id', String(foregroundData.chatId))
                    .single();

                if (group && group.only_admins_can_send) {
                    const { data: member } = await supabase
                        .from('group_members')
                        .select('role')
                        .eq('group_id', group.id)
                        .eq('user_id', user.id)
                        .single();

                    if (member?.role !== 'admin') {
                        throw new Error('Only admins can send');
                    }
                }

                const response = await fetch(`${API_BASE}/api/chatme/send-group-message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        groupId: foregroundData.chatId,
                        sender: user.id,
                        senderName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                        text: replyText
                    }),
                });

                if (!response.ok) throw new Error('Failed to send group message');
            } else {
                const response = await fetch(`${API_BASE}/api/chatme/send-message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender: user.id,
                        receiver: foregroundData.senderId,
                        text: replyText
                    }),
                });

                if (!response.ok) throw new Error('Failed to send message');
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

    // Show login modal on startup if no Supabase auth user
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!session) {
                setShowLogin(true);
            } else {
                setShowLogin(false);
            }
        });
        return () => subscription?.unsubscribe();
    }, []);

    return (
        <div className="eLib">
            <LoginModal
                showLogin={showLogin}
                setShowLogin={setShowLogin}
                loginCredentials={{ email: '', password: '' }}
                setLoginCredentials={() => {}}
                authError={authError}
                authSuccess={authSuccess}
                isAuthenticating={isAuthenticating}
                onLogin={() => {}}
                setAuthError={setAuthError}
                setAuthSuccess={setAuthSuccess}
            />
            <ChatLockProvider>
                <WebSocketProvider>
                    <WSSetup />
                    <ConnectMe 
                        onForegroundToast={showGlobalForegroundToast} 
                        onChatSelected={onChatSelected}
                        onChatWindowActive={onChatWindowActive}
                        onBackFromChat={onBackFromChat}
                    />
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
                </WebSocketProvider>
            </ChatLockProvider>
        </div>
    );
}

export default ELib;