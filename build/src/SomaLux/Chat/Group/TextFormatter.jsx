import React from 'react';
import './TextFormatter.css';

/**
 * WhatsApp-style text formatting parser
 * Supports: *bold*, _italic_, ~strikethrough~, `code`, `color|text` for highlights
 */

export const parseFormattedText = (text) => {
  if (!text) return null;

  const elements = [];
  let i = 0;
  let key = 0;

  while (i < text.length) {
    // Bold: *text*
    if (text[i] === '*' && text[i + 1] !== ' ') {
      const start = i + 1;
      let end = start;
      while (end < text.length && text[end] !== '*') end++;
      
      if (end < text.length && end > start) {
        elements.push(
          <strong key={key++} className="formatted-bold">
            {parseFormattedText(text.slice(start, end))}
          </strong>
        );
        i = end + 1;
        continue;
      }
    }

    // Italic: _text_
    if (text[i] === '_' && text[i + 1] !== ' ') {
      const start = i + 1;
      let end = start;
      while (end < text.length && text[end] !== '_') end++;
      
      if (end < text.length && end > start) {
        elements.push(
          <em key={key++} className="formatted-italic">
            {parseFormattedText(text.slice(start, end))}
          </em>
        );
        i = end + 1;
        continue;
      }
    }

    // Strikethrough: ~text~
    if (text[i] === '~' && text[i + 1] !== ' ') {
      const start = i + 1;
      let end = start;
      while (end < text.length && text[end] !== '~') end++;
      
      if (end < text.length && end > start) {
        elements.push(
          <del key={key++} className="formatted-strikethrough">
            {parseFormattedText(text.slice(start, end))}
          </del>
        );
        i = end + 1;
        continue;
      }
    }

    // Code/Highlight: `text` or `color|text`
    if (text[i] === '`') {
      const start = i + 1;
      let end = start;
      while (end < text.length && text[end] !== '`') end++;
      
      if (end < text.length && end > start) {
        const content = text.slice(start, end);
        const colorMatch = content.match(/^([a-zA-Z]+)\|(.+)$/);
        
        if (colorMatch) {
          // Colored highlight: `red|text`
          const [, color, highlightText] = colorMatch;
          elements.push(
            <span 
              key={key++} 
              className={`formatted-highlight highlight-${color.toLowerCase()}`}
              style={{ backgroundColor: getHighlightColor(color) }}
            >
              {highlightText}
            </span>
          );
        } else {
          // Regular code: `text`
          elements.push(
            <code key={key++} className="formatted-code">
              {content}
            </code>
          );
        }
        i = end + 1;
        continue;
      }
    }

    // Regular text with @mention detection
    let regularText = '';
    while (i < text.length && !['*', '_', '~', '`'].includes(text[i])) {
      regularText += text[i];
      i++;
    }

    if (regularText) {
      const parts = [];
      let idx = 0;
      const mentionRe = /(^|\s)@([A-Za-z][A-Za-z0-9_]{0,31})/g;
      let match;
      while ((match = mentionRe.exec(regularText)) !== null) {
        const start = match.index + match[1].length;
        if (start > idx) {
          parts.push(<span key={key++}>{regularText.slice(idx, start)}</span>);
        }
        const name = match[2];
        parts.push(
          <span
            key={key++}
            className="formatted-mention"
            data-mention-name={name}
          >
            @{name}
          </span>
        );
        idx = start + 1 + name.length;
      }
      if (idx < regularText.length) {
        parts.push(<span key={key++}>{regularText.slice(idx)}</span>);
      }
      elements.push(...parts);
    } else {
      elements.push(text[i]);
      i++;
    }
  }

  return elements;
};

