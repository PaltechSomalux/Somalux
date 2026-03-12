import React, { useState, useRef, useEffect, useCallback } from 'react';
import { throttle } from 'lodash';
import './Memes.css';

const SHAPES = [
  // Basic 2D Shapes
  'rectangle', 'circle', 'triangle', 'square', 'oval',  
  'pentagon', 'hexagon', 'heptagon', 'octagon', 'nonagon', 'decagon',
  
  // Quadrilaterals & Other Polygons
  'rhombus', 'parallelogram', 'trapezoid', 'kite', 'star', 'cross',
  
  // Curved & Organic Shapes
  'ellipse', 'arch', 'spiral', 'wave', 'teardrop', 'blob', 'cloud', 'flower', 'leaf',
  
  // Advanced 2D Shapes
  'dodecagon', 'tetradecagon', 'polygon', 'concave polygon', 'convex polygon', 
  'regular polygon', 'irregular polygon', 'quatrefoil', 'trefoil', 'annulus',
  
  // 3D Shapes
  'cube', 'sphere', 'cylinder', 'cone', 'pyramid', 'triangular prism', 
  'rectangular prism', 'pentagonal prism', 'hexagonal prism', 'octahedron',
  'dodecahedron', 'icosahedron', 'torus', 'ellipsoid', 'hyperboloid', 'paraboloid',
  
  // Symbolic & Abstract Shapes
  'heart', 'crescent', 'semicircle', 'infinity', 'mobius'
];
const EMOJIS = [
  // Smileys & People
  '😂', '😍', '🤣', '😊', '😎', '😁', '😜', '😢', '😭', '😤', 
  '😱', '😴', '😇', '🤔', '🤗', '🤩', '🤪', '🧐', '🥳', '🥺',
  '😡', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😈',
  '👻', '👽', '🤠', '👹', '👺', '🤡', '👾', '🤖', '🎃', '😺',
  '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👶', '👧',
  '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '👨‍🦱', '👩‍🦰', '👨‍🦰', '👱‍♀️',
  '👱‍♂️', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳‍♂️', '🧕', '👮‍♀️', '👮‍♂️',
  '👷‍♀️', '👷‍♂️', '💂‍♀️', '💂‍♂️', '🕵️‍♀️', '🕵️‍♂️', '👩‍⚕️', '👨‍⚕️', '👩‍🌾', '👨‍🌾',
  '👩‍🍳', '👨‍🍳', '👩‍🎓', '👨‍🎓', '👩‍🎤', '👨‍🎤', '👩‍🏫', '👨‍🏫', '👩‍🏭', '👨‍🏭',
  '👩‍💻', '👨‍💻', '👩‍💼', '👨‍💼', '👩‍🔧', '👨‍🔧', '👩‍🔬', '👨‍🔬', '👩‍🎨', '👨‍🎨',
  '👩‍🚒', '👨‍🚒', '👩‍✈️', '👨‍✈️', '👩‍🚀', '👨‍🚀', '👩‍⚖️', '👨‍⚖️', '👰', '🤵',
  '👸', '🤴', '🦸‍♀️', '🦸‍♂️', '🦹‍♀️', '🦹‍♂️', '🤶', '🎅', '🧙‍♀️', '🧙‍♂️',
  '🧚‍♀️', '🧚‍♂️', '🧛‍♀️', '🧛‍♂️', '🧜‍♀️', '🧜‍♂️', '🧝‍♀️', '🧝‍♂️', '🧞‍♀️', '🧞‍♂️',
  '🧟‍♀️', '🧟‍♂️', '💆‍♀️', '💆‍♂️', '💇‍♀️', '💇‍♂️', '🚶‍♀️', '🚶‍♂️', '🧍‍♀️', '🧍‍♂️',
  '🧎‍♀️', '🧎‍♂️', '👩‍🦯', '👨‍🦯', '👩‍🦼', '👨‍🦼', '👩‍🦽', '👨‍🦽', '🏃‍♀️', '🏃‍♂️',
  '💃', '🕺', '🕴️', '👯‍♀️', '👯‍♂️', '🧖‍♀️', '🧖‍♂️', '🧗‍♀️', '🧗‍♂️', '🤺',
  '🏇', '⛷️', '🏂', '🏌️‍♀️', '🏌️‍♂️', '🏄‍♀️', '🏄‍♂️', '🚣‍♀️', '🚣‍♂️', '🏊‍♀️',
  '🏊‍♂️', '⛹️‍♀️', '⛹️‍♂️', '🏋️‍♀️', '🏋️‍♂️', '🚴‍♀️', '🚴‍♂️', '🚵‍♀️', '🚵‍♂️', '🤸‍♀️',
  '🤸‍♂️', '🤼‍♀️', '🤼‍♂️', '🤽‍♀️', '🤽‍♂️', '🤾‍♀️', '🤾‍♂️', '🤹‍♀️', '🤹‍♂️', '🧘‍♀️',
  '🧘‍♂️', '🛀', '🛌', '🧑‍🤝‍🧑', '👭', '👫', '👬', '💏', '💑', '👪',
  
  // Gestures & Body Parts
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '🖐️',
  '✋', '👏', '🙌', '👐', '🙏', '🤝', '💪', '👀', '👁️', '🧠',
  '🦷', '🦴', '👅', '👄', '👃', '👂', '🦻', '🦶', '🦵', '🦿',
  '🦾', '💋', '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖',
  '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳',
  '👙', '👚', '👛', '👜', '👝', '🎒', '👞', '👟', '🥾', '🥿',
  '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓', '🧢', '⛑️',
  '💄', '💍', '🌂', '🧳', '☂️', '🧴', '🧷', '🧹', '🧺', '🧻',
  
  // Animals & Nature
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦄',
  '🦋', '🐝', '🐛', '🦟', '🐠', '🐬', '🦈', '🐳', '🌵', '🎄',
  '🌹', '🌸', '🌼', '🌻', '🍁', '🌾', '🍄', '🌎', '🌞', '⭐',
  '🐌', '🦗', '🕷️', '🕸️', '🦂', '🦀', '🦞', '🦐', '🦑', '🐙',
  '🦔', '🦇', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
  '🐜', '🦗', '🕷️', '🦂', '🦟', '🦠', '🐢', '🐍', '🦎', '🦖',
  '🦕', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏',
  '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏',
  '🐑', '🦙', '🐐', '🦌', '🐕', '🦮', '🐩', '🐈', '🐓', '🦃',
  '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦',
  '🦥', '🐁', '🐀', '🐿️', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️',
  '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🌺', '🌻', '🌹',
  '🥀', '🌷', '🌼', '🌸', '💐', '🌾', '🌷', '🌱', '🌿', '🍀',
  '☘️', '🍃', '🌵', '🌴', '🌳', '🌲', '🌞', '🌝', '🌛', '🌜',
  '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙',
  '🌎', '🌍', '🌏', '🪐', '💫', '⭐', '🌟', '✨', '⚡', '☄️',
  '💥', '🔥', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️',
  '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️',
  '☔', '💧', '💦', '🌊', '🍏', '🍎', '🍐', '🍊', '🍋', '🍌',
  '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝',
  
  // Food & Drink
  '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑',
  '🍍', '🥝', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥦', '🍞',
  '🧀', '🍕', '🌮', '🍔', '🍟', '🍣', '🍩', '🍪', '🍫', '🍿',
  '☕', '🍵', '🍺', '🍷', '🥂', '🍾', '🍼', '🥤', '🧃', '🧉',
  '🥐', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓',
  '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚',
  '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍝',
  '🍜', '🍠', '🍢', '🍡', '🍤', '🍥', '🥮', '🍘', '🍚', '🍙',
  '🍛', '🍣', '🍱', '🥟', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂',
  '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛',
  '☕', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂',
  '🥃', '🥤', '🧃', '🧊', '🥢', '🍽️', '🍴', '🥄', '🔪', '🏺',
  
  // Activities & Sports
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸',
  '🥊', '🥋', '🎯', '🎮', '🎲', '🧩', '🎨', '🎹', '🎸', '🎺',
  '🎷', '🎻', '🥁', '🎤', '🎧', '🎬', '🏆', '🎪', '🎭', '🩰',
  '🛹', '🛼', '🛷', '⛸️', '🥌', '🎯', '🎳', '🎣', '🎽', '🎿',
  '🪂', '🏹', '🏏', '🏑', '🏒', '🥍', '🏸', '🏊‍♀️', '🏊‍♂️', '🤽‍♀️',
  '🤽‍♂️', '🚣‍♀️', '🚣‍♂️', '🧗‍♀️', '🧗‍♂️', '🚵‍♀️', '🚵‍♂️', '🚴‍♀️', '🚴‍♂️', '🏋️‍♀️',
  '🏋️‍♂️', '🤸‍♀️', '🤸‍♂️', '⛹️‍♀️', '⛹️‍♂️', '🤺', '🤼‍♀️', '🤼‍♂️', '🤾‍♀️', '🤾‍♂️',
  '🏌️‍♀️', '🏌️‍♂️', '🏇', '🧘‍♀️', '🧘‍♂️', '🎗️', '🏅', '🎖️', '🏆', '🥇',
  '🥈', '🥉', '🎫', '🎟️', '🎭', '🎨', '🎪', '🎤', '🎧', '🎼',
  '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎬', '🎮', '👾',
  '🎯', '🎲', '🎰', '🎳', '🧩', '♟️', '🀄', '🎴', '🎭', '🖼️',
  '🎨', '🧵', '🪡', '🧶', '🪢', '👓', '🕶️', '🥽', '🥼', '🦺',
  
  // Travel & Places
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚲',
  '🛵', '✈️', '🚀', '🛸', '🚁', '⛵', '🛳️', '🚂', '🚊', '🚇',
  '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '⛪',
  '🕌', '🛕', '🕍', '⛩️', '🌋', '⛰️', '🏕️', '🌅', '🌄', '🌠',
  '🛺', '🚜', '🛴', '🚲', '🛵', '🏍️', '🚨', '🚔', '🚍', '🚘',
  '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅',
  '🚈', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺',
  '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🛥️', '🚤', '🛳️', '⛴️',
  '🚢', '⚓', '🚧', '⛽', '🚏', '🚦', '🚥', '🗺️', '🗿', '🗽',
  '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️',
  '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🛖', '🏠',
  '🏡', '🏘️', '🏚️', '🏗️', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦',
  '🏨', '🏩', '🏪', '🏫', '🏟️', '🏛️', '⛪', '🕌', '🛕', '🕍',
  '⛩️', '🕋', '🛐', '🛤️', '🛣️', '🗾', '🎑', '🏞️', '🌅', '🌄',
  '🌠', '🎇', '🎆', '🌇', '🌆', '🏙️', '🌃', '🌌', '🌉', '🌁',
  
  // Objects
  '⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💾', '💿',
  '📷', '🎥', '📽️', '🎞️', '📞', '📟', '📺', '📻', '🎙️', '🎚️',
  '⏱️', '💰', '💎', '🧸', '🎁', '🎈', '🎀', '🧧', '✉️', '📦',
  '📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💻', '🖥️',
  '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷',
  '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺',
  '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛',
  '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️',
  '💸', '💵', '💴', '💶', '💷', '💰', '💳', '🧾', '💎', '⚖️',
  '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️',
  '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬',
  '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬',
  '🕳️', '🛏️', '🛋️', '🪑', '🚽', '🪠', '🚿', '🛁', '🪤', '🧴',
  '🧷', '🧹', '🧺', '🧻', '🧼', '🧽', '🧯', '🛒', '🚬', '⚰️',
  '⚱️', '🗿', '🏧', '🚮', '🚰', '♿', '🚹', '🚺', '🚻', '🚼',
  '🚾', '🛂', '🛃', '🛄', '🛅', '⚠️', '🚸', '⛔', '🚫', '🚳',
  '🚭', '🚯', '🚱', '🚷', '📵', '🔞', '☢️', '☣️', '⬆️', '↗️',
  '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️',
  '⤴️', '⤵️', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝', '🛐',
  '⚛️', '🕉️', '✡️', '☸️', '☯️', '☮️', '🕎', '🔯', '♈', '♉',
  '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓',
  '⛎', '🔀', '🔁', '🔂', '▶️', '⏩', '⏭️', '⏯️', '◀️', '⏪',
  '⏮️', '🔼', '⏫', '🔽', '⏬', '⏸️', '⏹️', '⏺️', '⏏️', '🎦',
  '🔅', '🔆', '📶', '📳', '📴', '♀️', '♂️', '⚧️', '✖️', '➕',
  '➖', '➗', '♾️', '‼️', '⁉️', '❓', '❔', '❕', '❗', '〰️',
  '💱', '💲', '⚕️', '♻️', '⚜️', '🔱', '📛', '🔰', '⭕', '✅',
  '☑️', '✔️', '❌', '❎', '➰', '➿', '〽️', '✳️', '✴️', '❇️',
  '©️', '®️', '™️', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣',
  '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔠', '🔡', '🔢', '🔣',
  '🔤', '🅰️', '🆎', '🅱️', '🆑', '🅾️', '🆘', '⛎', '🔺', '🔻',
  '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽',
  '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛',
  '⬜', '🔈', '🔉', '🔊', '📢', '📣', '📯', '🔔', '🔕', '🎵',
  '🎶', '🏧', '🚮', '🚰', '♿', '🚹', '🚺', '🚻', '🚼', '🚾',
  '🛂', '🛃', '🛄', '🛅', '⚠️', '🚸', '⛔', '🚫', '🚳', '🚭',
  '🚯', '🚱', '🚷', '📵', '🔞', '☢️', '☣️', '⬆️', '↗️', '➡️',
  '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️',
  '⤵️', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝', '🛐', '⚛️',
  '🕉️', '✡️', '☸️', '☯️', '☮️', '🕎', '🔯', '♈', '♉', '♊',
  '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '⛎',
  '🔀', '🔁', '🔂', '▶️', '⏩', '⏭️', '⏯️', '◀️', '⏪', '⏮️',
  '🔼', '⏫', '🔽', '⏬', '⏸️', '⏹️', '⏺️', '⏏️', '🎦', '🔅',
  '🔆', '📶', '📳', '📴', '♀️', '♂️', '⚧️', '✖️', '➕', '➖',
  '➗', '♾️', '‼️', '⁉️', '❓', '❔', '❕', '❗', '〰️', '💱',
  '💲', '⚕️', '♻️', '⚜️', '🔱', '📛', '🔰', '⭕', '✅', '☑️',
  '✔️', '❌', '❎', '➰', '➿', '〽️', '✳️', '✴️', '❇️', '©️',
  '®️', '™️', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣',
  '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔠', '🔡', '🔢', '🔣', '🔤',
  '🅰️', '🆎', '🅱️', '🆑', '🅾️', '🆘', '⛎', '🔺', '🔻', '🔸',
  '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️',
  '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛', '⬜',
  '🔈', '🔉', '🔊', '📢', '📣', '📯', '🔔', '🔕', '🎵', '🎶',
  
  // Symbols
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
  '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🛐', '⚛️', '🆔', '⚕️',
  '🅰️', '🆎', '🅱️', '🆑', '🅾️', '🆘', '❌', '⭕', '💢', '‼️',
  '⁉️', '❓', '❔', '❕', '❗', '〰️', '💱', '💲', '⚕️', '♻️',
  '⚜️', '🔱', '📛', '🔰', '⭕', '✅', '☑️', '✔️', '❌', '❎',
  '➰', '➿', '〽️', '✳️', '✴️', '❇️', '©️', '®️', '™️', '#️⃣',
  '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣',
  '9️⃣', '🔟', '🔠', '🔡', '🔢', '🔣', '🔤', '🅰️', '🆎', '🅱️',
  '🆑', '🅾️', '🆘', '⛎', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷',
  '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧',
  '🟨', '🟩', '🟦', '🟪', '🟫', '⬛', '⬜', '🔈', '🔉', '🔊',
  '📢', '📣', '📯', '🔔', '🔕', '🎵', '🎶', '🏧', '🚮', '🚰',
  '♿', '🚹', '🚺', '🚻', '🚼', '🚾', '🛂', '🛃', '🛄', '🛅',
  '⚠️', '🚸', '⛔', '🚫', '🚳', '🚭', '🚯', '🚱', '🚷', '📵',
  '🔞', '☢️', '☣️', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️',
  '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔄', '🔙',
  '🔚', '🔛', '🔜', '🔝', '🛐', '⚛️', '🕉️', '✡️', '☸️', '☯️',
  '☮️', '🕎', '🔯', '♈', '♉', '♊', '♋', '♌', '♍', '♎',
  '♏', '♐', '♑', '♒', '♓', '⛎', '🔀', '🔁', '🔂', '▶️',
  '⏩', '⏭️', '⏯️', '◀️', '⏪', '⏮️', '🔼', '⏫', '🔽', '⏬',
  '⏸️', '⏹️', '⏺️', '⏏️', '🎦', '🔅', '🔆', '📶', '📳', '📴',
  '♀️', '♂️', '⚧️', '✖️', '➕', '➖', '➗', '♾️', '‼️', '⁉️',
  '❓', '❔', '❕', '❗', '〰️', '💱', '💲', '⚕️', '♻️', '⚜️',
  '🔱', '📛', '🔰', '⭕', '✅', '☑️', '✔️', '❌', '❎', '➰',
  '➿', '〽️', '✳️', '✴️', '❇️', '©️', '®️', '™️', '#️⃣', '*️⃣',
  '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣',
  '🔟', '🔠', '🔡', '🔢', '🔣', '🔤', '🅰️', '🆎', '🅱️', '🆑',
  '🅾️', '🆘', '⛎', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳',
  '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨',
  '🟩', '🟦', '🟪', '🟫', '⬛', '⬜', '🔈', '🔉', '🔊', '📢',
  '📣', '📯', '🔔', '🔕', '🎵', '🎶'
];

