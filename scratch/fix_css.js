const fs = require('fs');
let css = fs.readFileSync('client/src/index.css', 'utf8');

const missingMobileCss = `
  .desktop-only {
    display: none !important;
  }
  .main-header {
    padding: 12px 16px !important;
  }
  .main-header-title {
    font-size: 19px !important;
    line-height: 1.2;
    white-space: nowrap;
  }
  .main-header-actions {
    gap: 4px !important;
  }
  .admin-toggle-pill {
    padding: 8px !important; 
  }
}
`;

const audioCss = `
/* Custom Audio Player */
.custom-audio-player {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-app);
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  margin-top: 8px;
  margin-bottom: 4px;
}

.play-pause-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;
}

.play-pause-btn:active {
  transform: scale(0.95);
}

.audio-progress-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.audio-status-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

.audio-subtitle {
  font-size: 11px;
  color: var(--text-muted);
}

.reciter-select {
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-color);
  outline: none;
  cursor: pointer;
}

.verse-checkbox-card.playing {
  border-color: var(--primary-color);
  background-color: rgba(255, 107, 107, 0.05);
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2);
  transform: scale(1.02);
  z-index: 10;
}
`;

fs.writeFileSync('client/src/index.css', css + missingMobileCss + audioCss, 'utf8');
console.log('Fixed CSS');
