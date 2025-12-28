// SomaLux.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import UserUploadPage from "./SomaLux/User/UserProfile/UserUploadPage";
import { SettingsPanel } from "./SomaLux/Settings/SettingsPanel";
import { BookManagement } from "./SomaLux/BookDashboard/BookManagement";
import { Onboarding } from "./SomaLux/Onboarding/Onboarding";
import { BooksAdmin } from "./SomaLux/Books/Admin/BooksAdmin";
import ReadingDashboard from "./SomaLux/Books/ReadingDashboard/ReadingDashboard";
import { SubscriptionThanks } from "./SomaLux/Subscriptions/SubscriptionThanks";
import { EmailSender } from "./SomaLux/Admin/EmailSender";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function SomaLux() {
    return (
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
                <Routes>

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/BookManagement" replace />} />

                    {/* Onboarding */}
                    <Route path="/onboarding" element={<Onboarding />} />
              

                    {/* User */}
                   
                    <Route path="/user/upload" element={<UserUploadPage />} />
                    <Route path="/user/upload/:tabType" element={<UserUploadPage />} />
                    <Route path="/SettingsPanel" element={<SettingsPanel />} />

                    {/* Books */}
                    <Route path="/BookManagement" element={<BookManagement />} />
                    <Route path="/books/admin/*" element={<BooksAdmin />} />
                    <Route path="/past-papers/admin" element={<Navigate to="/books/admin/content?tab=pastpapers" replace />} />
                    <Route path="/books/reading-dashboard" element={<ReadingDashboard />} />

                    {/* Subscription */}
                    <Route path="/subscription/thanks" element={<SubscriptionThanks />} />

                    {/* Email */}
                    <Route path="/admin/email" element={<EmailSender />} />
                </Routes>
            </Router>
        </div>
    );
}
