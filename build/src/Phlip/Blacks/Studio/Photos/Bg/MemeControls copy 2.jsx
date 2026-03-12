import React, { useRef } from 'react';
import { MemeFilterControls } from './MemeFilterControls';
import './Memes.css';

const SHAPES = [
  'rectangle', 'square', 'circle', 'oval', 'triangle', 'pentagon', 'hexagon', 'heptagon', 'octagon',
  'trapezoid', 'parallelogram', 'diamond', 'crescent', 'lightning', 'cross', 'heart',
  'line', 'line-arrow', 'line-double-arrow', 'callout-circle-arrow', 'callout-rectangle', 'callout-rounded-rectangle'
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

export const MemeControls = ({
  addText,
  addShape,
  addPhoto,
  addEmoji,
  deleteElement,
  handleFilterChange,
  selectedFeature,
  setSelectedFeature,
  activeElement,
  fontFamily,
  handleFontFamilyChange,
  textColor,
  handleTextColorChange,
  strokeColor,
  handleStrokeColorChange,
  textStyles,
  toggleTextStyle,
  selectedShape,
  handleShapeTypeChange,
  shapeFillColor,
  handleShapeFillColorChange,
  shapeOutlineColor,
  handleShapeOutlineColorChange,
  shapeOutlineWidth,
  handleShapeOutlineWidthChange,
  selectedEmoji,
  handleEmojiChange,
  photoOpacity,
  handlePhotoOpacityChange,
  photoBrightness,
  handlePhotoBrightnessChange,
  downloadMeme,
  filters,
  updateShapeProperties,
}) => {
  const photoInputRef = useRef(null);

  return (
    <div className="bottom-toolbar-memes">
      <div className="primary-tools-scroll-container-memes">
        <div className="tool-group-memes primary-tools">
          <button
            className={`tool-button-memes ${selectedFeature === 'text' ? 'active' : ''}`}
            onClick={addText}
            data-tooltip="Add text to your meme"
            disabled={false}
            aria-label="Add text"
          >
            <span>Text</span>
          </button>
          <button
            className={`tool-button-memes ${selectedFeature === 'shape' ? 'active' : ''}`}
            onClick={() =>
              addShape({
                shapeType: selectedShape,
                fillColor: shapeFillColor,
                outlineColor: shapeOutlineColor,
                outlineWidth: shapeOutlineWidth,
              })
            }
            data-tooltip="Add a shape to your meme"
            disabled={false}
            aria-label="Add shape"
          >
            <span>Shapes</span>
          </button>
          <button
            className={`tool-button-memes ${selectedFeature === 'emoji' ? 'active' : ''}`}
            onClick={addEmoji}
            data-tooltip="Add an emoji to your meme"
            disabled={false}
            aria-label="Add emoji"
          >
            <span>Emoji</span>
          </button>
          <button
            className={`tool-button-memes ${selectedFeature === 'photo' ? 'active' : ''}`}
            onClick={() => photoInputRef.current.click()}
            data-tooltip="Add a photo to your meme"
            disabled={false}
            aria-label="Add photo"
          >
            <span>Photo</span>
          </button>
          <button
            className={`tool-button-memes ${selectedFeature === 'filters' ? 'active' : ''}`}
            onClick={() => setSelectedFeature('filters')}
            data-tooltip="Apply filters to the background image"
            disabled={false}
            aria-label="Apply filters"
          >
            <span>Filters</span>
          </button>
          <input
            type="file"
            ref={photoInputRef}
            onChange={addPhoto}
            accept="image/*"
            style={{ display: 'none' }}
            aria-label="Upload photo"
          />
          {activeElement.id && (
            <button
              className="tool-button-memes"
              onClick={deleteElement}
              data-tooltip="Delete selected element"
              disabled={false}
              aria-label="Delete element"
            >
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
      {selectedFeature && selectedFeature !== 'filters' && (
        <div className="secondary-tools-scroll-container-memes">
          <div className="tool-group-memes secondary-tools">
            {selectedFeature === 'text' && (
              <>
                <div className="form-group-memes">
                  <label>Font</label>
                  <select value={fontFamily} onChange={handleFontFamilyChange} className="font-select-memes" aria-label="Select font">
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
                    aria-label="Select text color"
                  />
                </div>
                <div className="form-group-memes">
                  <label>Stroke</label>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={handleStrokeColorChange}
                    className="color-input-memes"
                    aria-label="Select stroke color"
                  />
                </div>
                <div className="style-buttons-memes">
                  <button
                    className={`style-button-memes ${textStyles.bold ? 'active' : ''}`}
                    onClick={() => toggleTextStyle('bold')}
                    data-tooltip="Bold"
                    aria-label="Toggle bold text"
                  >
                    <span style={{ fontWeight: 'bold' }}>B</span>
                  </button>
                  <button
                    className={`style-button-memes ${textStyles.italic ? 'active' : ''}`}
                    onClick={() => toggleTextStyle('italic')}
                    data-tooltip="Italic"
                    aria-label="Toggle italic text"
                  >
                    <span style={{ fontStyle: 'italic' }}>I</span>
                  </button>
                  <button
                    className={`style-button-memes ${textStyles.underline ? 'active' : ''}`}
                    onClick={() => toggleTextStyle('underline')}
                    data-tooltip="Underline"
                    aria-label="Toggle underline text"
                  >
                    <span style={{ textDecoration: 'underline' }}>U</span>
                  </button>
                </div>
              </>
            )}
            {selectedFeature === 'shape' && (
  <>
    <div className="shape-selector-container">
      <div className="shape-selector">
        {SHAPES.map((shape) => (
          <button
            key={shape}
            className={`shape-option ${selectedShape === shape ? 'active' : ''}`}
            onClick={() => handleShapeTypeChange({ target: { value: shape } })}
          >
            {shape.charAt(0).toUpperCase() + shape.slice(1)}
          </button>
        ))}
      </div>
    </div>
    <div className="form-group-memes">
  
     
    </div>
  </>
)}
            {selectedFeature === 'emoji' && (
              <div className="emoji-selector-container">
                <div className="emoji-selector">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      className={`emoji-option ${selectedEmoji === emoji ? 'active' : ''}`}
                      onClick={() => handleEmojiChange(emoji)}
                      aria-label={`Select ${emoji} emoji`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedFeature === 'photo' && (
              <>
                <div className="form-group-memes">
                  <label>Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={photoOpacity}
                    onChange={handlePhotoOpacityChange}
                    className="size-slider"
                    aria-label="Adjust photo opacity"
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
                    aria-label="Adjust photo brightness"
                  />
                  <span>{photoBrightness}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <MemeFilterControls
        filters={filters}
        handleFilterChange={handleFilterChange}
        selectedFeature={selectedFeature}
      />
      <div className="download-button-container">
        <button
          className="download-button-memes"
          onClick={downloadMeme}
          data-tooltip="Download your meme"
          disabled={false}
          aria-label="Download meme"
        >
          <span>Download</span>
        </button>
      </div>
    </div>
  );
};