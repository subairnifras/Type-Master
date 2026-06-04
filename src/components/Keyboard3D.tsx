'use client';

import React from 'react';
import './Keyboard3D.css';

interface Keyboard3DProps {
  pressedKeys: Set<string>;
  targetKey: string | null;
  isIncorrect: boolean;
}

interface KeyConfig {
  label: string;
  subLabel?: string;
  widthClass?: string;
  // Matching values for e.key (lowercase)
  matchKeys: string[];
}

export default function Keyboard3D({ pressedKeys, targetKey, isIncorrect }: Keyboard3DProps) {
  // Normalize target key for matching
  const normalizedTarget = targetKey ? targetKey.toLowerCase() : null;

  // Define keyboard rows
  const rows: KeyConfig[][] = [
    // Row 1
    [
      { label: 'Esc', widthClass: 'key-w-1-25', matchKeys: ['escape'] },
      { label: '1', subLabel: '!', matchKeys: ['1', '!'] },
      { label: '2', subLabel: '@', matchKeys: ['2', '@'] },
      { label: '3', subLabel: '#', matchKeys: ['3', '#'] },
      { label: '4', subLabel: '$', matchKeys: ['4', '$'] },
      { label: '5', subLabel: '%', matchKeys: ['5', '%'] },
      { label: '6', subLabel: '^', matchKeys: ['6', '^'] },
      { label: '7', subLabel: '&', matchKeys: ['7', '&'] },
      { label: '8', subLabel: '*', matchKeys: ['8', '*'] },
      { label: '9', subLabel: '(', matchKeys: ['9', '('] },
      { label: '0', subLabel: ')', matchKeys: ['0', ')'] },
      { label: '-', subLabel: '_', matchKeys: ['-', '_'] },
      { label: '=', subLabel: '+', matchKeys: ['=', '+'] },
      { label: 'Back', widthClass: 'key-w-2', matchKeys: ['backspace'] }
    ],
    // Row 2
    [
      { label: 'Tab', widthClass: 'key-w-1-5', matchKeys: ['tab'] },
      { label: 'Q', matchKeys: ['q'] },
      { label: 'W', matchKeys: ['w'] },
      { label: 'E', matchKeys: ['e'] },
      { label: 'R', matchKeys: ['r'] },
      { label: 'T', matchKeys: ['t'] },
      { label: 'Y', matchKeys: ['y'] },
      { label: 'U', matchKeys: ['u'] },
      { label: 'I', matchKeys: ['i'] },
      { label: 'O', matchKeys: ['o'] },
      { label: 'P', matchKeys: ['p'] },
      { label: '[', subLabel: '{', matchKeys: ['[', '{'] },
      { label: ']', subLabel: '}', matchKeys: [']', '}'] },
      { label: '\\', subLabel: '|', widthClass: 'key-w-1-5', matchKeys: ['\\', '|'] }
    ],
    // Row 3
    [
      { label: 'Caps', widthClass: 'key-w-1-75', matchKeys: ['capslock'] },
      { label: 'A', matchKeys: ['a'] },
      { label: 'S', matchKeys: ['s'] },
      { label: 'D', matchKeys: ['d'] },
      { label: 'F', matchKeys: ['f'] },
      { label: 'G', matchKeys: ['g'] },
      { label: 'H', matchKeys: ['h'] },
      { label: 'J', matchKeys: ['j'] },
      { label: 'K', matchKeys: ['k'] },
      { label: 'L', matchKeys: ['l'] },
      { label: ';', subLabel: ':', matchKeys: [';', ':'] },
      { label: "'", subLabel: '"', matchKeys: ["'", '"'] },
      { label: 'Enter', widthClass: 'key-w-2-25', matchKeys: ['enter'] }
    ],
    // Row 4
    [
      { label: 'Shift', widthClass: 'key-w-2-25', matchKeys: ['shift'] },
      { label: 'Z', matchKeys: ['z'] },
      { label: 'X', matchKeys: ['x'] },
      { label: 'C', matchKeys: ['c'] },
      { label: 'V', matchKeys: ['v'] },
      { label: 'B', matchKeys: ['b'] },
      { label: 'N', matchKeys: ['n'] },
      { label: 'M', matchKeys: ['m'] },
      { label: ',', subLabel: '<', matchKeys: [',', '<'] },
      { label: '.', subLabel: '>', matchKeys: ['.', '>'] },
      { label: '/', subLabel: '?', matchKeys: ['/', '?'] },
      { label: 'Shift', widthClass: 'key-w-2-75', matchKeys: ['shift'] }
    ],
    // Row 5
    [
      { label: 'Ctrl', widthClass: 'key-w-1-5', matchKeys: ['control'] },
      { label: 'Win', widthClass: 'key-w-1-25', matchKeys: ['meta'] },
      { label: 'Alt', widthClass: 'key-w-1-25', matchKeys: ['alt'] },
      { label: 'Space', widthClass: 'key-w-space', matchKeys: [' '] },
      { label: 'Alt', widthClass: 'key-w-1-25', matchKeys: ['alt'] },
      { label: 'Win', widthClass: 'key-w-1-25', matchKeys: ['meta'] },
      { label: 'Ctrl', widthClass: 'key-w-1-5', matchKeys: ['control'] }
    ]
  ];

  // Check if a key is currently pressed
  const isKeyPressed = (keyConfig: KeyConfig) => {
    return keyConfig.matchKeys.some(mk => pressedKeys.has(mk));
  };

  // Check if a key is the target next key
  const isKeyTarget = (keyConfig: KeyConfig) => {
    if (!normalizedTarget) return false;
    
    // Custom matchers
    if (normalizedTarget === ' ' && keyConfig.matchKeys.includes(' ')) return true;
    if (normalizedTarget === 'enter' && keyConfig.matchKeys.includes('enter')) return true;
    
    return keyConfig.matchKeys.some(mk => mk === normalizedTarget);
  };

  return (
    <div className="keyboard-perspective">
      <div className="keyboard-board">
        {rows.map((row, rIdx) => (
          <div className="keyboard-row" key={rIdx}>
            {row.map((key, kIdx) => {
              const pressed = isKeyPressed(key);
              const target = isKeyTarget(key);
              const incorrect = pressed && isIncorrect;

              let statusClass = '';
              if (incorrect) {
                statusClass = 'incorrect';
              } else if (pressed) {
                statusClass = 'active';
              } else if (target) {
                statusClass = 'target';
              }

              return (
                <div 
                  className={`key-3d-wrapper ${key.widthClass || ''} ${statusClass}`}
                  key={kIdx}
                >
                  <div className="key-3d">
                    <span className="key-label">{key.label}</span>
                    {key.subLabel && <span className="key-sublabel">{key.subLabel}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
