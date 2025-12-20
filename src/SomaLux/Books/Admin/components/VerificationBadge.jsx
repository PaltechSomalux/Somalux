import React from 'react';
import { FiCheck } from 'react-icons/fi';

/**
 * VerificationBadge Component (X.com style - simple circular)
 * Displays verification badge based on user subscription tier
 * 
 * Props:
 * - tier: 'basic' | 'premium' | 'premium_pro' (default: 'basic')
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - showLabel: boolean (default: false)
 * - showTooltip: boolean (default: true)
 */
const VerificationBadge = ({ 
  tier = 'basic', 
  size = 'md', 
  showLabel = false,
  showTooltip = true 
}) => {
  const sizeStyles = {
    sm: { iconSize: 10, badgeSize: 16 },
    md: { iconSize: 12, badgeSize: 20 },
    lg: { iconSize: 14, badgeSize: 24 }
  };

  const tierStyles = {
    basic: {
      bgColor: 'transparent',
      iconColor: '#8696a0',
      label: 'Basic',
      description: 'Standard user'
    },
    premium: {
      bgColor: '#1DA1F2',
      iconColor: 'white',
      label: 'Premium',
      description: 'Premium member with enhanced features'
    },
    premium_pro: {
      bgColor: '#FFB81C',
      iconColor: 'white',
      label: 'Premium Pro',
      description: 'Premium Pro member with all features'
    }
  };

  const style = sizeStyles[size] || sizeStyles.md;
  const tierStyle = tierStyles[tier] || tierStyles.basic;

  // Don't show badge for basic tier unless explicitly requested
  if (tier === 'basic' && !showLabel) {
    return null;
  }

  // Only show badge for premium and premium_pro
  if (tier === 'basic') {
    return null;
  }

  const badgeContent = (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: style.badgeSize,
        height: style.badgeSize,
        borderRadius: '50%',
        backgroundColor: tierStyle.bgColor,
        border: 'none',
        padding: 0,
      }}
      title={tierStyle.label}
    >
      <FiCheck 
        size={style.iconSize} 
        color={tierStyle.iconColor}
        strokeWidth={3}
        style={{ display: 'flex' }}
      />
    </div>
  );

  if (showTooltip && tier !== 'basic') {
    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        {badgeContent}
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            padding: '6px 10px',
            backgroundColor: '#1a1a1a',
            color: tierStyle.bgColor,
            borderRadius: 4,
            fontSize: 10,
            whiteSpace: 'nowrap',
            border: `1px solid ${tierStyle.bgColor}`,
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.2s',
            zIndex: 1000
          }}
          className="tooltip-text"
        >
          {tierStyle.description}
        </div>
      </div>
    );
  }

  return badgeContent;
};

export default VerificationBadge;
