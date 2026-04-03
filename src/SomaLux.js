// SomaLux.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { FeatureFlagsProvider } from "./context/FeatureFlagsContext";
import UserUploadPage from "./SomaLux/User/UserProfile/UserUploadPage";
import { SettingsPanel } from "./SomaLux/Settings/SettingsPanel";
import { BookManagement } from "./SomaLux/BookDashboard/BookManagement";
import { Onboarding } from "./SomaLux/Onboarding/Onboarding";
import { BooksAdmin } from "./SomaLux/Books/Admin/BooksAdmin";
import ReadingDashboard from "./SomaLux/Books/ReadingDashboard/ReadingDashboard";
import { EmailSender } from "./SomaLux/Admin/EmailSender";
import ChatMe from "./ChatMe";
import SuspendedPage from "./SomaLux/SuspendedPage";
import { useSuspensionStatus } from "./hooks/useSuspensionStatus";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UserRequestPageNew = React.lazy(() => import('./SomaLux/User/UserProfile/UserRequestPageNew'));
const UserAdPage = React.lazy(() => import('./SomaLux/User/UserProfile/UserAdPage'));

// Wrapper component to check suspension status
function AppContent() {
  const { isSuspended, suspendedReason, isLoading } = useSuspensionStatus();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Get user email for display
    const getUserEmail = async () => {
      try {
        const { data: { user } } = await (await import('./SomaLux/Books/supabaseClient')).supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email);
        }
      } catch (err) {
        console.error('Error getting user email:', err);
      }
    };
    getUserEmail();
  }, []);

  // Show loading state while checking suspension
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#111b21',
        color: '#e9edef',
        fontSize: 18,
      }}>
        Loading...
      </div>
    );
  }

  // Show suspended page if user is suspended
  if (isSuspended) {
    return <SuspendedPage userEmail={userEmail} suspendedReason={suspendedReason} />;
  }

  // Otherwise show normal app routes
  return (
    <Routes>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/BookManagement" replace />} />

      {/* Onboarding */}
      <Route path="/onboarding" element={<Onboarding />} />


      {/* User */}
     
      <Route path="/user/upload" element={<UserUploadPage />} />
      <Route path="/user/upload/:tabType" element={<UserUploadPage />} />
      <Route path="/user/request" element={<UserRequestPageNew />} />
      <Route path="/user/request/:tabType" element={<UserRequestPageNew />} />
      <Route path="/user/ad" element={<React.Suspense fallback={<div>Loading...</div>}><UserAdPage /></React.Suspense>} />
      <Route path="/SettingsPanel" element={<SettingsPanel />} />

      {/* Books */}
      <Route path="/BookManagement" element={<BookManagement />} />
      <Route path="/BookManagement/:tab" element={<BookManagement />} />
      <Route path="/books/admin/*" element={<BooksAdmin />} />
      <Route path="/past-papers/admin" element={<Navigate to="/books/admin/content?tab=pastpapers" replace />} />
      <Route path="/books/reading-dashboard" element={<ReadingDashboard />} />

      {/* Email */}
      <Route path="/admin/email" element={<EmailSender />} />

      {/* ChatMe - Real-time Messaging */}
      <Route path="/chatme/*" element={<ChatMe />} />
    </Routes>
  );
}

export function SomaLux() {
    return (
        <FeatureFlagsProvider>
            <div className="SomaLux">
                {/* Global Toasts */}
                <ToastContainer
                    position="top-right"
                    autoClose={4000}
                    hideProgressBar={false}
                    closeButton={false}
                    pauseOnHover
                />

                <Router>
                    <AppContent />
                </Router>
            </div>
        </FeatureFlagsProvider>
    );
}
