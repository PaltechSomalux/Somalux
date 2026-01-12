/**
 * TextSelectionPanel.jsx - VS CODE COPILOT STYLE
 * Enhanced text selection panel with Copilot-like features
 * Includes Summarize, Explain, Translate, Read Aloud, and More Options
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  FiCopy, 
  FiPenTool, 
  FiX, 
  FiMessageSquare,
  FiBookOpen,
  FiGlobe,
  FiVolume2,
  FiMoreHorizontal,
  FiEdit,
  FiFileText,
  FiMic,
  FiSearch,
  FiShare2,
  FiChevronLeft,
  FiDownload,
  FiUnderline
} from 'react-icons/fi';
import { FaFilePdf, FaFileWord } from 'react-icons/fa';
import { generateSummary, generateKeyPoints, getTextStats } from './utils/summarizeText';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph } from 'docx';
import jsPDF from 'jspdf';
import './TextSelectionPanel.css';

const highlightColors = [
  { name: 'Yellow', value: 'yellow', hex: '#FFC107' },
  { name: 'Green', value: 'green', hex: '#4CAF50' },
  { name: 'Blue', value: 'blue', hex: '#2196F3' },
  { name: 'Pink', value: 'pink', hex: '#E91E63' },
  { name: 'Orange', value: 'orange', hex: '#FF9800' },
];

const TextSelectionPanel = ({
  position,
  selectedText,
  onCopy,
  onHighlight,
  onClose,
  summaryModalOpen = false,
}) => {
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true); // Toggle between toolbar and feature menu
  const [expandedView, setExpandedView] = useState(null); // Track which feature is expanded (summarize, explain, etc)
  const panelRef = useRef(null);
  const [adjustedPos, setAdjustedPos] = useState(position);
  const [isMobile, setIsMobile] = useState(false);
  const feedbackTimeoutRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragPosRef = useRef({ x: 0, y: 0 });
  const dragRAFRef = useRef(null);
  const [savedNotes, setSavedNotes] = useState(new Map()); // Store array of notes for each selected text
  const [currentNoteText, setCurrentNoteText] = useState('');
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);
  const noteFeedbackTimeoutRef = useRef(null);
  const [editingNoteId, setEditingNoteId] = useState(null); // Track which note is being edited
  const [editingNoteText, setEditingNoteText] = useState(''); // Text of note being edited
  const [summaryLength, setSummaryLength] = useState(5); // Number of sentences in summary
  const [summaryViewMode, setSummaryViewMode] = useState('summary'); // 'summary' or 'keypoints'
  const [showSaveOptions, setShowSaveOptions] = useState(false); // Toggle save options menu
  const [showEditSummarySaveOptions, setShowEditSummarySaveOptions] = useState(false); // Toggle edit summary save options
  const [isSavingFormat, setIsSavingFormat] = useState(null); // Track which format is being saved
  const saveOptionsRef = useRef(null); // Ref for main save options dropdown
  const editSaveSaveOptionsRef = useRef(null); // Ref for edit summary save options dropdown

  // Detect mobile on mount and orientation changes
  useEffect(() => {
    const detectMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || (navigator.maxTouchPoints > 2);
      setIsMobile(mobile);
    };

    detectMobile();
    window.addEventListener('orientationchange', detectMobile);
    window.addEventListener('resize', detectMobile);
    return () => {
      window.removeEventListener('orientationchange', detectMobile);
      window.removeEventListener('resize', detectMobile);
    };
  }, []);

  // STABLE: Update position when prop changes with mobile-aware adjustments
  useEffect(() => {
    if (!position) {
      setAdjustedPos(null);
      return;
    }

    setAdjustedPos(position);

    // Fine-tune position after panel renders
    const timer = requestAnimationFrame(() => {
      if (!panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const basePadding = isMobile ? 10 : 15;
      const padding = Math.max(basePadding, 5);

      let newX = position.x;
      let newY = position.y;

      // Adjust if going off-screen with aggressive margins on mobile
      if (rect.left < padding) {
        newX = padding;
      } else if (rect.right > viewportWidth - padding) {
        newX = Math.max(padding, viewportWidth - rect.width - padding);
      }

      if (rect.top < padding) {
        newY = padding;
      } else if (rect.bottom > viewportHeight - padding) {
        newY = Math.max(padding, viewportHeight - rect.height - padding);
      }

      // Additional constraint for very small screens
      if (isMobile && viewportWidth < 420) {
        // On very small screens, keep panel slightly inset
        const maxWidth = viewportWidth - 20;
        if (rect.width > maxWidth) {
          newX = 10;
        }
      }

      setAdjustedPos({ x: newX, y: newY });
    });

    return () => cancelAnimationFrame(timer);
  }, [position, isMobile]);

  // STABLE: Handle click outside save options dropdown
  useEffect(() => {
    if (!showSaveOptions && !showEditSummarySaveOptions) {
      return; // Only listen when dropdowns are open
    }

    const handleClickOutside = (event) => {
      // Check if click is outside main save options dropdown
      if (showSaveOptions && saveOptionsRef.current && !saveOptionsRef.current.contains(event.target)) {
        setShowSaveOptions(false);
      }

      // Check if click is outside edit summary save options dropdown
      if (showEditSummarySaveOptions && editSaveSaveOptionsRef.current && !editSaveSaveOptionsRef.current.contains(event.target)) {
        setShowEditSummarySaveOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSaveOptions, showEditSummarySaveOptions]);

  // STABLE: Regenerate summary when length slider changes
  useEffect(() => {
    if (expandedView && expandedView.type === 'summarize' && selectedText) {
      const newSummary = generateSummary(selectedText, summaryLength);
      const newKeyPoints = generateKeyPoints(selectedText, summaryLength);
      
      setExpandedView(prev => ({
        ...prev,
        content: newSummary,
        keyPoints: newKeyPoints
      }));
    }
  }, [summaryLength]);

  // STABLE: Handle copy with feedback and haptic
  const handleCopyClick = async () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    // Haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50);
    }

    try {
      await navigator.clipboard.writeText(selectedText);
      setCopiedFeedback(true);

      feedbackTimeoutRef.current = setTimeout(() => {
        setCopiedFeedback(false);
        // Keep panel open after copy feedback
      }, 1200);
    } catch (err) {
      console.error('❌ Copy failed:', err);
      // Fallback copy
      const textarea = document.createElement('textarea');
      textarea.value = selectedText;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopiedFeedback(true);
        feedbackTimeoutRef.current = setTimeout(() => {
          setCopiedFeedback(false);
        }, 1200);
      } catch (e) {
        console.error('❌ Fallback copy failed:', e);
      }
      document.body.removeChild(textarea);
    }
  };

  // STABLE: Close panel with haptic feedback
  const handleClosePanel = () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    // Haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(20);
    }
    onClose();
  };

  // Summarize using the same mechanism as page summaries
  const handleSummarize = async () => {
    if (isMobile && navigator.vibrate) navigator.vibrate(30);
    try {
      const summary = generateSummary(selectedText, summaryLength);
      const keyPoints = generateKeyPoints(selectedText, summaryLength);
      const stats = getTextStats(selectedText);
      
      setExpandedView({ 
        type: 'summarize', 
        content: summary,
        keyPoints: keyPoints,
        stats: stats
      });
      setSummaryViewMode('summary');
    } catch (err) {
      console.error('Summarize error:', err);
      setExpandedView({ 
        type: 'summarize', 
        content: 'Error generating summary. Please try again.' 
      });
    }
  };

  const handleExplain = async () => {
    if (isMobile && navigator.vibrate) navigator.vibrate(30);
    try {
      // Generate a basic explanation
      const words = selectedText.split(/\s+/);
      const explanation = `This text contains ${words.length} words and discusses: "${selectedText.substring(0, 80)}...". Key concepts can be explored by selecting specific terms.`;
      
      setExpandedView({ 
        type: 'explain', 
        content: explanation
      });
    } catch (err) {
      console.error('Explain error:', err);
      setExpandedView({ 
        type: 'explain', 
        content: 'Select text to get an explanation of its key concepts.' 
      });
    }
  };

  const handleTranslate = async () => {
    if (isMobile && navigator.vibrate) navigator.vibrate(30);
    setExpandedView({ 
      type: 'translate', 
      content: selectedText,
      languages: ['Spanish', 'French', 'German', 'Chinese', 'Japanese']
    });
  };

  const handleReadAloud = () => {
    if (isMobile && navigator.vibrate) navigator.vibrate(30);
    // Check browser support for Web Speech API
    const utterance = new SpeechSynthesisUtterance(selectedText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    
    setExpandedView({ 
      type: 'readAloud', 
      isPlaying: true 
    });
  };

  const handleMoreOptions = () => {
    if (isMobile && navigator.vibrate) navigator.vibrate(30);
    setExpandedView({ 
      type: 'moreOptions', 
      options: [
        { icon: FiEdit, label: 'Define', action: 'define' },
        { icon: FiFileText, label: 'Generate Example', action: 'generate' },
        { icon: FiShare2, label: 'Share', action: 'share' },
        { icon: FiSearch, label: 'Find Related', action: 'related' },
      ]
    });
  };

  const handleEdit = () => {
    if (isMobile && navigator.vibrate) navigator.vibrate(30);
    setExpandedView({
      type: 'edit',
      content: selectedText,
      editableText: selectedText
    });
  };

  // Save summary as Text file
  const saveSummaryAsText = async () => {
    setIsSavingFormat('text');
    try {
      const textToDownload = summaryViewMode === 'summary' ? expandedView.content : expandedView.keyPoints?.join('\n');
      const element = document.createElement('a');
      const file = new Blob([textToDownload], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = 'summary.txt';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setShowSaveOptions(false);
    } catch (error) {
      console.error('Error saving as text:', error);
      alert('Failed to save summary as text');
    } finally {
      setIsSavingFormat(null);
    }
  };

  // Save summary as Word document
  const saveSummaryAsWord = async () => {
    setIsSavingFormat('word');
    try {
      const textToDownload = summaryViewMode === 'summary' ? expandedView.content : expandedView.keyPoints?.join('\n');
      
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              text: 'Summary',
              heading: 'Heading1',
              spacing: { after: 400 }
            }),
            ...textToDownload.split('\n').map(para => 
              new Paragraph({
                text: para || ' ',
                spacing: { after: 200 }
              })
            ),
            new Paragraph({
              text: '',
              spacing: { after: 200 }
            }),
            new Paragraph({
              text: `Generated on ${new Date().toLocaleString()}`,
              italics: true,
              size: 22,
              color: '888888'
            })
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, 'summary.docx');
      setShowSaveOptions(false);
    } catch (error) {
      console.error('Error saving as Word:', error);
      alert('Failed to save summary as Word document');
    } finally {
      setIsSavingFormat(null);
    }
  };

  // Save summary as PDF
  const saveSummaryAsPDF = async () => {
    setIsSavingFormat('pdf');
    try {
      const textToDownload = summaryViewMode === 'summary' ? expandedView.content : expandedView.keyPoints?.join('\n');
      
      // Create PDF using jsPDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const textWidth = pageWidth - (margin * 2);
      let y = margin;

      // Title
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Summary', margin, y);
      y += 12;

      // Content
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(textToDownload, textWidth);
      
      lines.forEach((line) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 7;
      });

      // Footer
      doc.setFontSize(9);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 10);

      doc.save('summary.pdf');
      setShowSaveOptions(false);
    } catch (error) {
      console.error('Error saving as PDF:', error);
      alert('Failed to save summary as PDF');
    } finally {
      setIsSavingFormat(null);
    }
  };

  const handleAddNote = () => {
    if (isMobile && navigator.vibrate) navigator.vibrate(30);
    // Load existing notes for this text if available
    const existingNotes = savedNotes.get(selectedText) || [];
    setCurrentNoteText('');
    setExpandedView({
      type: 'addNote',
      content: selectedText,
      noteText: '',
      notes: existingNotes
    });
  };

  const handleSaveNote = (noteText) => {
    if (isMobile && navigator.vibrate) navigator.vibrate(30);
    
    if (!noteText.trim()) {
      return; // Don't save empty notes
    }

    // Add new note to the array for this selected text
    const existingNotes = savedNotes.get(selectedText) || [];
    const newNote = {
      id: Date.now(),
      text: noteText,
      timestamp: new Date().toLocaleString()
    };
    
    const updatedNotes = [newNote, ...existingNotes]; // Add new note at the beginning
    const newNotesMap = new Map(savedNotes);
    newNotesMap.set(selectedText, updatedNotes);
    setSavedNotes(newNotesMap);
    setCurrentNoteText('');
    
    // Show feedback
    if (noteFeedbackTimeoutRef.current) {
      clearTimeout(noteFeedbackTimeoutRef.current);
    }
    setNoteSavedFeedback(true);
    noteFeedbackTimeoutRef.current = setTimeout(() => {
      setNoteSavedFeedback(false);
    }, 1200);
    
    // Update expanded view
    setExpandedView({
      type: 'addNote',
      content: selectedText,
      noteText: '',
      notes: updatedNotes
    });
  };

  const handleDeleteNote = (noteId) => {
    if (isMobile && navigator.vibrate) navigator.vibrate(30);
    
    const existingNotes = savedNotes.get(selectedText) || [];
    const updatedNotes = existingNotes.filter(note => note.id !== noteId);
    
    const newNotesMap = new Map(savedNotes);
    if (updatedNotes.length > 0) {
      newNotesMap.set(selectedText, updatedNotes);
    } else {
      newNotesMap.delete(selectedText);
    }
    setSavedNotes(newNotesMap);
    
    // Update expanded view
    setExpandedView({
      type: 'addNote',
      content: selectedText,
      noteText: '',
      notes: updatedNotes
    });
  };

  const handleEditNote = (noteId, noteText) => {
    if (isMobile && navigator.vibrate) navigator.vibrate(30);
    setEditingNoteId(noteId);
    setEditingNoteText(noteText);
  };

  const handleSaveEditedNote = (noteId) => {
    if (isMobile && navigator.vibrate) navigator.vibrate(30);
    
    if (!editingNoteText.trim()) {
      return; // Don't save empty notes
    }

    const existingNotes = savedNotes.get(selectedText) || [];
    const updatedNotes = existingNotes.map(note =>
      note.id === noteId
        ? { ...note, text: editingNoteText, timestamp: new Date().toLocaleString() }
        : note
    );
    
    const newNotesMap = new Map(savedNotes);
    newNotesMap.set(selectedText, updatedNotes);
    setSavedNotes(newNotesMap);
    setEditingNoteId(null);
    setEditingNoteText('');
    
    // Update expanded view
    setExpandedView({
      type: 'addNote',
      content: selectedText,
      noteText: '',
      notes: updatedNotes
    });
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const backToToolbar = () => {
    setExpandedView(null);
    setShowColorPicker(false);
  };

  // Drag handlers - Smooth movement with transform
  const handleMouseDown = (e) => {
    // Disable dragging when summary modal is open or when summary panel is expanded with summarize view
    if (summaryModalOpen || (expandedView && expandedView.type === 'summarize')) {
      return;
    }
    // Only drag from the header area, not from buttons
    if (e.target.closest('button') || e.target.closest('.action-btn') || e.target.closest('.icon-btn')) {
      return;
    }
    setIsDragging(true);
    dragPosRef.current = {
      x: e.clientX - adjustedPos.x,
      y: e.clientY - adjustedPos.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (dragRAFRef.current) {
        cancelAnimationFrame(dragRAFRef.current);
      }

      dragRAFRef.current = requestAnimationFrame(() => {
        const newX = e.clientX - dragPosRef.current.x;
        const newY = e.clientY - dragPosRef.current.y;

        // Keep panel within viewport bounds
        const rect = panelRef.current?.getBoundingClientRect();
        if (rect) {
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          const constrainedX = Math.max(0, Math.min(newX, viewportWidth - rect.width));
          const constrainedY = Math.max(0, Math.min(newY, viewportHeight - rect.height));

          setAdjustedPos({
            x: constrainedX,
            y: constrainedY,
          });
        }
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (dragRAFRef.current) {
        cancelAnimationFrame(dragRAFRef.current);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (dragRAFRef.current) {
        cancelAnimationFrame(dragRAFRef.current);
      }
    };
  }, [isDragging, adjustedPos]);

  if (!position || !adjustedPos) return null;

  // Render Expanded Feature View
  if (expandedView) {
    return (
      <>
        <div
          ref={panelRef}
          className="text-selection-panel expanded-view"
          style={{
            position: 'fixed',
            left: `${adjustedPos.x}px`,
            top: `${adjustedPos.y}px`,
            zIndex: 2000,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleMouseDown}
        >
          <div className="selection-panel-content expanded-content">
            {/* Header with back button */}
            <div className="expanded-header">
              <button
                className="back-btn"
                onClick={backToToolbar}
                aria-label="Back to toolbar"
              >
                <FiChevronLeft size={18} />
              </button>
              <span className="expanded-title">
                {expandedView.type === 'summarize' && 'Summarize'}
                {expandedView.type === 'explain' && 'Explain'}
                {expandedView.type === 'translate' && 'Translate'}
                {expandedView.type === 'readAloud' && 'Read Aloud'}
                {expandedView.type === 'edit' && 'Edit Text'}
                {expandedView.type === 'editSummary' && 'Edit Summary'}
                {expandedView.type === 'addNote' && 'Add Note'}
                {expandedView.type === 'moreOptions' && 'More Options'}
              </span>
              <button
                className="close-btn"
                onClick={handleClosePanel}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Expanded Content */}
            <div className="expanded-body">
              {expandedView.type === 'summarize' && (
                <div className="feature-content">
                  {/* Summary/Keypoints Toggle Buttons + Stats on same line */}
                  <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setSummaryViewMode('summary')}
                      style={{
                        padding: '6px 12px',
                        background: summaryViewMode === 'summary' ? '#0c6d58' : '#1a2328',
                        color: '#e9edef',
                        border: `1px solid ${summaryViewMode === 'summary' ? '#00a884' : '#2a3942'}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Summary
                    </button>
                    <button
                      onClick={() => setSummaryViewMode('keypoints')}
                      style={{
                        padding: '6px 12px',
                        background: summaryViewMode === 'keypoints' ? '#0c6d58' : '#1a2328',
                        color: '#e9edef',
                        border: `1px solid ${summaryViewMode === 'keypoints' ? '#00a884' : '#2a3942'}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Key Points
                    </button>

                    {/* Text Statistics - Inline with buttons */}
                    {expandedView.stats && (
                      <div style={{ 
                        padding: '4px 8px', 
                        background: '#1a2328', 
                        border: '1px solid #2a3942', 
                        borderRadius: '4px',
                        display: 'flex',
                        gap: '10px',
                        marginLeft: 'auto'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                          <span>📊</span>
                          <span style={{ color: '#8696a0' }}>Words:</span>
                          <span style={{ color: '#e9edef', fontWeight: '600' }}>
                            {summaryViewMode === 'summary' ? expandedView.content.split(/\s+/).length : expandedView.keyPoints?.join('\n').split(/\s+/).length || 0}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                          <span>📝</span>
                          <span style={{ color: '#8696a0' }}>Sent:</span>
                          <span style={{ color: '#e9edef', fontWeight: '600' }}>
                            {summaryViewMode === 'summary' ? expandedView.content.split(/[.!?]+/).filter(s => s.trim().length > 0).length : (expandedView.keyPoints?.length || 0)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary Length Slider */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', color: '#8696a0', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                      Summary Length: {summaryLength} sentences
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={summaryLength}
                      onChange={(e) => setSummaryLength(parseInt(e.target.value))}
                      style={{
                        width: '100%',
                        cursor: 'pointer'
                      }}
                    />
                  </div>

                  {/* Summary Content */}
                  <div style={{ marginBottom: '20px', minHeight: '100px', maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>
                    {summaryViewMode === 'summary' ? (
                      <p className="feature-text" style={{ color: '#e9edef', lineHeight: '1.7', fontSize: '13px', margin: 0 }}>
                        {expandedView.content}
                      </p>
                    ) : (
                      <div>
                        {expandedView.keyPoints?.map((point, idx) => (
                          <div key={idx} style={{ 
                            padding: '8px 0', 
                            color: '#e9edef', 
                            fontSize: '13px', 
                            lineHeight: '1.6',
                            borderBottom: idx < expandedView.keyPoints.length - 1 ? '1px solid #2a3942' : 'none'
                          }}>
                            • {point}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '20px' }}>
                    {/* Edit Summary */}
                    <button
                      onClick={() => {
                        setExpandedView({
                          ...expandedView,
                          type: 'editSummary',
                          editableText: summaryViewMode === 'summary' ? expandedView.content : expandedView.keyPoints?.join('\n'),
                        });
                      }}
                      style={{
                        padding: '10px 12px',
                        background: '#1a2328',
                        color: '#e9edef',
                        border: '1px solid #2a3942',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                      title="Edit summary"
                    >
                      <FiEdit size={16} /> Edit
                    </button>

                    {/* Copy Summary */}
                    <button
                      onClick={async () => {
                        const textToCopy = summaryViewMode === 'summary' ? expandedView.content : expandedView.keyPoints?.join('\n');
                        try {
                          await navigator.clipboard.writeText(textToCopy);
                          alert('Summary copied to clipboard!');
                        } catch (err) {
                          console.error('Failed to copy:', err);
                        }
                      }}
                      style={{
                        padding: '10px 12px',
                        background: '#1a2328',
                        color: '#e9edef',
                        border: '1px solid #2a3942',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                      title="Copy summary"
                    >
                      <FiCopy size={16} /> Copy
                    </button>

                    {/* Save Summary with dropdown menu */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setShowSaveOptions(!showSaveOptions)}
                        style={{
                          padding: '10px 12px',
                          background: '#1a2328',
                          color: '#e9edef',
                          border: '1px solid #2a3942',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        title="Save summary"
                      >
                        <FiDownload size={16} /> Save
                      </button>

                      {/* Save Options Dropdown */}
                      {showSaveOptions && (
                        <div ref={saveOptionsRef} style={{
                          position: 'absolute',
                          bottom: '100%',
                          right: 0,
                          marginBottom: '8px',
                          background: '#0a0e11',
                          border: '1px solid #2a3942',
                          borderRadius: '6px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                          zIndex: 1000,
                          minWidth: '160px',
                          overflow: 'hidden'
                        }}>
                          {/* Save as Text */}
                          <button
                            onClick={saveSummaryAsText}
                            disabled={isSavingFormat === 'text'}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: isSavingFormat === 'text' ? '#1a2328' : 'transparent',
                              color: '#e9edef',
                              border: 'none',
                              borderBottom: '1px solid #2a3942',
                              cursor: isSavingFormat === 'text' ? 'wait' : 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (isSavingFormat !== 'text') {
                                e.target.style.background = '#1a2328';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isSavingFormat !== 'text') {
                                e.target.style.background = 'transparent';
                              }
                            }}
                          >
                            <FiFileText size={20} style={{ color: '#8696a0' }} /> {isSavingFormat === 'text' ? 'Saving...' : 'Text (.txt)'}
                          </button>

                          {/* Save as Word */}
                          <button
                            onClick={saveSummaryAsWord}
                            disabled={isSavingFormat === 'word'}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: isSavingFormat === 'word' ? '#1a2328' : 'transparent',
                              color: '#e9edef',
                              border: 'none',
                              borderBottom: '1px solid #2a3942',
                              cursor: isSavingFormat === 'word' ? 'wait' : 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (isSavingFormat !== 'word') {
                                e.target.style.background = '#1a2328';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isSavingFormat !== 'word') {
                                e.target.style.background = 'transparent';
                              }
                            }}
                          >
                            <FaFileWord size={20} style={{ color: '#2196F3' }} /> {isSavingFormat === 'word' ? 'Saving...' : 'Word (.docx)'}
                          </button>

                          {/* Save as PDF */}
                          <button
                            onClick={saveSummaryAsPDF}
                            disabled={isSavingFormat === 'pdf'}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: isSavingFormat === 'pdf' ? '#1a2328' : 'transparent',
                              color: '#e9edef',
                              border: 'none',
                              cursor: isSavingFormat === 'pdf' ? 'wait' : 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (isSavingFormat !== 'pdf') {
                                e.target.style.background = '#1a2328';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isSavingFormat !== 'pdf') {
                                e.target.style.background = 'transparent';
                              }
                            }}
                          >
                            <FaFilePdf size={20} style={{ color: '#FF3333' }} /> {isSavingFormat === 'pdf' ? 'Saving...' : 'PDF (.pdf)'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {expandedView.type === 'explain' && (
                <div className="feature-content">
                  <p className="feature-text">{expandedView.content}</p>
                </div>
              )}

              {expandedView.type === 'translate' && (
                <div className="translate-content">
                  <div className="original-text">
                    <label>Original</label>
                    <p>{selectedText}</p>
                  </div>
                  <div className="language-list">
                    <label>Translate to:</label>
                    {expandedView.languages?.map((lang) => (
                      <button
                        key={lang}
                        className="language-btn"
                        onClick={() => handleCopyClick()}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {expandedView.type === 'readAloud' && (
                <div className="read-aloud-content">
                  <div className="player-info">
                    <FiVolume2 size={32} className="player-icon" />
                    <p>Playing audio...</p>
                  </div>
                  <button
                    className="stop-btn"
                    onClick={() => {
                      window.speechSynthesis.cancel();
                      backToToolbar();
                    }}
                  >
                    Stop
                  </button>
                </div>
              )}

              {expandedView.type === 'edit' && (
                <div className="feature-content">
                  <label style={{ fontSize: '12px', color: '#8696a0', fontWeight: '600' }}>Edit Text</label>
                  <textarea
                    defaultValue={expandedView.editableText}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: '#1a2328',
                      border: '1px solid #2a3942',
                      borderRadius: '6px',
                      color: '#e9edef',
                      minHeight: '100px',
                      fontFamily: 'inherit',
                      marginTop: '8px',
                      resize: 'vertical'
                    }}
                    placeholder="Edit your text here..."
                  />
                  <button
                    onClick={() => backToToolbar()}
                    style={{
                      marginTop: '8px',
                      padding: '8px 14px',
                      background: '#00a884',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      width: '100%',
                      fontWeight: '500'
                    }}
                  >
                    Done
                  </button>
                </div>
              )}

              {expandedView.type === 'editSummary' && (
                <div className="feature-content">
                  <label style={{ fontSize: '12px', color: '#8696a0', fontWeight: '600' }}>Edit Summary</label>
                  <textarea
                    id="edit-summary-textarea"
                    defaultValue={expandedView.editableText}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: '#1a2328',
                      border: '1px solid #2a3942',
                      borderRadius: '6px',
                      color: '#e9edef',
                      minHeight: '120px',
                      fontFamily: 'inherit',
                      marginTop: '8px',
                      resize: 'vertical'
                    }}
                    placeholder="Edit your summary here..."
                  />
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        const textarea = document.getElementById('edit-summary-textarea');
                        const editedText = textarea?.value || expandedView.editableText;
                        try {
                          navigator.clipboard.writeText(editedText);
                          alert('Summary copied to clipboard!');
                        } catch (err) {
                          console.error('Failed to copy:', err);
                        }
                      }}
                      style={{
                        flex: '1',
                        padding: '8px 14px',
                        background: '#1a2328',
                        color: '#e9edef',
                        border: '1px solid #2a3942',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <FiCopy size={14} /> Copy
                    </button>
                    
                    {/* Save with dropdown */}
                    <div style={{ flex: '1', position: 'relative' }}>
                      <button
                        onClick={() => setShowEditSummarySaveOptions(!showEditSummarySaveOptions)}
                        style={{
                          width: '100%',
                          padding: '8px 14px',
                          background: '#1a2328',
                          color: '#e9edef',
                          border: '1px solid #2a3942',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <FiDownload size={14} /> Save
                      </button>

                      {/* Save Options Dropdown */}
                      {showEditSummarySaveOptions && (
                        <div ref={editSaveSaveOptionsRef} style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: 0,
                          marginBottom: '8px',
                          background: '#0a0e11',
                          border: '1px solid #2a3942',
                          borderRadius: '6px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                          zIndex: 1000,
                          minWidth: '160px',
                          overflow: 'hidden'
                        }}>
                          {/* Save as Text */}
                          <button
                            onClick={() => {
                              const textarea = document.getElementById('edit-summary-textarea');
                              const editedText = textarea?.value || expandedView.editableText;
                              const element = document.createElement('a');
                              const file = new Blob([editedText], { type: 'text/plain' });
                              element.href = URL.createObjectURL(file);
                              element.download = 'edited-summary.txt';
                              document.body.appendChild(element);
                              element.click();
                              document.body.removeChild(element);
                              setShowEditSummarySaveOptions(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: 'transparent',
                              color: '#e9edef',
                              border: 'none',
                              borderBottom: '1px solid #2a3942',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#1a2328';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'transparent';
                            }}
                          >
                            <FiFileText size={20} style={{ color: '#8696a0' }} /> Text (.txt)
                          </button>

                          {/* Save as Word */}
                          <button
                            onClick={async () => {
                              const textarea = document.getElementById('edit-summary-textarea');
                              const editedText = textarea?.value || expandedView.editableText;
                              
                              try {
                                const doc = new Document({
                                  sections: [{
                                    children: [
                                      new Paragraph({
                                        text: 'Summary',
                                        heading: 'Heading1',
                                        spacing: { after: 400 }
                                      }),
                                      ...editedText.split('\n').map(para => 
                                        new Paragraph({
                                          text: para || ' ',
                                          spacing: { after: 200 }
                                        })
                                      ),
                                      new Paragraph({
                                        text: '',
                                        spacing: { after: 200 }
                                      }),
                                      new Paragraph({
                                        text: `Generated on ${new Date().toLocaleString()}`,
                                        italics: true,
                                        size: 22,
                                        color: '888888'
                                      })
                                    ]
                                  }]
                                });

                                const blob = await Packer.toBlob(doc);
                                saveAs(blob, 'edited-summary.docx');
                                setShowEditSummarySaveOptions(false);
                              } catch (error) {
                                console.error('Error saving as Word:', error);
                                alert('Failed to save summary as Word document');
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: 'transparent',
                              color: '#e9edef',
                              border: 'none',
                              borderBottom: '1px solid #2a3942',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#1a2328';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'transparent';
                            }}
                          >
                            <FaFileWord size={20} style={{ color: '#2196F3' }} /> Word (.docx)
                          </button>

                          {/* Save as PDF */}
                          <button
                            onClick={async () => {
                              const textarea = document.getElementById('edit-summary-textarea');
                              const editedText = textarea?.value || expandedView.editableText;
                              
                              try {
                                // Create PDF using jsPDF
                                const doc = new jsPDF({
                                  orientation: 'portrait',
                                  unit: 'mm',
                                  format: 'a4'
                                });

                                const pageHeight = doc.internal.pageSize.getHeight();
                                const pageWidth = doc.internal.pageSize.getWidth();
                                const margin = 15;
                                const textWidth = pageWidth - (margin * 2);
                                let y = margin;

                                // Title
                                doc.setFontSize(16);
                                doc.setFont(undefined, 'bold');
                                doc.text('Summary', margin, y);
                                y += 12;

                                // Content
                                doc.setFontSize(11);
                                doc.setFont(undefined, 'normal');
                                const lines = doc.splitTextToSize(editedText, textWidth);
                                
                                lines.forEach((line) => {
                                  if (y > pageHeight - margin) {
                                    doc.addPage();
                                    y = margin;
                                  }
                                  doc.text(line, margin, y);
                                  y += 7;
                                });

                                // Footer
                                doc.setFontSize(9);
                                doc.setFont(undefined, 'italic');
                                doc.setTextColor(128, 128, 128);
                                doc.text(`Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 10);

                                doc.save('edited-summary.pdf');
                              } catch (error) {
                                console.error('Error saving as PDF:', error);
                                alert('Failed to save summary as PDF');
                              }
                              setShowEditSummarySaveOptions(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: 'transparent',
                              color: '#e9edef',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#1a2328';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'transparent';
                            }}
                          >
                            <FaFilePdf size={20} style={{ color: '#FF3333' }} /> PDF (.pdf)
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setExpandedView({ ...expandedView, type: 'summarize' })}
                      style={{
                        flex: '1',
                        padding: '8px 14px',
                        background: '#00a884',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '13px'
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {expandedView.type === 'addNote' && (
                <div className="feature-content">
                  <label style={{ fontSize: '12px', color: '#8696a0', fontWeight: '600' }}>Add New Note</label>
                  <textarea
                    id="note-textarea"
                    value={currentNoteText}
                    onChange={(e) => setCurrentNoteText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: '#1a2328',
                      border: '1px solid #2a3942',
                      borderRadius: '6px',
                      color: '#e9edef',
                      minHeight: '70px',
                      fontFamily: 'inherit',
                      marginTop: '8px',
                      resize: 'vertical'
                    }}
                    placeholder="Add your notes here..."
                  />
                  <button
                    onClick={() => {
                      handleSaveNote(currentNoteText);
                    }}
                    style={{
                      marginTop: '8px',
                      padding: '8px 14px',
                      background: '#00a884',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      width: '100%',
                      fontWeight: '500'
                    }}
                  >
                    Add Note
                  </button>

                  {/* Display saved notes */}
                  {expandedView.notes && expandedView.notes.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <label style={{ fontSize: '12px', color: '#8696a0', fontWeight: '600' }}>
                        Saved Notes ({expandedView.notes.length})
                      </label>
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {expandedView.notes.map((note) => (
                          <div key={note.id}>
                            {editingNoteId === note.id ? (
                              // Edit mode
                              <div
                                style={{
                                  padding: '10px',
                                  background: '#1a2328',
                                  border: '1px solid #0c6d58',
                                  borderRadius: '6px',
                                  fontSize: '12px'
                                }}
                              >
                                <textarea
                                  value={editingNoteText}
                                  onChange={(e) => setEditingNoteText(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    background: '#0b1216',
                                    border: '1px solid #2a3942',
                                    borderRadius: '4px',
                                    color: '#e9edef',
                                    minHeight: '60px',
                                    fontFamily: 'inherit',
                                    marginBottom: '8px',
                                    resize: 'vertical'
                                  }}
                                />
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => handleSaveEditedNote(note.id)}
                                    style={{
                                      flex: 1,
                                      padding: '6px 10px',
                                      background: '#00a884',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '10px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEditNote}
                                    style={{
                                      flex: 1,
                                      padding: '6px 10px',
                                      background: '#666',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '10px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Display mode
                              <div
                                style={{
                                  padding: '10px',
                                  background: '#1a2328',
                                  border: '1px solid #2a3942',
                                  borderRadius: '6px',
                                  fontSize: '12px'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                  <p style={{ color: '#e9edef', margin: '0 0 4px 0', flex: 1 }}>{note.text}</p>
                                  <div style={{ display: 'flex', gap: '4px', flex: '0 0 auto' }}>
                                    <button
                                      onClick={() => handleEditNote(note.id, note.text)}
                                      style={{
                                        padding: '4px 8px',
                                        background: '#0c6d58',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '10px',
                                        fontWeight: '600'
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteNote(note.id)}
                                      style={{
                                        padding: '4px 8px',
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '10px',
                                        fontWeight: '600'
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                                <p style={{ color: '#8696a0', margin: '0', fontSize: '10px' }}>
                                  {note.timestamp}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {expandedView.type === 'moreOptions' && (
                <div className="more-options-content">
                  {expandedView.options?.map((option) => (
                    <button
                      key={option.action}
                      className="option-btn"
                      onClick={() => {
                        console.log('Option selected:', option.action);
                        backToToolbar();
                      }}
                    >
                      <option.icon size={16} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="selection-panel-arrow" />
        </div>
      </>
    );
  }

  // Render Main Toolbar with Icon Options
  return (
    <>
      <div
        ref={panelRef}
        className={`text-selection-panel ${isMobile ? 'mobile-context-menu' : 'copilot-style'}`}
        style={{
          position: 'fixed',
          left: `${adjustedPos.x}px`,
          top: `${adjustedPos.y}px`,
          zIndex: 2000,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
      >
        <div className="selection-panel-content">
          {copiedFeedback ? (
            // Copy success feedback
            <div className="selection-panel-feedback">
              <div className="feedback-checkmark">✓</div>
              <div className="feedback-text">Copied!</div>
            </div>
          ) : (
            <>
              {/* MOBILE: Clean Context Menu */}
              {isMobile ? (
                <>
                  {/* Mobile Icon Toolbar - Top Row */}
                  <div className="mobile-icon-toolbar">
                    <button
                      className="mobile-icon-btn"
                      title="Edit"
                      onClick={handleEdit}
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      className="mobile-icon-btn"
                      title="Copy"
                      onClick={handleCopyClick}
                    >
                      <FiCopy size={18} />
                    </button>
                    <button
                      className="mobile-icon-btn"
                      title="Highlight"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    >
                      <FiPenTool size={18} />
                    </button>
                    <button
                      className="mobile-icon-btn"
                      title="Underline"
                    >
                      <FiUnderline size={18} />
                    </button>
                    <button
                      className="mobile-icon-btn"
                      title="Strikethrough"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.3 13.5c.3-.2.7-.5 1-.8m-12.6 0c-.3.3-.7.6-1 .8M6 4h12M6 12h12M6 20h12" />
                      </svg>
                    </button>
                    <button
                      className="mobile-icon-btn"
                      title="More"
                      onClick={handleMoreOptions}
                    >
                      <FiMoreHorizontal size={18} />
                    </button>
                  </div>

                  {/* Mobile Color Picker */}
                  {showColorPicker && (
                    <div className="mobile-color-picker">
                      <div className="color-grid">
                        {highlightColors.map((color) => (
                          <button
                            key={color.value}
                            className="color-circle"
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                            onClick={() => {
                              if (navigator.vibrate) navigator.vibrate(30);
                              onHighlight(color.value);
                              setShowColorPicker(false);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mobile Main Action Menu */}
                  {!showColorPicker && (
                    <div className="mobile-action-menu">
                      <button
                        className="mobile-action-btn"
                        onClick={handleSummarize}
                      >
                        <FiMessageSquare size={16} />
                        <span>Summarize</span>
                      </button>

                      <button
                        className="mobile-action-btn"
                        onClick={handleExplain}
                      >
                        <FiBookOpen size={16} />
                        <span>Explain</span>
                      </button>

                      <button
                        className="mobile-action-btn"
                        onClick={handleTranslate}
                      >
                        <FiGlobe size={16} />
                        <span>Translate Text</span>
                      </button>

                      <button
                        className="mobile-action-btn"
                        onClick={handleReadAloud}
                      >
                        <FiMic size={16} />
                        <span>Read Aloud</span>
                      </button>

                      <button
                        className="mobile-action-btn"
                        onClick={handleAddNote}
                      >
                        <FiFileText size={16} />
                        <span>Add Note</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* DESKTOP: Full Toolbar */}
                  {/* Top Icon Toolbar - Edit & Formatting Tools */}
                  <div className="icon-toolbar">
                    <button
                      className={`icon-btn highlight-btn ${showColorPicker ? 'active' : ''}`}
                      title="Highlight"
                      aria-label="Highlight"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    >
                      <FiPenTool size={16} />
                    </button>
                    <button
                      className="icon-btn copy-btn"
                      title="Copy"
                      aria-label="Copy"
                      onClick={handleCopyClick}
                    >
                      <FiCopy size={16} />
                    </button>
                    <button
                      className="icon-btn edit-btn"
                      title="Edit/Annotate"
                      aria-label="Edit"
                      onClick={handleEdit}
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      className="icon-btn document-btn"
                      title="Add Note"
                      aria-label="Add Note"
                      onClick={handleAddNote}
                    >
                      <FiFileText size={16} />
                    </button>
                    <button
                      className="icon-btn search-btn"
                      title="Search"
                      aria-label="Search"
                    >
                      <FiSearch size={16} />
                    </button>
                    <button
                      className="icon-btn share-btn"
                      title="Share"
                      aria-label="Share"
                    >
                      <FiShare2 size={16} />
                    </button>
                    <button
                      className="icon-btn close-btn"
                      title="Close"
                      aria-label="Close panel"
                      onClick={onClose}
                    >
                      <FiX size={16} />
                    </button>
                  </div>

                  {/* Color Picker Inline */}
                  {showColorPicker && (
                    <div className="color-picker-inline">
                      <label>Choose Color</label>
                      <div className="color-grid">
                        {highlightColors.map((color) => (
                          <button
                            key={color.value}
                            className="color-circle"
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                            onClick={() => {
                              if (isMobile && navigator.vibrate) {
                                navigator.vibrate(30);
                              }
                              onHighlight(color.value);
                              setShowColorPicker(false);
                            }}
                            aria-label={`Highlight with ${color.name}`}
                          />
                        ))}
                      </div>
                      <button
                        className="back-to-menu-btn"
                        onClick={() => setShowColorPicker(false)}
                      >
                        Back
                      </button>
                    </div>
                  )}

                  {/* Main Action Menu - Copilot Features */}
                  {!showColorPicker && (
                    <div className="main-action-menu">
                      <button
                        className="action-btn summarize-btn"
                        onClick={handleSummarize}
                        title="Summarize"
                        aria-label="Summarize text"
                      >
                        <FiMessageSquare size={14} />
                        <span>Summarize</span>
                      </button>

                      <button
                        className="action-btn explain-btn"
                        onClick={handleExplain}
                        title="Explain"
                        aria-label="Explain text"
                      >
                        <FiBookOpen size={14} />
                        <span>Explain</span>
                      </button>

                      <button
                        className="action-btn translate-btn"
                        onClick={handleTranslate}
                        title="Translate Text"
                        aria-label="Translate text"
                      >
                        <FiGlobe size={14} />
                        <span>Translate Text</span>
                      </button>

                      <button
                        className="action-btn read-aloud-btn"
                        onClick={handleReadAloud}
                        title="Read Aloud"
                        aria-label="Read aloud with audio"
                      >
                        <FiMic size={14} />
                        <span>Read Aloud</span>
                      </button>

                      <button
                        className="action-btn more-options-btn"
                        onClick={handleMoreOptions}
                        title="More Options"
                        aria-label="More options"
                      >
                        <FiMoreHorizontal size={14} />
                        <span>More Options</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Arrow pointer */}
        <div className="selection-panel-arrow" />
      </div>
    </>
  );
};

export default TextSelectionPanel;
