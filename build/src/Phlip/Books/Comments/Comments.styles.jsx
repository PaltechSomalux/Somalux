import styled from 'styled-components';
import { FiUser, FiMessageSquare, FiX, FiCheck } from 'react-icons/fi';

export const CommentSection = styled.div`
  border-top: 0.1px solid #e5e7eb;
`;

export const CommentHeader = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 15px;
`;

export const CommentForm = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  align-items: center;
`;

export const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const CommentInputContainer = styled.div`
  flex: 1;
`;

export const UserNameInput = styled.input`
  width: 100%;
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.9rem;
`;

export const CommentInputGroup = styled.div`
  display: flex;
  gap: 4px;
`;

export const CommentTextInput = styled.input`
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.9rem;
`;

export const PostButton = styled.button`
  background: ${props => props.disabled ? '#e5e7eb' : '#6366f1'};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  font-size: 0.9rem;
`;

export const CommentList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

export const CommentItem = styled.div`
  margin-bottom: 1px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  position: relative;
`;

export const CommentMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`;

export const CommentAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: lightgrey;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const CommentUser = styled.div`
  strong {
    font-size: 0.9rem;
  }
`;

export const CommentDate = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
`;

export const CommentText = styled.p`
  font-size: 0.9rem;
  margin-left: 42px;
  margin-bottom: 0;
`;

export const DeleteButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  font-size: 0.8rem;
`;

export const EmptyComments = styled.div`
  text-align: center;
  padding: 10px;
  color: #6b7280;
  font-size: 0.9rem;
`;