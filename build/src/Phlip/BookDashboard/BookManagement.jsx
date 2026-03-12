import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BookCategories } from "../Categories/BookCategories";
import { BookPanel } from "../Books/BookPanel";
import { Authors } from '../Authors/Authors';
import { List, X } from "phosphor-react";
import './BookManagement.css';

export const BookManagement = () => {
  const [activeTab, setActiveTab] = useState('books');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // If a category or book query param is present, switch to the books tab so filter is visible
  const location = useLocation();
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      const cid = params.get('category');
      const bid = params.get('book');
      if (cid || bid) {
        setActiveTab('books');
      }
    } catch (e) {
      // ignore
    }
  }, [location.search]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.mobile-menu') && !event.target.closest('.mobile-menu-button')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const tabs = [
    { id: 'books', label: 'Books', component: <BookPanel />, tooltip: 'View and manage books' },
    { id: 'categories', label: 'Categories', component: <BookCategories />, tooltip: 'Manage book categories' },
    { id: 'authors', label: 'Authors', component: <Authors />, tooltip: 'Manage authors' }
  ];

  return (
    <div className={`book-management ${isScrolled ? 'scrolled' : ''}`}>
      {/* Header */}
      <div className="book-management-header">
        <div className="header-brand">
          <button className="mobile-menu-button" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <List size={24} />}
          </button>
          <h2 className="header-title">eLib</h2>
        </div>
      </div>

      {/* Scrollable Tab Bar */}
      <div className="tools-scroll-container-convert">
        <div className="tool-group-convert">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tool-button-convert ${activeTab === tab.id ? 'active-convert' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              data-tooltip={tab.tooltip}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="file-converter-content-convert">
        {tabs.map(tab => (
          activeTab === tab.id && (
            <div key={tab.id} className="tab-content-convert">
              {tab.component}
            </div>
          )
        ))}
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`mobile-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMenuOpen(false);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};