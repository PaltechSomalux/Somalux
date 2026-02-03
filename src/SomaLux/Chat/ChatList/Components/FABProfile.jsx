import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiBarChart2, FiType, FiX, FiImage, FiVideo, FiCamera, FiMic, FiFile, FiPlus } from 'react-icons/fi';
import './FABProfile.css';
import { PollModal } from '../../Group/PollModal';

export const FloatingActionButton = ({
  onPollCreate,
  onTextCreate,
  onMediaCreate,
  isChatSelected,
  isFullscreen, // New prop to control visibility in fullscreen mode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [description, setDescription] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [textContent, setTextContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [fileContents, setFileContents] = useState([]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      resetModal();
    }
  };

  useEffect(() => {
    if (activeModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeModal]);

  const resetModal = () => {
    setActiveModal(null);
    setDescription('');
    setPollOptions(['', '']);
    setTextContent('');
    setMediaFiles([]);
    setFileContents([]);
    setError('');
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isOpen) resetModal();
  };

  const handleModalOpen = (modalType) => {
    if (typeof modalType !== 'string') {
      console.error('Invalid modalType:', modalType);
      return;
    }
    setActiveModal(modalType);
    setIsOpen(false);
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    if (pollOptions.length >= 4) {
      setError('Maximum 4 poll options allowed.');
      return;
    }
    setPollOptions([...pollOptions, '']);
  };

  const removePollOption = (index) => {
    if (pollOptions.length <= 2) {
      setError('Poll must have at least 2 options.');
      return;
    }
    const newOptions = pollOptions.filter((_, i) => i !== index);
    setPollOptions(newOptions);
  };

  const readFile = (file, modalType) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = {
          file: file,
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          modalType: modalType,
          content: null,
          dataUrl: null,
          arrayBuffer: null
        };

        if (file.type.startsWith('text/') || 
            file.type === 'application/json' ||
            file.type.includes('xml')) {
          result.content = event.target.result;
        } else if (file.type.startsWith('image/') || 
                   file.type.startsWith('video/') || 
                   file.type.startsWith('audio/')) {
          result.dataUrl = event.target.result;
        } else {
          result.arrayBuffer = event.target.result;
        }

        resolve(result);
      };

      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`));
      };

      if (file.type.startsWith('text/') || 
          file.type === 'application/json' ||
          file.type.includes('xml')) {
        reader.readAsText(file);
      } else if (file.type.startsWith('image/') || 
                 file.type.startsWith('video/') || 
                 file.type.startsWith('audio/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleMediaChange = async (event, modalType) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    setError('');

    try {
      const validFiles = [];
      const fileContentPromises = [];

      for (const file of files) {
        const isValidSize = file.size <= 100 * 1024 * 1024;
        let isValidType = false;

        switch (modalType) {
          case 'camera':
            isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
            break;
          case 'image':
            isValidType = file.type.startsWith('image/');
            break;
          case 'video':
            isValidType = file.type.startsWith('video/');
            break;
          case 'audio':
            isValidType = file.type.startsWith('audio/');
            break;
          case 'document':
            isValidType = [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'text/plain',
              'text/csv',
              'application/json',
              'text/xml',
              'application/xml',
            ].includes(file.type);
            break;
          default:
            break;
        }

        if (!isValidType) {
          setError(`Invalid file type for ${modalType}: ${file.name}`);
          continue;
        }

        if (!isValidSize) {
          setError(`File size exceeds 100MB limit: ${file.name}`);
          continue;
        }

        validFiles.push(file);
        fileContentPromises.push(readFile(file, modalType));
      }

      if (validFiles.length === 0) {
        setIsProcessing(false);
        return;
      }

      const fileContentsData = await Promise.all(fileContentPromises);
      
      setMediaFiles(prevFiles => [...prevFiles, ...validFiles]);
      setFileContents(prevContents => [...prevContents, ...fileContentsData]);
      
      console.log('Files successfully read:', fileContentsData.map(fc => ({
        name: fc.name,
        type: fc.type,
        size: fc.size,
        hasContent: !!(fc.content || fc.dataUrl || fc.arrayBuffer)
      })));

    } catch (err) {
      console.error('Error reading files:', err);
      setError(`Error reading files: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeMedia = (index) => {
    const newMediaFiles = mediaFiles.filter((_, i) => i !== index);
    const newFileContents = fileContents.filter((_, i) => i !== index);
    setMediaFiles(newMediaFiles);
    setFileContents(newFileContents);
    
    if (newMediaFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePost = async () => {
    try {
      setIsProcessing(true);
      
      if (activeModal === 'poll') {
        const validOptions = pollOptions.filter((opt) => opt.trim() !== '');
        if (validOptions.length < 2) {
          setError('Poll must have at least 2 valid options.');
          return;
        }
        await onPollCreate(validOptions, description);
      } else if (activeModal === 'text') {
        if (!textContent.trim()) {
          setError('Post must have text content.');
          return;
        }
        await onTextCreate(textContent, []);
      } else if (['camera', 'image', 'video', 'audio', 'document'].includes(activeModal)) {
        if (mediaFiles.length === 0) {
          setError('Please upload at least one file.');
          return;
        }
        
        await onMediaCreate(mediaFiles, textContent, activeModal, fileContents);
      }

      resetModal();
    } catch (err) {
      console.error('Error during post:', err);
      setError('Failed to process the request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle poll objects coming from the Groups PollModal
  const handlePollFromGroups = (poll) => {
    try {
      if (!poll) return;
      const options = (poll.options || []).map(o => (o.text ? o.text : o));
      const description = poll.question || poll.description || '';
      if (typeof onPollCreate === 'function') {
        // Keep existing handler signature: (options, description)
        onPollCreate(options, description);
      }
    } catch (err) {
      console.error('FABProfile.jsx: Error handling poll from Groups PollModal:', err);
    } finally {
      resetModal();
    }
  };

  const modalTitle = activeModal && typeof activeModal === 'string'
    ? activeModal.charAt(0).toUpperCase() + activeModal.slice(1)
    : 'Action';

  const getMediaIcon = (file) => {
    if (!file) return null;
    if (file.type.startsWith('image/')) return <FiImage />;
    if (file.type.startsWith('video/')) return <FiVideo />;
    if (file.type.startsWith('audio/')) return <FiMic />;
    return <FiFile />;
  };

  const getAcceptAttribute = (modalType) => {
    switch (modalType) {
      case 'camera': return 'image/*,video/*';
      case 'image': return 'image/*';
      case 'video': return 'video/*';
      case 'audio': return 'audio/*';
      case 'document': return '.pdf,.doc,.docx,.txt,.csv,.json,.xml';
      default: return '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.console.log(bytes) / Math.console.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Hide FAB when in fullscreen mode
  if (isFullscreen) {
    return null;
  }

  return (
    <div className="fab-container-FABP">
      <button
        className={`fab-main-FABP ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle action menu"
        disabled={isProcessing}
      >
        {isProcessing ? '⟳' : '+'}
      </button>
      {isOpen && (
        <div className="fab-menu-FABP">
          <button className="fab-menu-item-FABP" onClick={() => handleModalOpen('poll')}>
            <FiBarChart2 className="fab-icon-FABP" />
            <span className="fab-label-FABP">Poll</span>
          </button>
          <button className="fab-menu-item-FABP" onClick={() => handleModalOpen('text')}>
            <FiType className="fab-icon-FABP" />
            <span className="fab-label-FABP">Text</span>
          </button>
          <button className="fab-menu-item-FABP" onClick={() => handleModalOpen('camera')}>
            <FiCamera className="fab-icon-FABP" />
            <span className="fab-label-FABP">Camera</span>
          </button>
          <button className="fab-menu-item-FABP" onClick={() => handleModalOpen('image')}>
            <FiImage className="fab-icon-FABP" />
            <span className="fab-label-FABP">Image</span>
          </button>
          <button className="fab-menu-item-FABP" onClick={() => handleModalOpen('video')}>
            <FiVideo className="fab-icon-FABP" />
            <span className="fab-label-FABP">Video</span>
          </button>
          <button className="fab-menu-item-FABP" onClick={() => handleModalOpen('audio')}>
            <FiMic className="fab-icon-FABP" />
            <span className="fab-label-FABP">Audio</span>
          </button>
          <button className="fab-menu-item-FABP" onClick={() => handleModalOpen('document')}>
            <FiFile className="fab-icon-FABP" />
            <span className="fab-label-FABP">Document</span>
          </button>
        </div>
      )}
      {activeModal === 'poll' ? (
        // Use the Cult PollModal to match the group styling exactly
        <PollModal
          onClose={resetModal}
          onCreatePoll={handlePollFromGroups}
          currentUser={undefined}
        />
      ) : activeModal ? (
        <div className="fab-modal-overlay-FABP">
          <div className="fab-modal-FABP" ref={modalRef}>
            <div className="fab-modal-header-FABP">
              <h3>{modalTitle}</h3>
              <button
                className="fab-modal-close-FABP"
                onClick={resetModal}
                aria-label="Close modal"
                disabled={isProcessing}
              >
                <FiX />
              </button>
            </div>
            <div className="fab-modal-content-FABP">
              {error && <p className="error-message-FABP">{error}</p>}
              {isProcessing && <p className="processing-message-FABP">Processing files...</p>}
              
              {activeModal === 'text' && (
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="What's happening?"
                  className="text-input-FABP"
                />
              )}
              
              {['camera', 'image', 'video', 'audio', 'document'].includes(activeModal) && (
                <div className="media-upload-FABP">
                  <input
                    type="file"
                    accept={getAcceptAttribute(activeModal)}
                    onChange={(e) => handleMediaChange(e, activeModal)}
                    className="media-input-FABP"
                    ref={fileInputRef}
                    aria-label={`Upload ${activeModal}`}
                    capture={activeModal === 'camera' ? 'environment' : undefined}
                    multiple={activeModal !== 'camera'}
                    disabled={isProcessing}
                  />
                  
                  {mediaFiles.length > 0 && (
                    <div className="media-preview-FABP">
                      <h4>Uploaded Files ({mediaFiles.length}):</h4>
                      {mediaFiles.map((file, index) => {
                        const fileContent = fileContents[index];
                        return (
                          <div key={index} className="media-preview-item-FABP">
                            <div className="file-info-FABP">
                              {file.type.startsWith('image/') ? (
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt="Preview"
                                  className="media-preview-img-FABP"
                                />
                              ) : file.type.startsWith('video/') ? (
                                <video
                                  src={URL.createObjectURL(file)}
                                  className="media-preview-video-FABP"
                                  controls
                                />
                              ) : file.type.startsWith('audio/') ? (
                                <audio
                                  src={URL.createObjectURL(file)}
                                  className="media-preview-audio-FABP"
                                  controls
                                />
                              ) : (
                                <div className="document-preview-FABP">
                                  {getMediaIcon(file)}
                                  <div className="file-details-FABP">
                                    <span className="file-name-FABP">{file.name}</span>
                                    <span className="file-size-FABP">{formatFileSize(file.size)}</span>
                                    {fileContent && (
                                      <span className="file-status-FABP">✓ Read successfully</span>
                                    )}
                                  </div>
                                </div>
                              )}
                              <button
                                className="remove-media-btn-FABP"
                                onClick={() => removeMedia(index)}
                                aria-label="Remove media"
                              >
                                <FiX />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="What's happening?"
                    className="text-input-FABP"
                  />
                </div>
              )}
              
              <button
                className="action-btn-FABP"
                onClick={handlePost}
                disabled={
                  isProcessing ||
                  (activeModal === 'poll' && pollOptions.filter((opt) => opt.trim() !== '').length < 2) ||
                  (activeModal === 'text' && !textContent.trim()) ||
                  (['camera', 'image', 'video', 'audio', 'document'].includes(activeModal) && mediaFiles.length === 0)
                }
              >
                {isProcessing ? 'Processing...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

FloatingActionButton.propTypes = {
  onPollCreate: PropTypes.func,
  onTextCreate: PropTypes.func,
  onMediaCreate: PropTypes.func,
  isChatSelected: PropTypes.bool,
  isFullscreen: PropTypes.bool, // New prop
};