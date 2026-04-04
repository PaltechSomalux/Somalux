import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './Books/supabaseClient';

const SuspendedPage = ({ userEmail = '', suspendedReason = '' }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#111b21',
      color: '#e9edef',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: 500,
        padding: 40,
        backgroundColor: '#202c33',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Lock Icon */}
        <div style={{
          fontSize: 80,
          marginBottom: 20,
        }}>
          🔒
        </div>

        <h1 style={{
          margin: '0 0 12px 0',
          fontSize: 32,
          fontWeight: 700,
          color: '#ff6b6b',
        }}>
          Account Suspended
        </h1>

        <p style={{
          margin: '0 0 24px 0',
          fontSize: 16,
          color: '#8696a0',
          lineHeight: 1.6,
        }}>
          Your account has been suspended and you do not have access to SomaLux resources.
        </p>

        {userEmail && (
          <div style={{
            backgroundColor: '#111b21',
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 13,
            color: '#cfd8dc',
            wordBreak: 'break-all',
          }}>
            <strong>Email:</strong> {userEmail}
          </div>
        )}

        {suspendedReason && (
          <div style={{
            backgroundColor: '#111b21',
            padding: 16,
            borderRadius: 8,
            marginBottom: 20,
            textAlign: 'left',
            fontSize: 13,
            color: '#8696a0',
            borderLeft: '4px solid #ff6b6b',
          }}>
            <strong style={{ color: '#e9edef' }}>Reason for Suspension:</strong>
            <p style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>
              {suspendedReason}
            </p>
          </div>
        )}

        <div style={{
          backgroundColor: '#111b21',
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
          fontSize: 13,
          color: '#8696a0',
          lineHeight: 1.6,
        }}>
          <p style={{ margin: 0 }}>
            If you believe this is a mistake or have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuspendedPage;
