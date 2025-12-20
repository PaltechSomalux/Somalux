import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiBookmark } from 'react-icons/fi';
import {
  WishlistPanel,
  WishlistHeader,
  WishlistTitle,
  WishlistCloseButton,
  WishlistToggle,
  WishlistCount,
  WishlistBooks,
  WishlistBookItem,
  WishlistBookCover,
  WishlistBookInfo,
  WishlistEmpty
} from './BookPanel.styles';

export const WishList = ({ 
  books, 
  wishlist, 
  toggleWishlist, 
  viewBookDetails 
}) => {
  const [showWishlist, setShowWishlist] = useState(false);

  const wishlistBooks = books.filter(book => wishlist.includes(book.id));

  return (
    <>
      <WishlistToggle 
        onClick={() => setShowWishlist(!showWishlist)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FiBookmark />
        <WishlistCount>{wishlist.length}</WishlistCount>
      </WishlistToggle>

      <AnimatePresence>
        {showWishlist && (
          <WishlistPanel
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <WishlistHeader>
              <WishlistTitle>Your Wishlist</WishlistTitle>
              <WishlistCloseButton onClick={() => setShowWishlist(false)}>
                <FiX size={20} />
              </WishlistCloseButton>
            </WishlistHeader>

            <WishlistBooks>
              {wishlistBooks.length > 0 ? (
                wishlistBooks.map(book => (
                  <WishlistBookItem 
                    key={book.id}
                    onClick={() => {
                      viewBookDetails(book);
                      setShowWishlist(false);
                    }}
                    whileHover={{ x: 5 }}
                  >
                    <WishlistBookCover src={book.coverImage} alt={book.title} />
                    <WishlistBookInfo>
                      <h4>{book.title}</h4>
                      <p>{book.author}</p>
                    </WishlistBookInfo>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(book.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        marginLeft: 'auto'
                      }}
                    >
                      <FiX size={18} />
                    </button>
                  </WishlistBookItem>
                ))
              ) : (
                <WishlistEmpty>
                  <FiBookmark size={40} color="#6366f1" />
                  <p>Your wishlist is empty</p>
                  <button 
                    onClick={() => setShowWishlist(false)}
                    style={{
                      marginTop: '5px',
                      padding: '8px 16px',
                      background: '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Browse Books
                  </button>
                </WishlistEmpty>
              )}
            </WishlistBooks>
          </WishlistPanel>
        )}
      </AnimatePresence>
    </>
  );
};