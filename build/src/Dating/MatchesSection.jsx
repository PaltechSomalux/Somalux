import React, { useState, useRef } from 'react';
import { 
  FaTimes, FaMicrophone, FaVideo, FaEllipsisH, FaPaperPlane, FaSmile,
  FaVolumeUp, FaVolumeMute, FaVideoSlash, FaStar, FaRegHeart, FaUserFriends
} from 'react-icons/fa';
import { ChatHeader } from './ChatHeader';
import {Chat} from "../Chat/Chat";
import { ChatTabs } from './ChatTabs';
import { MessagesContainer } from './MessagesContainer';
import { MessageInput } from './MessageInput';
import { CallContainer } from './CallContainer';
import { QuestionModal } from "./QuestionModal";
import { IcebreakerModal } from "./IcebreakerModal";
import { CompatibilityModal } from "./CompatibilityModal";
import { ReportModal } from "./ReportModal";
import { GiftModal } from "./GiftModal";
import "./MatchesSection.css";


export const MatchesSection = ({ setActiveMessageMenu, setMessageMenuPosition }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [activeMatchTab, setActiveMatchTab] = useState('matches');
  const [activeChatTab, setActiveChatTab] = useState('chat');
  const [videoCallActive, setVideoCallActive] = useState(false);
  const [audioCallActive, setAudioCallActive] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [showIcebreakerModal, setShowIcebreakerModal] = useState(false);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  
  const matches = [
    {
      id: '101',
      name: 'Sarah',
      age: 26,
      photos: ['https://randomuser.me/api/portraits/women/44.jpg'],
      lastActive: '2 hours ago',
      compatibility: 92,
      compatibilityBreakdown: {
        interests: 95,
        values: 90,
        lifestyle: 85,
        personality: 96
      },
      commonInterests: ['hiking', 'photography', 'travel'],
      astroCompatibility: 'Highly Compatible',
      unansweredQuestions: 2,
      online: true,
      conversationStarter: "You mentioned you love hiking - what's your favorite trail?",
      icebreakers: [
        "If you could have dinner with any historical figure, who would it be?",
        "What's your go-to karaoke song?"
      ],
      activityStatus: 'active'
    }
  ];

  const likesReceived = [
    {
      id: '201',
      name: 'Mia',
      age: 25,
      photos: ['https://randomuser.me/api/portraits/women/22.jpg'],
      time: '1 day ago',
      message: "Love your profile! Especially your travel photos.",
      hasSuperLiked: true,
      activityStatus: 'recent'
    }
  ];

  const messages = {
    '101': [
      {
        id: '101-1',
        senderId: '123',
        text: 'Hey Sarah! How was your weekend?',
        timestamp: '2023-05-15T10:30:00Z',
        read: true,
        reactions: {}
      }
    ]
  };

  const startVideoCall = () => {
    setVideoCallActive(true);
    setAudioCallActive(false);
    setVideoMuted(false);
    setAudioMuted(false);
  };

  const startAudioCall = () => {
    setAudioCallActive(true);
    setVideoCallActive(false);
    setAudioMuted(false);
  };

  const endCall = () => {
    setVideoCallActive(false);
    setAudioCallActive(false);
    setVideoMuted(false);
    setAudioMuted(false);
  };

  const toggleVideoMute = () => setVideoMuted(!videoMuted);
  const toggleAudioMute = () => setAudioMuted(!audioMuted);

  const handleShowCompatibility = (matchId) => {
    const match = matches.find(m => m.id === matchId);
    setSelectedMatch(match || null);
    setShowCompatibilityModal(true);
  };

  return (
    <div className="matches-section">
      <div className="matches-tabs">
        <button 
          className={`tab-button ${activeMatchTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveMatchTab('matches')}
        >
          Matches ({matches.length})
        </button>
        <button 
          className={`tab-button ${activeMatchTab === 'likes' ? 'active' : ''}`}
          onClick={() => setActiveMatchTab('likes')}
        >
          Likes ({likesReceived.length})
        </button>
      </div>

      {activeMatchTab === 'matches' ? (
        !activeChat ? (
          <div className="matches-list">
            {matches.length > 0 ? (
              matches.map(match => (
                <div 
                  key={match.id} 
                  className="match-item"
                  onClick={() => {
                    setActiveChat(match.id);
                    setSelectedMatch(match);
                  }}
                >
                  <div className="match-photo">
                    <img src={match.photos[0]} alt={match.name} />
                    {match.compatibility > 85 && (
                      <span className="compatibility-badge">
                        {match.compatibility}%
                      </span>
                    )}
                    {match.online && <span className="online-dot"></span>}
                  </div>
                  <div className="match-info">
                    <h3>{match.name}, {match.age}</h3>
                    <p className="last-active">{match.lastActive}</p>
                    <p className="last-message">
                      {messages[match.id]?.length > 0 
                        ? messages[match.id][messages[match.id].length - 1].text
                        : 'Start chatting!'}
                    </p>
                  </div>
                  {!messages[match.id] && <span className="new-match-badge">New</span>}
                
                </div>
              ))
            ) : (
              <div className="no-matches">
                <FaUserFriends size={48} />
                <p>You don't have any matches yet</p>
                <p>Keep swiping to find your perfect match!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="chat-container">
         
            
            <ChatTabs 
              activeChatTab={activeChatTab}
              setActiveChatTab={setActiveChatTab}
            />
            
            {activeChatTab === 'chat' ? (
              videoCallActive || audioCallActive ? (
                <CallContainer 
                  videoCallActive={videoCallActive}
                  audioCallActive={audioCallActive}
                  callDuration={callDuration}
                  endCall={endCall}
                  toggleVideoMute={toggleVideoMute}
                  toggleAudioMute={toggleAudioMute}
                  videoMuted={videoMuted}
                  audioMuted={audioMuted}
                />
              ) : (
                <>
                <Chat/>
                </>
              )
            ) : activeChatTab === 'compatibility' ? (
              <div className="compatibility-tab">
                <button 
                  className="view-full-compatibility"
                  onClick={() => handleShowCompatibility(activeChat)}
                >
                  View Full Compatibility Report
                </button>
              </div>
            ) : (
              <div className="questions-tab">
                {/* Questions content */}
              </div>
            )}
          </div>
        )
      ) : (
        <div className="likes-list">
          {likesReceived.map(like => (
            <div key={like.id} className="like-item">
              <div className="like-photo">
                <img src={like.photos[0]} alt={like.name} />
                {like.hasSuperLiked && <span className="super-like-badge"><FaStar /></span>}
              </div>
              <div className="like-info">
                <h3>{like.name}, {like.age}</h3>
                <p className="time">{like.time}</p>
                {like.message && <p className="message">{like.message}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showQuestionModal && (
        <QuestionModal 
          setShowQuestionModal={setShowQuestionModal}
          setActiveQuestion={setActiveQuestion}
        />
      )}

      {showIcebreakerModal && (
        <IcebreakerModal 
          setShowIcebreakerModal={setShowIcebreakerModal}
          match={matches.find(m => m.id === activeChat)}
        />
      )}

      {showCompatibilityModal && (
        <CompatibilityModal 
          match={selectedMatch}
          setShowCompatibilityModal={setShowCompatibilityModal}
        />
      )}

      {showReportModal && (
        <ReportModal 
          setShowReportModal={setShowReportModal}
        />
      )}

      {showGiftModal && (
        <GiftModal 
          setShowGiftModal={setShowGiftModal}
        />
      )}
    </div>
  );
};