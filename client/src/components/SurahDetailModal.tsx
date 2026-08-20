import React from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import type { SurahDetail } from '../types';

interface SurahDetailModalProps {
  selectedSurah: SurahDetail;
  onClose: () => void;
  handleToggleBulk: (isMemorized: boolean) => void;
  handleToggleVerse: (verseNo: number, isMemorized: boolean) => void;
}

export const SurahDetailModal: React.FC<SurahDetailModalProps> = ({
  selectedSurah,
  onClose,
  handleToggleBulk,
  handleToggleVerse
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <span className="modal-title">{selectedSurah.name}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {selectedSurah.number}-sura ({selectedSurah.juz}-juz)
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="modal-actions">
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Yodlangan: {selectedSurah.memorizedVerses.length} / {selectedSurah.verseCount} oyat
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="modal-actions-btn"
              onClick={() => handleToggleBulk(true)}
            >
              Hammasini yodladim
            </button>
            <button
              className="modal-actions-btn"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}
              onClick={() => handleToggleBulk(false)}
            >
              Hammasini tozalash
            </button>
          </div>
        </div>

        <div className="verses-scroll-area">
          <div className="verses-grid">
            {Array.from({ length: selectedSurah.verseCount }, (_, i) => {
              const verseNo = i + 1;
              const isChecked = selectedSurah.memorizedVerses.includes(verseNo);
              return (
                <div
                  key={verseNo}
                  className={`verse-checkbox-card ${isChecked ? 'checked' : ''}`}
                  onClick={() => handleToggleVerse(verseNo, !isChecked)}
                >
                  <div className="verse-label">
                    <span className="verse-title">{selectedSurah.name} {verseNo}</span>
                    <span className="verse-juz-tag">{selectedSurah.juz}-juz</span>
                  </div>
                  <div className="verse-checkbox-circle">
                    {isChecked && (
                      <Check className="verse-check-mark" strokeWidth={3} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
