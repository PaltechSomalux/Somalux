import React, { useState } from 'react';
import { FaRegHeart, FaRegStar, FaHeart, FaMusic, FaFilm, FaMountain, FaGift } from 'react-icons/fa';

export const GiftModal = ({ setShowGiftModal }) => {
  const [giftSelection, setGiftSelection] = useState(null);
  const giftOptions = [
    { id: 1, name: 'Virtual Coffee', icon: <FaRegHeart />, price: 1 },
    { id: 2, name: 'Digital Rose', icon: <FaRegStar />, price: 2 },
    { id: 3, name: 'Compatibility Report', icon: <FaHeart />, price: 5 },
    { id: 4, name: 'Super Like Pack', icon: <FaMusic />, price: 10 },
    { id: 5, name: 'Spotify Playlist', icon: <FaFilm />, price: 3 },
    { id: 6, name: 'Movie Night', icon: <FaMountain />, price: 7 },
    { id: 7, name: 'Adventure Token', icon: <FaGift />, price: 8 },
    { id: 8, name: 'Mystery Gift', icon: <FaGift />, price: 15 }
  ];

  return (
    <div className="modal-overlay" onClick={() => setShowGiftModal(false)}>
      <div className="gift-modal" onClick={e => e.stopPropagation()}>
        <h2>Send a Gift</h2>
        <p>Choose a gift to send to your match</p>
        <div className="gift-options">
          {giftOptions.map(gift => (
            <div 
              key={gift.id}
              className={`gift-option ${giftSelection?.id === gift.id ? 'selected' : ''}`}
              onClick={() => setGiftSelection(gift)}
            >
              <div className="gift-icon">{gift.icon}</div>
              <div className="gift-name">{gift.name}</div>
              <div className="gift-price">{gift.price} credits</div>
            </div>
          ))}
        </div>
        <div className="gift-actions">
          <button 
            className="cancel-gift"
            onClick={() => setShowGiftModal(false)}
          >
            Cancel
          </button>
          <button 
            className="send-gift"
            onClick={() => {
              // Handle sending gift
              setShowGiftModal(false);
            }}
            disabled={!giftSelection}
          >
            Send Gift
          </button>
        </div>
      </div>
    </div>
  );
};

