import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Check, Play, Pause, Volume2 } from 'lucide-react';
import type { SurahDetail } from '../types';

interface SurahDetailModalProps {
  selectedSurah: SurahDetail;
  onClose: () => void;
  handleToggleBulk: (isMemorized: boolean) => void;
  handleToggleVerse: (verseNo: number, isMemorized: boolean) => void;
}

const RECITERS = [
  { id: 'Alafasy_128kbps', name: 'Mishary Rashid Alafasy', server: 'https://everyayah.com/data/Alafasy_128kbps' },
  { id: 'Ghamadi_40kbps', name: 'Saad Al-Ghamdi', server: 'https://everyayah.com/data/Ghamadi_40kbps' },
  { id: 'Abdurrahmaan_As-Sudais_192kbps', name: 'Abdur-Rahman as-Sudais', server: 'https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps' },
  { id: 'AbdulSamad_64kbps_QuranExplorer.Com', name: 'AbdulBaset AbdulSamad', server: 'https://everyayah.com/data/AbdulSamad_64kbps_QuranExplorer.Com' },
];

export const SurahDetailModal: React.FC<SurahDetailModalProps> = ({
  selectedSurah,
  onClose,
  handleToggleBulk,
  handleToggleVerse
}) => {
  const [reciterId, setReciterId] = useState(() => {
    return localStorage.getItem('quranReciterId') || 'Alafasy_128kbps';
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Create refs for verse elements to auto-scroll
  const verseRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const handleReciterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setReciterId(val);
    localStorage.setItem('quranReciterId', val);
    
    // Stop playing if reciter changes to avoid glitching
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const selectedServer = RECITERS.find(r => r.id === reciterId)?.server || RECITERS[0].server;
  const formatNumber = (num: number) => num.toString().padStart(3, '0');
  
  const getAudioUrl = (verseNo: number) => {
    return `${selectedServer}/${formatNumber(selectedSurah.number)}${formatNumber(verseNo)}.mp3`;
  };

  useEffect(() => {
    if (playingVerse !== null && audioRef.current) {
      audioRef.current.src = getAudioUrl(playingVerse);
      audioRef.current.play().catch(e => {
        console.error("Audio play failed:", e);
        setIsPlaying(false);
      });
      setIsPlaying(true);
      
      // Auto scroll to active verse
      const verseEl = verseRefs.current[playingVerse];
      if (verseEl) {
        verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [playingVerse]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (playingVerse === null) {
        setPlayingVerse(1);
      } else {
        audioRef.current?.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const handleAudioEnded = () => {
    if (playingVerse !== null && playingVerse < selectedSurah.verseCount) {
      setPlayingVerse(playingVerse + 1);
    } else {
      setIsPlaying(false);
      setPlayingVerse(null);
    }
  };

  const playSpecificVerse = (verseNo: number) => {
    setPlayingVerse(verseNo);
  };

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

        {/* Custom Audio Player Section */}
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Volume2 size={14} color="var(--primary-color)" /> Oyatma-oyat Tilovat
            </span>
            <select 
              value={reciterId} 
              onChange={handleReciterChange}
              className="reciter-select"
            >
              {RECITERS.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          
          <div className="custom-audio-player">
            <button className="play-pause-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" style={{ marginLeft: '2px' }} />}
            </button>
            <div className="audio-progress-info">
              <span className="audio-status-text">
                {playingVerse ? `${selectedSurah.name} ${playingVerse}-oyat` : 'Tinglashga tayyor'}
              </span>
              <span className="audio-subtitle">
                {isPlaying ? "O'qilmoqda..." : (playingVerse ? "To'xtatilgan" : "Boshlash uchun bosing")}
              </span>
            </div>
          </div>
          
          <audio 
            ref={audioRef}
            onEnded={handleAudioEnded}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            style={{ display: 'none' }} 
          />
          <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
            Manba: everyayah.com (Sinxron o'qish imkoniyati)
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
              const isPlayingNow = playingVerse === verseNo;
              
              return (
                <div
                  key={verseNo}
                  ref={(el) => { verseRefs.current[verseNo] = el; }}
                  className={`verse-checkbox-card ${isChecked ? 'checked' : ''} ${isPlayingNow ? 'playing' : ''}`}
                >
                  <div 
                    className="verse-label" 
                    onClick={() => handleToggleVerse(verseNo, !isChecked)}
                    style={{ flex: 1, cursor: 'pointer' }}
                  >
                    <span className="verse-title">{selectedSurah.name} {verseNo}</span>
                    <span className="verse-juz-tag">{selectedSurah.juz}-juz</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPlayingNow && isPlaying) {
                          togglePlay();
                        } else {
                          playSpecificVerse(verseNo);
                        }
                      }}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: isPlayingNow ? 'var(--primary-color)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isPlayingNow && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    
                    <div 
                      className="verse-checkbox-circle" 
                      onClick={() => handleToggleVerse(verseNo, !isChecked)}
                      style={{ cursor: 'pointer' }}
                    >
                      {isChecked && (
                        <Check className="verse-check-mark" strokeWidth={3} />
                      )}
                    </div>
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
