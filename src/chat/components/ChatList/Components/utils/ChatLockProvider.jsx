import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../../../../../supabase";
import { SupabaseChatService } from '../../../../services/SupabaseChatService';
import "./ChatLock.css";

const ChatLockContext = createContext();

export const ChatLockProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [showConfirmLockModal, setShowConfirmLockModal] = useState(false); // New state for confirm lock modal
  const [pinInput, setPinInput] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState(null);
  const [unlockCallback, setUnlockCallback] = useState(null);
  const [lockCallback, setLockCallback] = useState(null); // New callback for locking
  const [userUid, setUserUid] = useState(null);
  const [pinExists, setPinExists] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        // console.log("ChatLockProvider: User authenticated, UID:", user.id);
        setUserUid(user.id);
      } else {
        console.log("ChatLockProvider: No user authenticated");
        setUserUid(null);
        setIsAuthenticated(false);
        setPinExists(false);
      }
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserUid(session.user.id);
      } else {
        setUserUid(null);
        setIsAuthenticated(false);
        setPinExists(false);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userUid) return;

    const checkPinExists = async () => {
      try {
        const pin = await SupabaseChatService.getPIN(userUid);
        if (pin) {
          setPinExists(true);
          setIsAuthenticated(false); // Locked by default until user unlocks
          console.log("✅ PIN exists — lock active");
        } else {
          setPinExists(false);
          // console.log("ℹ️ No PIN set yet — user must create one");
        }
      } catch (err) {
        console.error("ChatLockProvider: Error checking PIN:", err);
        showToast("Error checking PIN status", "error");
      }
    };

    checkPinExists();
  }, [userUid]);

  const showToast = (msg, type = "info") => {
    console.log("ChatLockProvider: Showing toast:", msg, type);
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const openSetPinModal = (callback) => {
    if (pinExists) {
      showToast("PIN already set. Please unlock or reset it.", "info");
      console.log("ChatLockProvider: Attempted to set PIN but one already exists");
      return;
    }

    console.log("ChatLockProvider: Opening set PIN modal, userUid:", userUid);
    setIsSettingPin(true);
    setPinInput("");
    setConfirmPin("");
    setErrorMessage("");
    setUnlockCallback(() => callback);
    setShowPinModal(true);
  };

  const openUnlockModal = (callback) => {
    console.log("ChatLockProvider: Opening unlock modal, callback provided:", !!callback);
    setIsSettingPin(false);
    setPinInput("");
    setErrorMessage("");
    setUnlockCallback(() => callback);
    setShowPinModal(true);
  };

  const openConfirmLockModal = (callback) => {
    console.log("ChatLockProvider: Opening confirm lock modal");
    setShowConfirmLockModal(true);
    setLockCallback(() => callback);
  };

  const handleCloseModal = () => {
    setShowPinModal(false);
    setShowConfirmLockModal(false); // Close confirm lock modal
    setPinInput("");
    setConfirmPin("");
    setErrorMessage("");
    setUnlockCallback(null);
    setLockCallback(null); // Clear lock callback
  };

  const handleSetPin = async () => {
    if (!userUid) {
      setErrorMessage("No user logged in");
      console.log("ChatLockProvider: No user logged in");
      return;
    }
    if (pinInput.length < 4) {
      setErrorMessage("PIN must be at least 4 digits");
      console.log("ChatLockProvider: PIN too short");
      return;
    }
    if (pinInput !== confirmPin) {
      setErrorMessage("PINs don't match");
      console.log("ChatLockProvider: PINs don't match");
      return;
    }

    try {
      console.log(`ChatLockProvider: Saving PIN for user ${userUid}`);
      await SupabaseChatService.setPIN(userUid, pinInput);

      setPinExists(true);
      setIsAuthenticated(true);
      setShowPinModal(false);
      showToast("✅ PIN saved successfully!", "success");
      console.log(`ChatLockProvider: PIN saved for user ${userUid}`);
      unlockCallback?.();
      setUnlockCallback(null);
    } catch (err) {
      console.error("ChatLockProvider: Error saving PIN:", err);
      setErrorMessage("Failed to save PIN");
      showToast("Failed to save PIN", "error");
    }
  };

  const handleUnlock = async () => {
    if (!userUid) {
      setErrorMessage("No user logged in");
      console.log("ChatLockProvider: No user logged in for unlock");
      return;
    }

    try {
      console.log(`ChatLockProvider: Verifying PIN for user ${userUid}`);
      const storedPin = await SupabaseChatService.getPIN(userUid);

      if (!storedPin) {
        setErrorMessage("No PIN set. Please set a PIN first.");
        console.log("ChatLockProvider: No PIN set for unlock");
        showToast("No PIN set. Please set a PIN first.", "error");
        return;
      }

      if (pinInput === storedPin) {
        setShowPinModal(false);
        setIsAuthenticated(true);
        showToast("🔓 Chat unlocked successfully.", "success");
        console.log(`ChatLockProvider: PIN verified, unlocking chat for user ${userUid}`);
        unlockCallback?.();
        setUnlockCallback(null);
      } else {
        setErrorMessage("❌ Wrong PIN");
        showToast("❌ Wrong PIN", "error");
        console.log("ChatLockProvider: Wrong PIN entered");
      }
    } catch (err) {
      console.error("ChatLockProvider: Error verifying PIN:", err);
      setErrorMessage("Failed to verify PIN");
      showToast("Failed to verify PIN", "error");
    }
  };

  const handleConfirmLock = () => {
    setShowConfirmLockModal(false);
    lockCallback?.();
    setLockCallback(null);
    showToast("Chat locked successfully 🔒", "success");
  };

  const resetPin = async () => {
    if (!userUid) {
      showToast("No user logged in", "error");
      return;
    }
    try {
      await SupabaseChatService.resetPIN(userUid);
      setPinExists(false);
      setIsAuthenticated(false);
      showToast("PIN reset successfully.", "success");
      console.log("ChatLockProvider: PIN reset successfully");
    } catch (err) {
      console.error("ChatLockProvider: Failed to reset PIN:", err);
      showToast("Failed to reset PIN", "error");
    }
  };

  const value = {
    isAuthenticated,
    showPinModal,
    isSettingPin,
    pinInput,
    setPinInput,
    confirmPin,
    setConfirmPin,
    errorMessage,
    openSetPinModal,
    openUnlockModal,
    openConfirmLockModal, // Export new function
    handleSetPin,
    handleUnlock,
    handleConfirmLock, // Export new function
    resetPin,
    showToast,
    pinExists,
  };

  return (
    <ChatLockContext.Provider value={value}>
      {children}
      {showPinModal && (
        <div className="chatlock-modal-overlay">
          <div className="chatlock-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chatlock-modal-header">
              <h3>{isSettingPin ? "🔒 Set Chat PIN" : "🔓 Unlock Chat"}</h3>
              <button onClick={handleCloseModal} className="chatlock-close-btn">×</button>
            </div>
            <div className="chatlock-pin-inputs">
              <input
                type="password"
                maxLength="6"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder={isSettingPin ? "Enter 4–6 digit PIN" : "Enter PIN"}
                className="chatlock-pin-field"
                autoFocus
              />
              {isSettingPin && (
                <input
                  type="password"
                  maxLength="6"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Confirm PIN"
                  className="chatlock-pin-field"
                />
              )}
            </div>
            {errorMessage && <div className="chatlock-error">{errorMessage}</div>}
            <div className="chatlock-buttons">
              <button className="chatlock-btn-secondary" onClick={handleCloseModal}>
                Cancel
              </button>
              {isSettingPin ? (
                <button className="chatlock-btn-primary" onClick={handleSetPin}>
                  Set PIN & Lock
                </button>
              ) : (
                <button className="chatlock-btn-primary" onClick={handleUnlock}>
                  Unlock
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showConfirmLockModal && (
        <div className="chatlock-modal-overlay">
          <div className="chatlock-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chatlock-modal-header">
              <h3>🔒 Confirm Chat Lock</h3>
              <button onClick={handleCloseModal} className="chatlock-close-btn">×</button>
            </div>
            <div className="chatlock-pin-inputs">
              <p>Are you sure you want to lock this chat? It will require a PIN to access.</p>
            </div>
            <div className="chatlock-buttons">
              <button className="chatlock-btn-secondary" onClick={handleCloseModal}>
                Cancel
              </button>
              <button className="chatlock-btn-primary" onClick={handleConfirmLock}>
                Lock Chat
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className={`chatlock-toast ${toast.type}`}>{toast.msg}</div>}
    </ChatLockContext.Provider>
  );
};

export const useChatLock = () => {
  const ctx = useContext(ChatLockContext);
  if (!ctx) throw new Error("useChatLock must be used within ChatLockProvider");
  return ctx;
};

export default ChatLockProvider;