export const parseFormattedTextWithMembers = (text, members = []) => {
  if (!text) return null;
  const elements = [];
  let i = 0;
  let key = 0;

  // Build a fast lookup and name list (case-insensitive)
  const names = Array.isArray(members)
    ? Array.from(new Set(
        members.map(m => (m?.name || m?.displayName || (m?.email ? m.email.split('@')[0] : '')))
               .filter(Boolean)
      ))
      .sort((a, b) => b.length - a.length) // longest first
    : [];

  const tryMatchMemberAt = (src, startIdx) => {
    const afterAt = src.slice(startIdx + 1); // text after '@'
    for (const nm of names) {
      if (!nm) continue;
      const seg = afterAt.slice(0, nm.length);
      if (seg.toLowerCase() === nm.toLowerCase()) {
        // Ensure boundary after the name: next char is space, punctuation or end
        const boundaryChar = afterAt.charAt(nm.length);
        if (!boundaryChar || /\s|[.,!?;:)/\]\}]/.test(boundaryChar)) {
          return nm;
        }
      }
    }
    return null;
  };

  while (i < text.length) {
    if (text[i] === '*' && text[i + 1] !== ' ') {
      const start = i + 1;
      let end = start;
      while (end < text.length && text[end] !== '*') end++;
      if (end < text.length && end > start) {
        elements.push(
          <strong key={key++} className="formatted-bold">
            {parseFormattedTextWithMembers(text.slice(start, end), members)}
          </strong>
        );
        i = end + 1;
        continue;
      }
    }

    if (text[i] === '_' && text[i + 1] !== ' ') {
      const start = i + 1;
      let end = start;
      while (end < text.length && text[end] !== '_') end++;
      if (end < text.length && end > start) {
        elements.push(
          <em key={key++} className="formatted-italic">
            {parseFormattedTextWithMembers(text.slice(start, end), members)}
          </em>
        );
        i = end + 1;
        continue;
      }
    }

    if (text[i] === '~' && text[i + 1] !== ' ') {
      const start = i + 1;
      let end = start;
      while (end < text.length && text[end] !== '~') end++;
      if (end < text.length && end > start) {
        elements.push(
          <del key={key++} className="formatted-strikethrough">
            {parseFormattedTextWithMembers(text.slice(start, end), members)}
          </del>
        );
        i = end + 1;
        continue;
      }
    }

    if (text[i] === '`') {
      const start = i + 1;
      let end = start;
      while (end < text.length && text[end] !== '`') end++;
      if (end < text.length && end > start) {
        const content = text.slice(start, end);
        const pipeIdx = content.indexOf('|');
        if (pipeIdx > 0) {
          const colorToken = content.slice(0, pipeIdx);
          const highlightText = content.slice(pipeIdx + 1);
          elements.push(
            <span 
              key={key++} 
              className={`formatted-highlight`}
              style={{ backgroundColor: getHighlightColor(colorToken) }}
            >
              {highlightText}
            </span>
          );
        } else {
          elements.push(
            <code key={key++} className="formatted-code">
              {content}
            </code>
          );
        }
        i = end + 1;
        continue;
      }
    }

    let regularText = '';
    while (i < text.length && !['*', '_', '~', '`'].includes(text[i])) {
      regularText += text[i];
      i++;
    }

    if (regularText) {
      let idx = 0;
      while (idx < regularText.length) {
        const atIdx = regularText.indexOf('@', idx);
        if (atIdx === -1) {
          elements.push(<span key={key++}>{regularText.slice(idx)}</span>);
          break;
        }
        // Push text before '@'
        if (atIdx > idx) {
          elements.push(<span key={key++}>{regularText.slice(idx, atIdx)}</span>);
        }
        // Try member match with spaces
        const matched = tryMatchMemberAt(regularText, atIdx);
        if (matched) {
          elements.push(
            <span key={key++} className="formatted-mention" data-mention-name={matched}>
              @{matched}
            </span>
          );
          idx = atIdx + 1 + matched.length;
          // Skip optional trailing punctuation
          continue;
        }
        // Fallback simple mention token
        const simple = regularText.slice(atIdx).match(/^@([A-Za-z][A-Za-z0-9_]{0,31})/);
        if (simple) {
          const name = simple[1];
          elements.push(
            <span key={key++} className="formatted-mention" data-mention-name={name}>
              @{name}
            </span>
          );
          idx = atIdx + 1 + name.length;
        } else {
          // Not a mention; output '@' and advance
          elements.push(<span key={key++}>@</span>);
          idx = atIdx + 1;
        }
      }
    } else {
      elements.push(text[i]);
      i++;
    }
  }

  return elements;
};

// Color mapping for highlights with hex and rgb support
const getHighlightColor = (colorName) => {
  const colors = {
    red: '#ff6b6b',
    blue: '#4dabf7',
    green: '#51cf66',
    yellow: '#ffd43b',
    orange: '#ff922b',
    purple: '#a78bfa',
    pink: '#f783ac',
    cyan: '#3bc9db',
    lime: '#94d82d',
    teal: '#20c997',
    indigo: '#748ffc',
    violet: '#da77f2',
    gray: '#868e96',
    grey: '#868e96',
    black: '#111827',
    white: '#ffffff',
  };
  if (!colorName) return '#ffd43b';
  const token = colorName.trim().toLowerCase();
  if (colors[token]) return colors[token];
  // hex
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(token)) return token;
  // rgb/rgba
  if (/^rgba?\(/i.test(token)) return token;
  return '#ffd43b';
};

// Get all available highlight colors
export const getHighlightColors = () => [
  { name: 'Yellow', value: 'yellow', hex: '#ffd43b' },
  { name: 'Red', value: 'red', hex: '#ff6b6b' },
  { name: 'Blue', value: 'blue', hex: '#4dabf7' },
  { name: 'Green', value: 'green', hex: '#51cf66' },
  { name: 'Orange', value: 'orange', hex: '#ff922b' },
  { name: 'Purple', value: 'purple', hex: '#a78bfa' },
  { name: 'Pink', value: 'pink', hex: '#f783ac' },
  { name: 'Cyan', value: 'cyan', hex: '#3bc9db' },
  { name: 'Lime', value: 'lime', hex: '#94d82d' },
  { name: 'Teal', value: 'teal', hex: '#20c997' },
  { name: 'Indigo', value: 'indigo', hex: '#748ffc' },
  { name: 'Violet', value: 'violet', hex: '#da77f2' },
];

// Component to display formatted text
export const FormattedText = ({ text }) => {
  return <div className="formatted-text-container">{parseFormattedText(text)}</div>;
};

export default FormattedText;
