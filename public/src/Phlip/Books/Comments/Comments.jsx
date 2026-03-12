import React, { useState, useEffect } from 'react';
import { FiUser } from 'react-icons/fi';
import {
  CommentSection,
  CommentHeader,
  CommentForm,
  UserAvatar,
  CommentInputContainer,
  UserNameInput,
  CommentInputGroup,
  CommentTextInput,
  PostButton, 
  CommentList,
  CommentItem, 
  CommentMeta, 
  CommentAvatar,
  CommentUser,
  CommentDate,
  CommentText,
  DeleteButton,
  EmptyComments
} from './Comments.styles';

// Key for localStorage
const STORAGE_KEY = 'bookComments';

export const BookComments = ({ 
  bookId, 
  initialUser = 'Amanda',
  onCommentsChange
}) => {
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(true);

  // Load comments from localStorage on component mount
  useEffect(() => {
    const savedComments = localStorage.getItem(STORAGE_KEY);
    if (savedComments) {
      try {
        setComments(JSON.parse(savedComments));
      } catch (error) {
        console.error('Failed to parse saved comments', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Save comments to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
      if (onCommentsChange) {
        onCommentsChange(comments);
      }
    }
  }, [comments, isLoading, onCommentsChange]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now(),
      bookId,
      user: currentUser,
      text: newComment,
      timestamp: new Date().toISOString()
    };
    
    setComments(prev => ({
      ...prev,
      [bookId]: [...(prev[bookId] || []), comment]
    }));
    
    setNewComment('');
  };

  const handleDeleteComment = (commentId) => {
    setComments(prev => ({
      ...prev,
      [bookId]: prev[bookId]?.filter(comment => comment.id !== commentId) || []
    }));
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return <div>Loading comments...</div>;
  }

  return (
    <CommentSection>
      <CommentHeader>
        Comments ({(comments[bookId] || []).length})
      </CommentHeader>

      <CommentForm>
        <UserAvatar>
          <FiUser size={20} />
        </UserAvatar>
        <CommentInputContainer>
          <UserNameInput
            type="text"
            value={currentUser}
            onChange={(e) => setCurrentUser(e.target.value)}
            placeholder="Your name"
          />
          <CommentInputGroup>
            <CommentTextInput
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddComment();
                }
              }}
            />
            <PostButton
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              Post
            </PostButton>
          </CommentInputGroup>
        </CommentInputContainer>
      </CommentForm>

      {(comments[bookId] || []).length > 0 ? (
        <CommentList>
          {comments[bookId].map(comment => (
            <CommentItem key={comment.id}>
              <CommentMeta>
                <CommentAvatar>
                  <FiUser size={14} />
                </CommentAvatar>
                <CommentUser>
                  <strong>{comment.user}</strong>
                  <CommentDate>
                    {formatDate(comment.timestamp)}
                  </CommentDate>
                </CommentUser>
              </CommentMeta>
              <CommentText>
                {comment.text}
              </CommentText>
              {comment.user === currentUser && (
                <DeleteButton
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  Delete
                </DeleteButton>
              )}
            </CommentItem>
          ))}
        </CommentList>
      ) : (
        <EmptyComments>
          No comments yet. Be the first to comment!
        </EmptyComments>
      )}
    </CommentSection>
  );
};