export const Memes = () => {
  const [image, setImage] = useState(null);
  const [texts, setTexts] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [emojis, setEmojis] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [activeElement, setActiveElement] = useState({ type: null, id: null });
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [fontFamily, setFontFamily] = useState('Impact');
  const [textColor, setTextColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [shapeColor, setShapeColor] = useState('#ff0000');
  const [photoOpacity, setPhotoOpacity] = useState(100);
  const [photoBrightness, setPhotoBrightness] = useState(100);
  const [emojiSize, setEmojiSize] = useState(40);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStartAngle, setRotationStartAngle] = useState(0);
  const [rotationCenter, setRotationCenter] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [initialDistance, setInitialDistance] = useState(null);
  const [initialFontSize, setInitialFontSize] = useState(40);
  const [textStyles, setTextStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [selectedShape, setSelectedShape] = useState('rectangle');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [isCropping, setIsCropping] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [cropPreview, setCropPreview] = useState(null);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    blur: 0,
  });

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const imageRef = useRef(null);
  const wrapperRef = useRef(null);
  const textInputRef = useRef(null);
  const cropRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (isCropping && imageRef.current) {
      const img = imageRef.current;
      const rect = img.getBoundingClientRect();
      const margin = 20;
      setCropArea({
        x: rect.left + margin,
        y: rect.top + margin,
        width: rect.width - 2 * margin,
        height: rect.height - 2 * margin,
      });
    }
  }, [isCropping]);

  useEffect(() => {
    if (activeElement.type === 'text' && activeElement.id && selectedFeature === 'text') {
      updateText(activeElement.id, { color: textColor, stroke: strokeColor });
    }
  }, [textColor, strokeColor, activeElement, selectedFeature]);

  useEffect(() => {
    if (activeElement.type === 'shape' && activeElement.id && selectedFeature === 'shape') {
      updateShape(activeElement.id, { color: shapeColor });
    }
  }, [shapeColor, activeElement, selectedFeature]);

  useEffect(() => {
    if (activeElement.type === 'photo' && activeElement.id && selectedFeature === 'photo') {
      updatePhoto(activeElement.id, { opacity: photoOpacity / 100, brightness: photoBrightness / 100 });
    }
  }, [photoOpacity, photoBrightness, activeElement, selectedFeature]);

  useEffect(() => {
    if (activeElement.type === 'text' && activeElement.id && isEditing && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [isEditing, activeElement]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: parseInt(value),
    }));
  }, []);

  const addText = useCallback(() => {
    const newText = {
      id: Date.now(),
      type: 'text',
      content: 'Tap to edit',
      x: 50,
      y: 50,
      fontFamily,
      fontSize: 40,
      color: textColor,
      stroke: strokeColor,
      rotation: 0,
      bold: textStyles.bold,
      italic: textStyles.italic,
      underline: textStyles.underline,
    };
    setTexts((prev) => [...prev, newText]);
    setActiveElement({ type: 'text', id: newText.id });
    setSelectedFeature('text');
    setIsEditing(true);
  }, [fontFamily, textColor, strokeColor, textStyles]);

  const addShape = useCallback(() => {
    const newShape = {
      id: Date.now(),
      type: 'shape',
      shapeType: selectedShape,
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      color: shapeColor,
      rotation: 0,
    };
    setShapes((prev) => [...prev, newShape]);
    setActiveElement({ type: 'shape', id: newShape.id });
    setSelectedFeature('shape');
  }, [selectedShape, shapeColor]);

  const addEmoji = useCallback(() => {
    const newEmoji = {
      id: Date.now(),
      type: 'emoji',
      emoji: selectedEmoji,
      x: 150,
      y: 150,
      size: emojiSize,
      rotation: 0,
    };
    setEmojis((prev) => [...prev, newEmoji]);
    setActiveElement({ type: 'emoji', id: newEmoji.id });
    setSelectedFeature('emoji');
  }, [selectedEmoji, emojiSize]);

  const addPhoto = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newPhoto = {
        id: Date.now(),
        type: 'photo',
        src: event.target.result,
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        opacity: photoOpacity / 100,
        brightness: photoBrightness / 100,
        rotation: 0,
      };
      setPhotos((prev) => [...prev, newPhoto]);
      setActiveElement({ type: 'photo', id: newPhoto.id });
      setSelectedFeature('photo');
    };
    reader.readAsDataURL(file);
  }, [photoOpacity, photoBrightness]);

  const updateText = useCallback((id, updates) => {
    setTexts((prev) =>
      prev.map((text) => (text.id === id ? { ...text, ...updates } : text))
    );
  }, []);

  const updateShape = useCallback((id, updates) => {
    setShapes((prev) =>
      prev.map((shape) => (shape.id === id ? { ...shape, ...updates } : shape))
    );
  }, []);

  const updateEmoji = useCallback((id, updates) => {
    setEmojis((prev) =>
      prev.map((emoji) => (emoji.id === id ? { ...emoji, ...updates } : emoji))
    );
  }, []);

  const updatePhoto = useCallback((id, updates) => {
    setPhotos((prev) =>
      prev.map((photo) => (photo.id === id ? { ...photo, ...updates } : photo))
    );
  }, []);

  const deleteElement = useCallback(() => {
    if (!activeElement.id) return;
    if (activeElement.type === 'text') {
      setTexts((prev) => prev.filter((text) => text.id !== activeElement.id));
    } else if (activeElement.type === 'shape') {
      setShapes((prev) => prev.filter((shape) => shape.id !== activeElement.id));
    } else if (activeElement.type === 'emoji') {
      setEmojis((prev) => prev.filter((emoji) => emoji.id !== activeElement.id));
    } else if (activeElement.type === 'photo') {
      setPhotos((prev) => prev.filter((photo) => photo.id !== activeElement.id));
    }
    setActiveElement({ type: null, id: null });
  }, [activeElement]);

  const toggleTextStyle = useCallback(
    (style) => {
      const newValue = !textStyles[style];
      setTextStyles((prev) => ({ ...prev, [style]: newValue }));
      if (activeElement.type === 'text' && activeElement.id) {
        updateText(activeElement.id, { [style]: newValue });
      }
    },
    [activeElement, textStyles, updateText]
  );

  const handleElementClick = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      if (isCropping) return;
      setActiveElement({ type, id });
      setSelectedFeature(type);
      if (type === 'text') {
        const text = texts.find((t) => t.id === id);
        if (text) {
          setTextStyles({
            bold: text.bold || false,
            italic: text.italic || false,
            underline: text.underline || false,
          });
          setTextColor(text.color || '#ffffff');
          setStrokeColor(text.stroke || '#000000');
          setFontFamily(text.fontFamily || 'Impact');
        }
      } else if (type === 'shape') {
        const shape = shapes.find((s) => s.id === id);
        if (shape) {
          setShapeColor(shape.color || '#ff0000');
          setSelectedShape(shape.shapeType || 'rectangle');
        }
      } else if (type === 'emoji') {
        const emoji = emojis.find((em) => em.id === id);
       
      } else if (type === 'photo') {
        const photo = photos.find((p) => p.id === id);
        if (photo) {
          setPhotoOpacity(photo.opacity * 100 || 100);
          setPhotoBrightness(photo.brightness * 100 || 100);
        }
      }
    },
    [texts, shapes, emojis, photos, isCropping]
  );

  const handleDoubleClick = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      if (isCropping) return;
      setActiveElement({ type, id });
      setSelectedFeature(type);
      if (type === 'text') {
        setIsEditing(true);
        const text = texts.find((t) => t.id === id);
        if (text) {
          setTextStyles({
            bold: text.bold || false,
            italic: text.italic || false,
            underline: text.underline || false,
          });
          setTextColor(text.color || '#ffffff');
          setStrokeColor(text.stroke || '#000000');
          setFontFamily(text.fontFamily || 'Impact');
        }
      }
    },
    [texts, isCropping]
  );

  const startLongPress = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      if (isCropping) return;
      const timer = setTimeout(() => {
        setActiveElement({ type, id });
        setSelectedFeature(type);
        if (type === 'text') {
          setIsEditing(true);
          const text = texts.find((t) => t.id === id);
          if (text) {
            setTextStyles({
              bold: text.bold || false,
              italic: text.italic || false,
              underline: text.underline || false,
            });
            setTextColor(text.color || '#ffffff');
            setStrokeColor(text.stroke || '#000000');
            setFontFamily(text.fontFamily || 'Impact');
          }
        }
      }, 500);
      setLongPressTimer(timer);
    },
    [texts, isCropping]
  );

  const cancelLongPress = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const startDragging = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      e.preventDefault();
      if (isCropping) return;
      if (e.target.classList.contains('rotation-handle')) return;
      setDragging(true);
      setActiveElement({ type, id });
      setSelectedFeature(type);

      let element;
      if (type === 'text') {
        element = texts.find((t) => t.id === id);
      } else if (type === 'shape') {
        element = shapes.find((s) => s.id === id);
      } else if (type === 'emoji') {
        element = emojis.find((em) => em.id === id);
      } else if (type === 'photo') {
        element = photos.find((p) => p.id === id);
      }

      if (!element) return;

      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;

      setDragOffset({
        x: clientX - element.x,
        y: clientY - element.y,
      });
    },
    [texts, shapes, emojis, photos, isCropping]
  );

  const handleDrag = useCallback(
    throttle((e) => {
      if (!dragging || !activeElement.id) return;
      e.preventDefault();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      const newX = clientX - dragOffset.x;
      const newY = clientY - dragOffset.y;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (activeElement.type === 'text') {
          setTexts((prev) =>
            prev.map((text) =>
              text.id === activeElement.id ? { ...text, x: newX, y: newY } : text
            )
          );
        } else if (activeElement.type === 'shape') {
          setShapes((prev) =>
            prev.map((shape) =>
              shape.id === activeElement.id ? { ...shape, x: newX, y: newY } : shape
            )
          );
        } else if (activeElement.type === 'emoji') {
          setEmojis((prev) =>
            prev.map((emoji) =>
              emoji.id === activeElement.id ? { ...emoji, x: newX, y: newY } : emoji
            )
          );
        } else if (activeElement.type === 'photo') {
          setPhotos((prev) =>
            prev.map((photo) =>
              photo.id === activeElement.id ? { ...photo, x: newX, y: newY } : photo
            )
          );
        }
      });
    }, 8),
    [dragging, activeElement, dragOffset]
  );

  const stopDragging = useCallback(() => {
    setDragging(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target.result);
      setTexts([]);
      setShapes([]);
      setEmojis([]);
      setPhotos([]);
      setActiveElement({ type: null, id: null });
      setSelectedFeature(null);
      setIsCropping(false);
      setCropArea({ x: 0, y: 0, width: 0, height: 0 });
      setCropPreview(null);
      setFilters({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const startRotation = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      e.preventDefault();
      if (isCropping) return;
      cancelLongPress();
      setIsRotating(true);
      setActiveElement({ type, id });
      setSelectedFeature(type);

      let element;
      if (type === 'text') {
        element = texts.find((t) => t.id === id);
      } else if (type === 'shape') {
        element = shapes.find((s) => s.id === id);
      } else if (type === 'emoji') {
        element = emojis.find((em) => em.id === id);
      } else if (type === 'photo') {
        element = photos.find((p) => p.id === id);
      }

      if (!element) return;

      setRotationCenter({ x: element.x, y: element.y });
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      const dx = clientX - element.x;
      const dy = clientY - element.y;
      setRotationStartAngle(Math.atan2(dy, dx) * (180 / Math.PI) - (element.rotation || 0));
    },
    [texts, shapes, emojis, photos, isCropping, cancelLongPress]
  );

  const handleRotation = useCallback(
    throttle((e) => {
      if (!isRotating || !activeElement.id) return;
      e.preventDefault();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      const dx = clientX - rotationCenter.x;
      const dy = clientY - rotationCenter.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const newRotation = angle - rotationStartAngle;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (activeElement.type === 'text') {
          updateText(activeElement.id, { rotation: newRotation });
        } else if (activeElement.type === 'shape') {
          updateShape(activeElement.id, { rotation: newRotation });
        } else if (activeElement.type === 'emoji') {
          updateEmoji(activeElement.id, { rotation: newRotation });
        } else if (activeElement.type === 'photo') {
          updatePhoto(activeElement.id, { rotation: newRotation });
        }
      });
    }, 8),
    [isRotating, activeElement, rotationCenter, rotationStartAngle, updateText, updateShape, updateEmoji, updatePhoto]
  );

  const stopRotation = useCallback(() => {
    setIsRotating(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const handleMouseWheelRotation = useCallback(
    (e) => {
      if (isCropping) return;
      if (e.ctrlKey && activeElement.id) {
        e.preventDefault();
        let element;
        if (activeElement.type === 'text') {
          element = texts.find((t) => t.id === activeElement.id);
        } else if (activeElement.type === 'shape') {
          element = shapes.find((s) => s.id === activeElement.id);
        } else if (activeElement.type === 'emoji') {
          element = emojis.find((em) => em.id === activeElement.id);
        } else if (activeElement.type === 'photo') {
          element = photos.find((p) => p.id === activeElement.id);
        }

        if (!element) return;

        const rotationDelta = e.deltaY * 0.2;
        const newRotation = (element.rotation || 0) - rotationDelta;

        if (activeElement.type === 'text') {
          updateText(activeElement.id, { rotation: newRotation });
        } else if (activeElement.type === 'shape') {
          updateShape(activeElement.id, { rotation: newRotation });
        } else if (activeElement.type === 'emoji') {
          updateEmoji(activeElement.id, { rotation: newRotation });
        } else if (activeElement.type === 'photo') {
          updatePhoto(activeElement.id, { rotation: newRotation });
        }
      }
    },
    [activeElement, texts, shapes, emojis, photos, isCropping, updateText, updateShape, updateEmoji, updatePhoto]
  );

  const handleTextZoom = useCallback(
    throttle((id, e) => {
      if (activeElement.type !== 'text' || activeElement.id !== id) return;
      const delta = e.deltaY || 0;
      const zoomStep = 0.5;
      const minFontSize = 10;
      const maxFontSize = 200;
      const text = texts.find((t) => t.id === id);
      if (!text) return;
      const newFontSize = Math.min(Math.max(text.fontSize - delta * zoomStep, minFontSize), maxFontSize);
      updateText(id, { fontSize: newFontSize });
    }, 10),
    [activeElement, texts, updateText]
  );

  const handleShapeResize = useCallback(
    throttle((id, e) => {
      if (activeElement.type !== 'shape' || activeElement.id !== id) return;
      const delta = e.deltaY || 0;
      const resizeStep = 1;
      const minSize = 20;
      const maxSize = 500;
      const shape = shapes.find((s) => s.id === id);
      if (!shape) return;
      const newWidth = Math.min(Math.max(shape.width - delta * resizeStep, minSize), maxSize);
      const newHeight = Math.min(Math.max(shape.height - delta * resizeStep, minSize), maxSize);
      updateShape(id, { width: newWidth, height: newHeight });
    }, 10),
    [activeElement, shapes, updateShape]
  );

  const handleEmojiZoom = useCallback(
    throttle((id, e) => {
      if (activeElement.type !== 'emoji' || activeElement.id !== id) return;
      const delta = e.deltaY || 0;
      const zoomStep = 0.5;
      const minSize = 10;
      const maxSize = 200;
      const emoji = emojis.find((em) => em.id === id);
      if (!emoji) return;
      const newSize = Math.min(Math.max(emoji.size - delta * zoomStep, minSize), maxSize);
      updateEmoji(id, { size: newSize });
    }, 10),
    [activeElement, emojis, updateEmoji]
  );

  const handlePhotoResize = useCallback(
    throttle((id, e) => {
      if (activeElement.type !== 'photo' || activeElement.id !== id) return;
      const delta = e.deltaY || 0;
      const resizeStep = 1;
      const minSize = 20;
      const maxSize = 500;
      const photo = photos.find((p) => p.id === id);
      if (!photo) return;
      const newWidth = Math.min(Math.max(photo.width - delta * resizeStep, minSize), maxSize);
      const newHeight = Math.min(Math.max(photo.height - delta * resizeStep, minSize), maxSize);
      updatePhoto(id, { width: newWidth, height: newHeight });
    }, 10),
    [activeElement, photos, updatePhoto]
  );

  const handleTouchZoom = useCallback(
    (type, id, e) => {
      if (isCropping) return;
      if (e.touches.length === 2) {
        e.preventDefault();
        setActiveElement({ type, id });
        setSelectedFeature(type);
        let initialSize;
        if (type === 'text') {
          const text = texts.find((t) => t.id === id);
          if (!text) return;
          initialSize = text.fontSize;
        } else if (type === 'shape') {
          const shape = shapes.find((s) => s.id === id);
          if (!shape) return;
          initialSize = shape.width;
        } else if (type === 'emoji') {
          const emoji = emojis.find((em) => em.id === id);
          if (!emoji) return;
          initialSize = emoji.size;
        } else if (type === 'photo') {
          const photo = photos.find((p) => p.id === id);
          if (!photo) return;
          initialSize = photo.width;
        }
        setInitialFontSize(initialSize);
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        setInitialDistance(dist);
      }
    },
    [texts, shapes, emojis, photos, isCropping]
  );

  const handleTouchMove = useCallback(
    throttle((e) => {
      if (e.touches.length === 2 && initialDistance !== null) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        const scale = currentDistance / initialDistance;
        const newSize = Math.min(Math.max(initialFontSize * scale, 10), 500);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          if (activeElement.type === 'text') {
            updateText(activeElement.id, { fontSize: newSize });
          } else if (activeElement.type === 'shape') {
            updateShape(activeElement.id, { width: newSize, height: newSize });
          } else if (activeElement.type === 'emoji') {
            updateEmoji(activeElement.id, { size: newSize });
          } else if (activeElement.type === 'photo') {
            updatePhoto(activeElement.id, { width: newSize, height: newSize });
          }
        });
      } else if (e.touches.length === 1) {
        handleDrag(e);
      }
    }, 8),
    [initialDistance, initialFontSize, activeElement, updateText, updateShape, updateEmoji, updatePhoto, handleDrag]
  );

  const handleTouchEnd = useCallback(() => {
    setInitialDistance(null);
    stopDragging();
    stopRotation();
    cancelLongPress();
  }, [stopDragging, stopRotation, cancelLongPress]);

  const startCropDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    setDragOffset({ x: clientX - cropArea.x, y: clientY - cropArea.y });
  }, [cropArea]);

  const handleCropDrag = useCallback(
    throttle((e) => {
      if (!dragging) return;
      e.preventDefault();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      const imgRect = imageRef.current.getBoundingClientRect();
      const margin = 10;

      let newX = clientX - dragOffset.x;
      let newY = clientY - dragOffset.y;

      newX = Math.max(imgRect.left + margin, Math.min(newX, imgRect.right - cropArea.width - margin));
      newY = Math.max(imgRect.top + margin, Math.min(newY, imgRect.bottom - cropArea.height - margin));

      setCropArea((prev) => ({ ...prev, x: newX, y: newY }));
    }, 8),
    [dragging, dragOffset, cropArea]
  );

  const startCropResize = useCallback(
    (handle, e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
      setDragOffset({ x: e.clientX, y: e.clientY, handle });
    },
    []
  );

  const handleCropResize = useCallback(
    throttle((e) => {
      if (!dragging || !dragOffset.handle) return;
      e.preventDefault();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      const imgRect = imageRef.current.getBoundingClientRect();
      const margin = 10;
      const minSize = 20;

      setCropArea((prev) => {
        let { x, y, width, height } = prev;
        const deltaX = clientX - dragOffset.x;
        const deltaY = clientY - dragOffset.y;

        switch (dragOffset.handle) {
          case 'top-left':
            x = Math.max(imgRect.left + margin, Math.min(clientX, x + width - minSize));
            y = Math.max(imgRect.top + margin, Math.min(clientY, y + height - minSize));
            width = prev.x + prev.width - x;
            height = prev.y + prev.height - y;
            break;
          case 'top-right':
            y = Math.max(imgRect.top + margin, Math.min(clientY, y + height - minSize));
            width = Math.max(minSize, Math.min(clientX - prev.x, imgRect.right - prev.x - margin));
            height = prev.y + prev.height - y;
            break;
          case 'bottom-left':
            x = Math.max(imgRect.left + margin, Math.min(clientX, x + width - minSize));
            width = prev.x + prev.width - x;
            height = Math.max(minSize, Math.min(clientY - prev.y, imgRect.bottom - prev.y - margin));
            break;
          case 'bottom-right':
            width = Math.max(minSize, Math.min(clientX - prev.x, imgRect.right - prev.x - margin));
            height = Math.max(minSize, Math.min(clientY - prev.y, imgRect.bottom - prev.y - margin));
            break;
          default:
            break;
        }

        width = Math.max(minSize, width);
        height = Math.max(minSize, height);

        return { x, y, width, height };
      });

      setDragOffset((prev) => ({ ...prev, x: clientX, y: clientY }));
    }, 8),
    [dragging, dragOffset]
  );

  const stopCrop = useCallback(() => {
    setDragging(false);
    setDragOffset({ x: 0, y: 0, handle: null });
  }, []);

  const applyCrop = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    const imgRect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;

    canvas.width = cropArea.width * scaleX;
    canvas.height = cropArea.height * scaleY;

    // Apply filters to the cropped image
    ctx.filter = `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturation}%)
      grayscale(${filters.grayscale}%)
      sepia(${filters.sepia}%)
      blur(${filters.blur}px)
    `;
    ctx.drawImage(
      img,
      (cropArea.x - imgRect.left) * scaleX,
      (cropArea.y - imgRect.top) * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );
    ctx.filter = 'none';

    const croppedImage = canvas.toDataURL('image/png');
    setImage(croppedImage);
    setIsCropping(false);
    setCropPreview(null);
    setCropArea({ x: 0, y: 0, width: 0, height: 0 });

    const offsetX = cropArea.x - imgRect.left;
    const offsetY = cropArea.y - imgRect.top;
    const scale = cropArea.width / imgRect.width;

    setTexts((prev) =>
      prev.map((text) => ({
        ...text,
        x: (text.x - offsetX) / scale,
        y: (text.y - offsetY) / scale,
        fontSize: text.fontSize / scale,
      }))
    );
    setShapes((prev) =>
      prev.map((shape) => ({
        ...shape,
        x: (shape.x - offsetX) / scale,
        y: (shape.y - offsetY) / scale,
        width: shape.width / scale,
        height: shape.height / scale,
      }))
    );
    setEmojis((prev) =>
      prev.map((emoji) => ({
        ...emoji,
        x: (emoji.x - offsetX) / scale,
        y: (emoji.y - offsetY) / scale,
        size: emoji.size / scale,
      }))
    );
    setPhotos((prev) =>
      prev.map((photo) => ({
        ...photo,
        x: (photo.x - offsetX) / scale,
        y: (photo.y - offsetY) / scale,
        width: photo.width / scale,
        height: photo.height / scale,
      }))
    );
  }, [cropArea, image, filters]);

  const cancelCrop = useCallback(() => {
    setIsCropping(false);
    setCropPreview(null);
    setCropArea({ x: 0, y: 0, width: 0, height: 0 });
  }, []);

  const downloadMeme = useCallback(() => {
    if (!canvasRef.current || !image) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    Promise.all([loadImage(image), ...photos.map((photo) => loadImage(photo.src))])
      .then(([backgroundImg, ...photoImages]) => {
        canvas.width = backgroundImg.naturalWidth;
        canvas.height = backgroundImg.naturalHeight;
        const displayWidth = imageRef.current.offsetWidth;
        const displayHeight = imageRef.current.offsetHeight;
        const scaleX = backgroundImg.naturalWidth / displayWidth;
        const scaleY = backgroundImg.naturalHeight / displayHeight;

        ctx.filter = `
          brightness(${filters.brightness}%)
          contrast(${filters.contrast}%)
          saturate(${filters.saturation}%)
          grayscale(${filters.grayscale}%)
          sepia(${filters.sepia}%)
          blur(${filters.blur}px)
        `;
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';

        photos.forEach((photo, index) => {
          ctx.save();
          const scaledX = photo.x * scaleX;
          const scaledY = photo.y * scaleY;
          const scaledWidth = photo.width * scaleX;
          const scaledHeight = photo.height * scaleY;
          ctx.translate(scaledX, scaledY);
          ctx.rotate((photo.rotation * Math.PI) / 180);
          ctx.globalAlpha = photo.opacity || 1;
          ctx.filter = `brightness(${photo.brightness * 100 || 100}%)`;
          ctx.drawImage(photoImages[index], -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          ctx.restore();
        });

        shapes.forEach((shape) => {
          ctx.save();
          const scaledX = shape.x * scaleX;
          const scaledY = shape.y * scaleY;
          const scaledWidth = shape.width * scaleX;
          const scaledHeight = shape.height * scaleY;
          ctx.translate(scaledX, scaledY);
          ctx.rotate((shape.rotation * Math.PI) / 180);
          ctx.fillStyle = shape.color || '#ff0000';
          if (shape.shapeType === 'rectangle') {
            ctx.fillRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          } else if (shape.shapeType === 'circle') {
            ctx.beginPath();
            ctx.ellipse(0, 0, scaledWidth / 2, scaledHeight / 2, 0, 0, Math.PI * 2);
            ctx.fill();
          } else if (shape.shapeType === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(0, -scaledHeight / 2);
            ctx.lineTo(scaledWidth / 2, scaledHeight / 2);
            ctx.lineTo(-scaledWidth / 2, scaledHeight / 2);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        });

        texts.forEach((text) => {
          ctx.save();
          const scaledX = text.x * scaleX;
          const scaledY = text.y * scaleY;
          const scaledFontSize = text.fontSize * Math.max(scaleX, scaleY);
          ctx.translate(scaledX, scaledY);
          ctx.rotate((text.rotation * Math.PI) / 180);
          let fontStyle = '';
          if (text.italic) fontStyle += 'italic ';
          if (text.bold) fontStyle += 'bold ';
          ctx.font = `${fontStyle}${scaledFontSize}px ${text.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.strokeStyle = text.stroke || '#000000';
          ctx.lineWidth = scaledFontSize / 10;
          ctx.strokeText(text.content, 0, 0);
          ctx.fillStyle = text.color || '#ffffff';
          ctx.fillText(text.content, 0, 0);
          if (text.underline) {
            const textMetrics = ctx.measureText(text.content);
            ctx.strokeStyle = text.color || '#ffffff';
            ctx.lineWidth = scaledFontSize / 20;
            ctx.beginPath();
            ctx.moveTo(-textMetrics.width / 2, scaledFontSize / 2);
            ctx.lineTo(textMetrics.width / 2, scaledFontSize / 2);
            ctx.stroke();
          }
          ctx.restore();
        });

        emojis.forEach((emoji) => {
          ctx.save();
          const scaledX = emoji.x * scaleX;
          const scaledY = emoji.y * scaleY;
          const scaledSize = emoji.size * Math.max(scaleX, scaleY);
          ctx.translate(scaledX, scaledY);
          ctx.rotate((emoji.rotation * Math.PI) / 180);
          ctx.font = `${scaledSize}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji.emoji, 0, 0);
          ctx.restore();
        });

        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'meme.png';
        link.href = dataURL;
        link.click();
      })
      .catch((error) => {
        console.error('Error loading images for download:', error);
      });
  }, [image, texts, shapes, emojis, photos, filters]);

  const handleTextBlur = useCallback(
    (id, e) => {
      const newContent = e.target.value || 'Tap to edit';
      updateText(id, { content: newContent });
      setIsEditing(false);
    },
    [updateText]
  );

  const handleTextKeyDown = useCallback(
    (id, e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const newContent = e.target.value || 'Tap to edit';
        updateText(id, { content: newContent });
        setIsEditing(false);
      }
    },
    [updateText]
  );

  const handleTextColorChange = useCallback(
    (e) => {
      const newColor = e.target.value;
      setTextColor(newColor);
    },
    []
  );

  const handleStrokeColorChange = useCallback(
    (e) => {
      const newColor = e.target.value;
      setStrokeColor(newColor);
    },
    []
  );

  const handleShapeColorChange = useCallback(
    (e) => {
      const newColor = e.target.value;
      setShapeColor(newColor);
    },
    []
  );

  const handlePhotoOpacityChange = useCallback(
    (e) => {
      const newOpacity = parseInt(e.target.value);
      setPhotoOpacity(newOpacity);
    },
    []
  );

  const handlePhotoBrightnessChange = useCallback(
    (e) => {
      const newBrightness = parseInt(e.target.value);
      setPhotoBrightness(newBrightness);
    },
    []
  );

  const handleFontFamilyChange = useCallback(
    (e) => {
      const newFont = e.target.value;
      setFontFamily(newFont);
      if (activeElement.type === 'text' && activeElement.id && selectedFeature === 'text') {
        updateText(activeElement.id, { fontFamily: newFont });
      }
    },
    [activeElement, selectedFeature, updateText]
  );

  const handleShapeTypeChange = useCallback(
    (e) => {
      const newShapeType = e.target.value;
      setSelectedShape(newShapeType);
      if (activeElement.type === 'shape' && activeElement.id && selectedFeature === 'shape') {
        updateShape(activeElement.id, { shapeType: newShapeType });
      }
    },
    [activeElement, selectedFeature, updateShape]
  );

  const handleEmojiChange = useCallback(
    (emoji) => {
      setSelectedEmoji(emoji);
      if (activeElement.type === 'emoji' && activeElement.id && selectedFeature === 'emoji') {
        updateEmoji(activeElement.id, { emoji });
      }
    },
    [activeElement, selectedFeature, updateEmoji]
  );

  const handleEmojiSizeChange = useCallback(
    (e) => {
      const newSize = parseInt(e.target.value);
      setEmojiSize(newSize);
      if (activeElement.type === 'emoji' && activeElement.id && selectedFeature === 'emoji') {
        updateEmoji(activeElement.id, { size: newSize });
      }
    },
    [activeElement, selectedFeature, updateEmoji]
  );

  const renderPhotos = useCallback(() => {
    return photos.map((photo) => (
      <div
        key={photo.id}
        className={`photo-element ${activeElement.type === 'photo' && activeElement.id === photo.id ? 'active' : ''}`}
        style={{
          position: 'absolute',
          left: `${photo.x}px`,
          top: `${photo.y}px`,
          width: `${photo.width}px`,
          height: `${photo.height}px`,
          opacity: photo.opacity || 1,
          filter: `brightness(${photo.brightness * 100 || 100}%)`,
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          transform: `translate(-50%, -50%) rotate(${photo.rotation}deg)`,
          transformOrigin: 'center center',
          touchAction: 'none',
          willChange: 'left, top, transform, opacity, filter',
          transition: dragging || isRotating ? 'none' : 'left 0.05s, top 0.05s, transform 0.05s, opacity 0.05s, filter 0.05s',
          pointerEvents: isCropping ? 'none' : 'auto',
        }}
      >
        <img
          src={photo.src}
          alt="Overlay photo"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onPointerDown={(e) => startDragging('photo', photo.id, e)}
          onTouchStart={(e) => {
            handleTouchZoom('photo', photo.id, e);
          }}
          onTouchMove={handleTouchMove}
          onPointerMove={handleDrag}
          onPointerUp={stopDragging}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => handleElementClick('photo', photo.id, e)}
          onWheel={(e) => {
            handlePhotoResize(photo.id, e);
            if (e.ctrlKey) {
              handleMouseWheelRotation(e);
            }
          }}
        />
        {activeElement.type === 'photo' && activeElement.id === photo.id && (
          <div
            className="rotation-handle"
            onPointerDown={(e) => startRotation('photo', photo.id, e)}
            onTouchStart={(e) => startRotation('photo', photo.id, e)}
            onPointerMove={handleRotation}
            onTouchMove={handleRotation}
            onPointerUp={stopRotation}
            onTouchEnd={stopRotation}
            style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '16px',
              height: '16px',
              background: '#007bff',
              borderRadius: '50%',
              cursor: 'pointer',
              boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
            }}
          />
        )}
      </div>
    ));
  }, [
    photos,
    activeElement,
    dragging,
    isRotating,
    isCropping,
    handleDrag,
    handleTouchMove,
    handleTouchEnd,
    handlePhotoResize,
    startDragging,
    stopDragging,
    startRotation,
    handleRotation,
    stopRotation,
    handleElementClick,
    handleMouseWheelRotation,
  ]);

  const renderTexts = useCallback(() => {
    return texts.map((text) => {
      const fontStyle = `${text.italic ? 'italic' : ''}`;
      const fontWeight = `${text.bold ? 'bold' : 'normal'}`;
      const textDecoration = `${text.underline ? 'underline' : 'none'}`;
      return (
        <div
          key={text.id}
          className={`text-element ${activeElement.type === 'text' && activeElement.id === text.id ? 'active' : ''}`}
          style={{
            position: 'absolute',
            left: `${text.x}px`,
            top: `${text.y}px`,
            fontFamily: text.fontFamily,
            fontSize: `${text.fontSize}px`,
            color: text.color || '#ffffff',
            fontStyle,
            fontWeight,
            textDecoration,
            WebkitTextStroke: `${text.fontSize / 40}px ${text.stroke || '#000000'}`,
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            transform: `translate(-50%, -50%) rotate(${text.rotation}deg)`,
            transformOrigin: 'center center',
            touchAction: 'none',
            willChange: 'left, top, transform',
            transition: dragging || isRotating ? 'none' : 'left 0.05s, top 0.05s, transform 0.05s',
            pointerEvents: isCropping ? 'none' : 'auto',
          }}
        >
          <div
            onPointerDown={(e) => startDragging('text', text.id, e)}
            onTouchStart={(e) => {
              startLongPress('text', text.id, e);
              handleTouchZoom('text', text.id, e);
            }}
            onTouchMove={handleTouchMove}
            onPointerMove={handleDrag}
            onPointerUp={stopDragging}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => handleElementClick('text', text.id, e)}
            onDoubleClick={(e) => handleDoubleClick('text', text.id, e)}
            onWheel={(e) => {
              handleTextZoom(text.id, e);
              if (e.ctrlKey) {
                handleMouseWheelRotation(e);
              }
            }}
          >
            {isEditing && activeElement.type === 'text' && activeElement.id === text.id ? (
              <input
                ref={textInputRef}
                type="text"
                defaultValue={text.content}
                autoFocus
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: text.fontFamily,
                  fontSize: `${text.fontSize}px`,
                  color: text.color || '#ffffff',
                  fontStyle,
                  fontWeight,
                  textDecoration,
                  textShadow: `-${text.fontSize / 40}px -${text.fontSize / 40}px 0 ${text.stroke || '#000000'},  
                               ${text.fontSize / 40}px -${text.fontSize / 40}px 0 ${text.stroke || '#000000'},
                              -${text.fontSize / 40}px ${text.fontSize / 40}px 0 ${text.stroke || '#000000'},
                               ${text.fontSize / 40}px ${text.fontSize / 40}px 0 ${text.stroke || '#000000'}`,
                  width: 'auto',
                  minWidth: '100px',
                  textAlign: 'center',
                }}
                onBlur={(e) => handleTextBlur(text.id, e)}
                onKeyDown={(e) => handleTextKeyDown(text.id, e)}
              />
            ) : (
              text.content
            )}
          </div>
          {activeElement.type === 'text' && activeElement.id === text.id && !isEditing && (
            <div
              className="rotation-handle"
              onPointerDown={(e) => startRotation('text', text.id, e)}
              onTouchStart={(e) => startRotation('text', text.id, e)}
              onPointerMove={handleRotation}
              onTouchMove={handleRotation}
              onPointerUp={stopRotation}
              onTouchEnd={stopRotation}
              style={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '16px',
                height: '16px',
                background: '#007bff',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
              }}
            />
          )}
        </div>
      );
    });
  }, [
    texts,
    activeElement,
    dragging,
    isRotating,
    isEditing,
    isCropping,
    handleDrag,
    handleTouchMove,
    handleTouchEnd,
    handleTextZoom,
    startDragging,
    stopDragging,
    startRotation,
    handleRotation,
    stopRotation,
    handleElementClick,
    handleDoubleClick,
    startLongPress,
    handleMouseWheelRotation,
    handleTextBlur,
    handleTextKeyDown,
  ]);

  const renderShapes = useCallback(() => {
    return shapes.map((shape) => {
      let shapeStyle = {};
      if (shape.shapeType === 'rectangle') {
        shapeStyle = {
          width: `${shape.width}px`,
          height: `${shape.height}px`,
          backgroundColor: shape.color || '#ff0000',
        };
      } else if (shape.shapeType === 'circle') {
        shapeStyle = {
          width: `${shape.width}px`,
          height: `${shape.height}px`,
          backgroundColor: shape.color || '#ff0000',
          borderRadius: '50%',
        };
      } else if (shape.shapeType === 'triangle') {
        shapeStyle = {
          width: `${shape.width}px`,
          height: `${shape.height}px`,
          backgroundColor: shape.color || '#ff0000',
          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
        };
      }
      return (
        <div
          key={shape.id}
          className={`shape-element ${activeElement.type === 'shape' && activeElement.id === shape.id ? 'active' : ''}`}
          style={{
            position: 'absolute',
            left: `${shape.x}px`,
            top: `${shape.y}px`,
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            transform: `translate(-50%, -50%) rotate(${shape.rotation}deg)`,
            transformOrigin: 'center center',
            touchAction: 'none',
            willChange: 'left, top, transform',
            transition: dragging || isRotating ? 'none' : 'left 0.05s, top 0.05s, transform 0.05s',
            pointerEvents: isCropping ? 'none' : 'auto',
            ...shapeStyle,
          }}
          onPointerDown={(e) => startDragging('shape', shape.id, e)}
          onTouchStart={(e) => {
            handleTouchZoom('shape', shape.id, e);
          }}
          onTouchMove={handleTouchMove}
          onPointerMove={handleDrag}
          onPointerUp={stopDragging}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => handleElementClick('shape', shape.id, e)}
          onDoubleClick={(e) => handleDoubleClick('shape', shape.id, e)}
          onWheel={(e) => {
            handleShapeResize(shape.id, e);
            if (e.ctrlKey) {
              handleMouseWheelRotation(e);
            }
          }}
        >
          {activeElement.type === 'shape' && activeElement.id === shape.id && (
            <div
              className="rotation-handle"
              onPointerDown={(e) => startRotation('shape', shape.id, e)}
              onTouchStart={(e) => startRotation('shape', shape.id, e)}
              onPointerMove={handleRotation}
              onTouchMove={handleRotation}
              onPointerUp={stopRotation}
              onTouchEnd={stopRotation}
              style={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '16px',
                height: '16px',
                background: '#007bff',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
              }}
            />
          )}
        </div>
      );
    });
  }, [
    shapes,
    activeElement,
    dragging,
    isRotating,
    isCropping,
    handleDrag,
    handleTouchMove,
    handleTouchEnd,
    handleShapeResize,
    startDragging,
    stopDragging,
    startRotation,
    handleRotation,
    stopRotation,
    handleElementClick,
    handleDoubleClick,
    handleMouseWheelRotation,
  ]);

  const renderEmojis = useCallback(() => {
    return emojis.map((emoji) => {
      return (
        <div
          key={emoji.id}
          className={`emoji-element ${activeElement.type === 'emoji' && activeElement.id === emoji.id ? 'active' : ''}`}
          style={{
            position: 'absolute',
            left: `${emoji.x}px`,
            top: `${emoji.y}px`,
            fontSize: `${emoji.size}px`,
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            transform: `translate(-50%, -50%) rotate(${emoji.rotation}deg)`,
            transformOrigin: 'center center',
            touchAction: 'none',
            willChange: 'left, top, transform',
            transition: dragging || isRotating ? 'none' : 'left 0.05s, top 0.05s, transform 0.05s',
            pointerEvents: isCropping ? 'none' : 'auto',
          }}
          onPointerDown={(e) => startDragging('emoji', emoji.id, e)}
          onTouchStart={(e) => {
            handleTouchZoom('emoji', emoji.id, e);
          }}
          onTouchMove={handleTouchMove}
          onPointerMove={handleDrag}
          onPointerUp={stopDragging}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => handleElementClick('emoji', emoji.id, e)}
          onDoubleClick={(e) => handleDoubleClick('emoji', emoji.id, e)}
          onWheel={(e) => {
            handleEmojiZoom(emoji.id, e);
            if (e.ctrlKey) {
              handleMouseWheelRotation(e);
            }
          }}
        >
          {emoji.emoji}
          {activeElement.type === 'emoji' && activeElement.id === emoji.id && (
            <div
              className="rotation-handle"
              onPointerDown={(e) => startRotation('emoji', emoji.id, e)}
              onTouchStart={(e) => startRotation('emoji', emoji.id, e)}
              onPointerMove={handleRotation}
              onTouchMove={handleRotation}
              onPointerUp={stopRotation}
              onTouchEnd={stopRotation}
              style={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '16px',
                height: '16px',
                background: '#007bff',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
              }}
            />
          )}
        </div>
      );
    });
  }, [
    emojis,
    activeElement,
    dragging,
    isRotating,
    isCropping,
    handleDrag,
    handleTouchMove,
    handleTouchEnd,
    handleEmojiZoom,
    startDragging,
    stopDragging,
    startRotation,
    handleRotation,
    stopRotation,
    handleElementClick,
    handleDoubleClick,
    handleMouseWheelRotation,
  ]);

  const renderCropBox = useCallback(() => {
    if (!isCropping) return null;
    return (
      <div
        className="crop-box"
        style={{
          position: 'absolute',
          left: `${cropArea.x}px`,
          top: `${cropArea.y}px`,
          width: `${cropArea.width}px`,
          height: `${cropArea.height}px`,
          border: '2px dashed #007bff',
          background: 'rgba(0, 123, 255, 0.2)',
          cursor: 'move',
          touchAction: 'none',
        }}
        onPointerDown={startCropDrag}
        onTouchStart={startCropDrag}
        onPointerMove={handleCropDrag}
        onTouchMove={handleCropDrag}
        onPointerUp={stopCrop}
        onTouchEnd={stopCrop}
      >
        <div className="crop-overlay" />
        <div
          className="crop-handle top-left"
          onPointerDown={(e) => startCropResize('top-left', e)}
          onTouchStart={(e) => startCropResize('top-left', e)}
          onPointerMove={handleCropResize}
          onTouchMove={handleCropResize}
          onPointerUp={stopCrop}
          onTouchEnd={stopCrop}
        />
        <div
          className="crop-handle top-right"
          onPointerDown={(e) => startCropResize('top-right', e)}
          onTouchStart={(e) => startCropResize('top-right', e)}
          onPointerMove={handleCropResize}
          onTouchMove={handleCropResize}
          onPointerUp={stopCrop}
          onTouchEnd={stopCrop}
        />
        <div
          className="crop-handle bottom-left"
          onPointerDown={(e) => startCropResize('bottom-left', e)}
          onTouchStart={(e) => startCropResize('bottom-left', e)}
          onPointerMove={handleCropResize}
          onTouchMove={handleCropResize}
          onPointerUp={stopCrop}
          onTouchEnd={stopCrop}
        />
        <div
          className="crop-handle bottom-right"
          onPointerDown={(e) => startCropResize('bottom-right', e)}
          onTouchStart={(e) => startCropResize('bottom-right', e)}
          onPointerMove={handleCropResize}
          onTouchMove={handleCropResize}
          onPointerUp={stopCrop}
          onTouchEnd={stopCrop}
        />
      </div>
    );
  }, [isCropping, cropArea, startCropDrag, handleCropDrag, stopCrop, startCropResize, handleCropResize]);

  return (
    <div className="meme-editor">
      <div className="editor-container">
        <div
          className="canvas-wrapper"
          ref={wrapperRef}
          onPointerMove={isCropping ? handleCropDrag : handleDrag}
          onPointerUp={isCropping ? stopCrop : stopDragging}
          onPointerLeave={isCropping ? stopCrop : stopDragging}
          onTouchMove={isCropping ? handleCropDrag : handleTouchMove}
          onTouchEnd={isCropping ? stopCrop : handleTouchEnd}
          onWheel={isCropping ? null : handleMouseWheelRotation}
          style={{ touchAction: 'none', position: 'relative' }}
          onClick={() => {
            if (!isCropping) {
              setIsEditing(false);
              setActiveElement({ type: null, id: null });
            }
          }}
        >
          {image ? (
            <>
              <div className="image-container" style={{ position: 'relative' }}>
                <img
                  ref={imageRef}
                  src={cropPreview || image}
                  alt="Meme background"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    display: 'block',
                    opacity: isCropping ? 0.5 : 1,
                    filter: `
                      brightness(${filters.brightness}%)
                      contrast(${filters.contrast}%)
                      saturate(${filters.saturation}%)
                      grayscale(${filters.grayscale}%)
                      sepia(${filters.sepia}%)
                      blur(${filters.blur}px)
                    `,
                  }}
                />
                {renderCropBox()}
                {renderPhotos()}
                {renderShapes()}
                {renderTexts()}
                {renderEmojis()}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
              <div className="bottom-toolbar-memes">
                <div className="primary-tools-scroll-container-memes">
                  <div className="tool-group-memes primary-tools">
                    <button
                      className={`tool-button-memes ${isCropping ? 'active' : ''}`}
                      onClick={() => {
                        setIsCropping((prev) => !prev);
                        setActiveElement({ type: null, id: null });
                        setSelectedFeature(null);
                      }}
                      data-tooltip="Crop the background image"
                    >
                      <span>Crop</span>
                    </button>
                    <button
                      className={`tool-button-memes ${selectedFeature === 'text' ? 'active' : ''}`}
                      onClick={addText}
                      data-tooltip="Add text to your meme"
                      disabled={isCropping}
                    >
                      <span>Text</span>
                    </button>
                    <button
                      className={`tool-button-memes ${selectedFeature === 'shape' ? 'active' : ''}`}
                      onClick={addShape}
                      data-tooltip="Add a shape to your meme"
                      disabled={isCropping}
                    >
                      <span>Shapes</span>
                    </button>
                    <button
                      className={`tool-button-memes ${selectedFeature === 'emoji' ? 'active' : ''}`}
                      onClick={addEmoji}
                      data-tooltip="Add an emoji to your meme"
                      disabled={isCropping}
                    >
                      <span>Emoji</span>
                    </button>
                    <button
                      className={`tool-button-memes ${selectedFeature === 'photo' ? 'active' : ''}`}
                      onClick={() => photoInputRef.current.click()}
                      data-tooltip="Add a photo to your meme"
                      disabled={isCropping}
                    >
                      <span>Photo</span>
                    </button>
                    <button
                      className={`tool-button-memes ${selectedFeature === 'filters' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedFeature('filters');
                        setActiveElement({ type: null, id: null });
                      }}
                      data-tooltip="Apply filters to the background image"
                      disabled={isCropping}
                    >
                      <span>Filters</span>
                    </button>
                    <input
                      type="file"
                      ref={photoInputRef}
                      onChange={addPhoto}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    {activeElement.id && (
                      <button
                        className="tool-button-memes"
                        onClick={deleteElement}
                        data-tooltip="Delete selected element"
                        disabled={isCropping}
                      >
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
                {isCropping && (
                  <div className="secondary-tools-scroll-container-memes">
                    <div className="tool-group-memes secondary-tools">
                      <button
                        className="tool-button-memes"
                        onClick={applyCrop}
                        data-tooltip="Apply crop"
                      >
                        <span>Apply</span>
                      </button>
                      <button
                        className="tool-button-memes"
                        onClick={cancelCrop}
                        data-tooltip="Cancel crop"
                      >
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}
                {selectedFeature && !isCropping && (
                  <div className="secondary-tools-scroll-container-memes">
                    <div className="tool-group-memes secondary-tools">
                      {selectedFeature === 'text' && (
                        <>
                          <div className="form-group-memes">
                            <label>Font</label>
                            <select
                              value={fontFamily}
                              onChange={handleFontFamilyChange}
                              className="font-select-memes"
                            >
                              <option value="Impact">Impact</option>
                              <option value="Arial">Arial</option>
                              <option value="Comic Sans MS">Comic Sans</option>
                              <option value="Courier New">Courier New</option>
                              <option value="Times New Roman">Times New Roman</option>
                            </select>
                          </div>
                          <div className="form-group-memes">
                            <label>Color</label>
                            <input
                              type="color"
                              value={textColor}
                              onChange={handleTextColorChange}
                              className="color-input-memes"
                            />
                          </div>
                          <div className="form-group-memes">
                            <label>Stroke</label>
                            <input
                              type="color"
                              value={strokeColor}
                              onChange={handleStrokeColorChange}
                              className="color-input-memes"
                            />
                          </div>
                          <div className="style-buttons-memes">
                            <button
                              className={`style-button-memes ${textStyles.bold ? 'active' : ''}`}
                              onClick={() => toggleTextStyle('bold')}
                              data-tooltip="Bold"
                            >
                              <span style={{ fontWeight: 'bold' }}>B</span>
                            </button>
                            <button
                              className={`style-button-memes ${textStyles.italic ? 'active' : ''}`}
                              onClick={() => toggleTextStyle('italic')}
                              data-tooltip="Italic"
                            >
                              <span style={{ fontStyle: 'italic' }}>I</span>
                            </button>
                            <button
                              className={`style-button-memes ${textStyles.underline ? 'active' : ''}`}
                              onClick={() => toggleTextStyle('underline')}
                              data-tooltip="Underline"
                            >
                              <span style={{ textDecoration: 'underline' }}>U</span>
                            </button>
                          </div>
                        </>
                      )}
                      {selectedFeature === 'shape' && (
                        <>
                          <div className="form-group-memes">
                            <label>Type</label>
                            <select
                              value={selectedShape}
                              onChange={handleShapeTypeChange}
                              className="font-select-memes"
                            >
                              {SHAPES.map((shape) => (
                                <option key={shape} value={shape}>
                                  {shape.charAt(0).toUpperCase() + shape.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group-memes">
                            <label>Color</label>
                            <input
                              type="color"
                              value={shapeColor}
                              onChange={handleShapeColorChange}
                              className="color-input-memes"
                            />
                          </div>
                        </>
                      )}{selectedFeature === 'emoji' && (
  <>
    <div className="form-group-memes">
      
      <div className="emoji-selector-container">
        <div className="emoji-selector">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className={`emoji-option ${selectedEmoji === emoji ? 'active' : ''}`}
              onClick={() => handleEmojiChange(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  </>
)}
                     {selectedFeature === 'photo' && (
                        <>
                          <div className="form-group-memes">
                            <label>Opacity</label>
                            <input
                              type="range"
                              min="0"
                              max="200"
                              value={photoOpacity}
                              onChange={handlePhotoOpacityChange}
                              className="size-slider"
                            />
                            <span>{photoOpacity}%</span>
                          </div>
                          <div className="form-group-memes">
                            <label>Brightness</label>
                            <input
                              type="range"
                              min="0"
                              max="200"
                              value={photoBrightness}
                              onChange={handlePhotoBrightnessChange}
                              className="size-slider"
                            />
                            <span>{photoBrightness}%</span>
                          </div>
                        </>
                      )}
                      {selectedFeature === 'filters' && (
                        <div className="filter-controls">
                          <div className="form-group-memes">
                            <label>Brightness</label>
                            <input
                              type="range"
                              min="0"
                              max="200"
                              value={filters.brightness}
                              onChange={(e) => handleFilterChange('brightness', e.target.value)}
                              className="size-slider"
                            />
                            <span>{filters.brightness}%</span>
                          </div>
                          <div className="form-group-memes">
                            <label>Contrast</label>
                            <input
                              type="range"
                              min="0"
                              max="200"
                              value={filters.contrast}
                              onChange={(e) => handleFilterChange('contrast', e.target.value)}
                              className="size-slider"
                            />
                            <span>{filters.contrast}%</span>
                          </div>
                          <div className="form-group-memes">
                            <label>Saturation</label>
                            <input
                              type="range"
                              min="0"
                              max="200"
                              value={filters.saturation}
                              onChange={(e) => handleFilterChange('saturation', e.target.value)}
                              className="size-slider"
                            />
                            <span>{filters.saturation}%</span>
                          </div>
                          <div className="form-group-memes">
                            <label>Grayscale</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={filters.grayscale}
                              onChange={(e) => handleFilterChange('grayscale', e.target.value)}
                              className="size-slider"
                            />
                            <span>{filters.grayscale}%</span>
                          </div>
                          <div className="form-group-memes">
                            <label>Sepia</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={filters.sepia}
                              onChange={(e) => handleFilterChange('sepia', e.target.value)}
                              className="size-slider"
                            />
                            <span>{filters.sepia}%</span>
                          </div>
                          <div className="form-group-memes">
                            <label>Blur</label>
                            <input
                              type="range"
                              min="0"
                              max="10"
                              value={filters.blur}
                              onChange={(e) => handleFilterChange('blur', e.target.value)}
                              className="size-slider"
                            />
                            <span>{filters.blur}px</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="download-button-container">
                  <button
                    className="download-button-memes"
                    onClick={downloadMeme}
                    data-tooltip="Download your meme"
                    disabled={isCropping}
                  >
                    <span>Download Meme</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="upload-prompt">
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button className="upload-button" onClick={() => fileInputRef.current.click()}>
               Upload your image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};