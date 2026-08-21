import React, { useState } from 'react';
import { ChevronLeft, Check, Volume2 } from 'lucide-react';
import type { SurahDetail } from '../types';

interface SurahDetailModalProps {
  selectedSurah: SurahDetail;
  onClose: () => void;
  handleToggleBulk: (isMemorized: boolean) => void;
  handleToggleVerse: (verseNo: number, isMemorized: boolean) => void;
}

const RECITERS = [
  { id: 'afs', name: 'Mishary Rashid Alafasy', server: 'https://server8.mp3quran.net/afs' },
  { id: 's_gmd', name: 'Saad Al-Ghamdi', server: 'https://server7.mp3quran.net/s_gmd' },
  { id: 'sds', name: 'Abdur-Rahman as-Sudais', server: 'https://server11.mp3quran.net/sds' },
  { id: 'basit', name: 'AbdulBaset AbdulSamad', server: 'https://server7.mp3quran.net/basit' },
];

export const SurahDetailModal: React.FC<SurahDetailModalProps> = ({
  selectedSurah,
  onClose,
  handleToggleBulk,
  handleToggleVerse
}) => {
  const [reciterId, setReciterId] = useState(() => {
    return localStorage.getItem('quranReciter') || 'afs';
  });

  const handleReciterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setReciterId(val);
    localStorage.setItem('quranReciter', val);
  };

  const selectedServer = RECITERS.find(r => r.id === reciterId)?.server || RECITERS[0].server;
  const formatSurahNumber = (num: number) => num.toString().padStart(3, '0');
  const audioUrl = `${selectedServer}/${formatSurahNumber(selectedSurah.number)}.mp3`;

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

        {/* Audio Player Section */}
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Volume2 size={14} color="var(--primary-color)" /> Audio Tilovat
            </span>
            <select 
              value={reciterId} 
              onChange={handleReciterChange}
              style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-color)' }}
            >
              {RECITERS.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <audio controls src={audioUrl} style={{ width: '100%', height: '36px', outline: 'none' }} preload="none" />
          <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'right' }}>
            Manba: mp3quran.net (Ochiq xalqaro audio baza)
          </p>
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
              Tozalash
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
