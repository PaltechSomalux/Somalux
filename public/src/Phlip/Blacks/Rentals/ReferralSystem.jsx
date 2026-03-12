import React, { useState, useEffect } from 'react';
import { 
  Gift, Copy, Share, Check, Users, Money, TrendUp,
  WhatsappLogo, FacebookLogo, TwitterLogo, Envelope
} from 'phosphor-react';
import { createClient } from '@supabase/supabase-js';
import './ReferralSystem.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export const ReferralSystem = ({ user }) => {
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const REFERRAL_BONUS = 500; // KES

  useEffect(() => {
    loadReferralData();
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      // Get or create referral code
      let { data: existingCode, error: codeError } = await supabase
        .from('rental_referrals')
        .select('referral_code')
        .eq('referrer_id', user.uid)
        .single();

      if (codeError && codeError.code !== 'PGRST116') {
        throw codeError;
      }

      if (!existingCode) {
        // Generate new referral code
        const code = generateReferralCode(user.email || user.uid);
        const { data: newCode, error: insertError } = await supabase
          .from('rental_referrals')
          .insert([{
            referrer_id: user.uid,
            referral_code: code,
            bonus_status: 'pending'
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        setReferralCode(code);
      } else {
        setReferralCode(existingCode.referral_code);
      }

      // Load referral stats
      const { data: referralData, error: refError } = await supabase
        .from('rental_referrals')
        .select('*, referred:auth.users!referred_id(email)')
        .eq('referrer_id', user.uid);

      if (refError) throw refError;

      setReferrals(referralData || []);
      
      // Calculate total earnings
      const totalEarnings = (referralData || [])
        .filter(r => r.bonus_status === 'earned' || r.bonus_status === 'redeemed')
        .reduce((sum, r) => sum + (r.bonus_earned || 0), 0);
      
      setEarnings(totalEarnings);

    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = (identifier) => {
    const prefix = 'CC';
    const hash = identifier.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const code = Math.abs(hash).toString(36).toUpperCase().substring(0, 6);
    return `${prefix}${code}`;
  };

  const copyReferralCode = () => {
    const referralLink = `https://campuschumba.com/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const message = `🏠 Hey! I found amazing student accommodation on CampusChumba. Use my code ${referralCode} when you sign up and we both get KES ${REFERRAL_BONUS}! https://campuschumba.com/signup?ref=${referralCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaFacebook = () => {
    const url = `https://campuschumba.com/signup?ref=${referralCode}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareViaTwitter = () => {
    const text = `Find your perfect student room on CampusChumba! Use code ${referralCode} for KES ${REFERRAL_BONUS} bonus 🏠`;
    const url = `https://campuschumba.com/signup?ref=${referralCode}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = 'Get KES 500 on CampusChumba!';
    const body = `Hi!\n\nI found an awesome platform for finding student accommodation - CampusChumba!\n\nUse my referral code ${referralCode} when you sign up and we both get KES ${REFERRAL_BONUS}!\n\nSign up here: https://campuschumba.com/signup?ref=${referralCode}\n\nHappy house hunting! 🏠`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (loading) {
    return (
      <div className="referral-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="referral-system">
      {/* Header */}
      <div className="referral-header">
        <Gift size={40} weight="duotone" color="#00a884" />
        <h2>Refer & Earn</h2>
        <p>Share CampusChumba with friends and earn KES {REFERRAL_BONUS} for each signup!</p>
      </div>

      {/* Stats Cards */}
      <div className="referral-stats">
        <div className="stat-card-ref">
          <Users size={24} weight="duotone" />
          <div>
            <h3>{referrals.length}</h3>
            <p>Friends Referred</p>
          </div>
        </div>
        
        <div className="stat-card-ref">
          <Money size={24} weight="duotone" />
          <div>
            <h3>KES {earnings.toLocaleString()}</h3>
            <p>Total Earned</p>
          </div>
        </div>

        <div className="stat-card-ref">
          <TrendUp size={24} weight="duotone" />
          <div>
            <h3>KES {(referrals.filter(r => r.bonus_status === 'pending').length * REFERRAL_BONUS).toLocaleString()}</h3>
            <p>Pending</p>
          </div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="referral-code-section">
        <h3>Your Referral Code</h3>
        <div className="code-display">
          <div className="code-value">{referralCode}</div>
          <button 
            className={`copy-btn ${copied ? 'copied' : ''}`}
            onClick={copyReferralCode}
          >
            {copied ? <Check size={20} weight="bold" /> : <Copy size={20} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Share Options */}
      <div className="share-section">
        <h3>Share via</h3>
        <div className="share-buttons">
          <button className="share-btn whatsapp" onClick={shareViaWhatsApp}>
            <WhatsappLogo size={24} weight="fill" />
            <span>WhatsApp</span>
          </button>
          <button className="share-btn facebook" onClick={shareViaFacebook}>
            <FacebookLogo size={24} weight="fill" />
            <span>Facebook</span>
          </button>
          <button className="share-btn twitter" onClick={shareViaTwitter}>
            <TwitterLogo size={24} weight="fill" />
            <span>Twitter</span>
          </button>
          <button className="share-btn email" onClick={shareViaEmail}>
            <Envelope size={24} weight="fill" />
            <span>Email</span>
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="how-it-works">
        <h3>How It Works</h3>
        <ol>
          <li>
            <span className="step-number">1</span>
            <div>
              <h4>Share Your Code</h4>
              <p>Send your unique referral code to friends looking for accommodation</p>
            </div>
          </li>
          <li>
            <span className="step-number">2</span>
            <div>
              <h4>They Sign Up</h4>
              <p>When they register using your code and make their first booking</p>
            </div>
          </li>
          <li>
            <span className="step-number">3</span>
            <div>
              <h4>You Both Earn</h4>
              <p>You get KES {REFERRAL_BONUS} and your friend gets KES {REFERRAL_BONUS} off their rent!</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Referral History */}
      {referrals.length > 0 && (
        <div className="referral-history">
          <h3>Your Referrals ({referrals.length})</h3>
          <div className="referrals-list">
            {referrals.map((ref, index) => (
              <div key={index} className="referral-item">
                <div className="referral-info">
                  <div className="referral-avatar">
                    {(ref.referred?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5>{ref.referred?.email || 'User'}</h5>
                    <p>Joined {new Date(ref.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={`bonus-badge ${ref.bonus_status}`}>
                  {ref.bonus_status === 'earned' && `+KES ${ref.bonus_earned || REFERRAL_BONUS}`}
                  {ref.bonus_status === 'pending' && 'Pending'}
                  {ref.bonus_status === 'redeemed' && 'Redeemed'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
