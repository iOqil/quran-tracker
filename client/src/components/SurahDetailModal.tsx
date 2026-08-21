import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Check, Play, Pause, Volume2, Repeat } from 'lucide-react';
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
  
  // Repeat feature states
  const [repeatCount, setRepeatCount] = useState<number>(1);
  const [currentRepeat, setCurrentRepeat] = useState<number>(1);
  
  // Verse Text state (Arabic + Translation)
  const [verseData, setVerseData] = useState<{arabic: string, translation: string}[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const verseRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    // Fetch Arabic text and Uzbek Translation concurrently
    Promise.all([
      fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${selectedSurah.number}`).then(res => res.json()),
      fetch(`https://api.quran.com/api/v4/quran/translations/55?chapter_number=${selectedSurah.number}`).then(res => res.json())
    ])
      .then(([arabicRes, transRes]) => {
        if (arabicRes?.verses && transRes?.translations) {
          const combined = arabicRes.verses.map((v: any, idx: number) => ({
            arabic: v.text_uthmani,
            translation: transRes.translations[idx]?.text?.replace(/<[^>]+>/g, '') || ''
          }));
          setVerseData(combined);
        }
      })
      .catch(err => console.error("Error fetching verse data:", err));
  }, [selectedSurah.number]);

  const handleReciterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setReciterId(val);
    localStorage.setItem('quranReciterId', val);
    
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

  // Play audio when playingVerse changes
  useEffect(() => {
    if (playingVerse !== null && audioRef.current) {
      audioRef.current.src = getAudioUrl(playingVerse);
      audioRef.current.play().catch(e => {
        console.error("Audio play failed:", e);
        setIsPlaying(false);
      });
      setIsPlaying(true);
      
      const verseEl = verseRefs.current[playingVerse];
      if (verseEl) {
        verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [playingVerse, reciterId]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (playingVerse === null) {
        setPlayingVerse(1);
        setCurrentRepeat(1);
      } else {
        audioRef.current?.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const handleAudioEnded = () => {
    if (playingVerse !== null) {
      if (currentRepeat < repeatCount) {
        // Repeat the exact same verse
        setCurrentRepeat(prev => prev + 1);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(console.error);
        }
      } else {
        // Move to the next verse
        setCurrentRepeat(1); // Reset for next verse
        if (playingVerse < selectedSurah.verseCount) {
          setPlayingVerse(playingVerse + 1);
        } else {
          setIsPlaying(false);
          setPlayingVerse(null);
        }
      }
    }
  };

  const playSpecificVerse = (verseNo: number) => {
    setPlayingVerse(verseNo);
    setCurrentRepeat(1); // reset repeat when manually clicked
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

        <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Volume2 size={14} color="var(--primary)" /> Oyatma-oyat Tilovat
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
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
          </div>
          
          <div className="custom-audio-player">
            <button className="play-pause-btn" onClick={togglePlay} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--primary-light)', boxShadow: '0 4px 12px rgba(229, 115, 153, 0.15)' }}>
              {isPlaying ? <Pause size={20} color="var(--primary)" fill="var(--primary)" /> : <Play size={20} color="var(--primary)" fill="var(--primary)" style={{ marginLeft: '3px' }} />}
            </button>
            <div className="audio-progress-info">
              <span className="audio-status-text">
                {playingVerse ? `${selectedSurah.name} ${playingVerse}-oyat` : 'Tinglashga tayyor'}
              </span>
              <span className="audio-subtitle">
                {isPlaying ? (repeatCount > 1 ? `O'qilmoqda... (${currentRepeat}/${repeatCount})` : "O'qilmoqda...") : (playingVerse ? "To'xtatilgan" : "Boshlash uchun bosing")}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Repeat size={14} color="var(--text-muted)" />
              <select 
                value={repeatCount} 
                onChange={(e) => setRepeatCount(Number(e.target.value))}
                className="reciter-select"
                style={{ padding: '4px 6px' }}
              >
                {[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n}x</option>)}
              </select>
            </div>
          </div>
          
          <audio 
            ref={audioRef}
            onEnded={handleAudioEnded}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            style={{ display: 'none' }} 
          />
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
          <div className="verses-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: selectedSurah.verseCount }, (_, i) => {
              const verseNo = i + 1;
              const isChecked = selectedSurah.memorizedVerses.includes(verseNo);
              const isPlayingNow = playingVerse === verseNo;
              
              return (
                <div
                  key={verseNo}
                  ref={(el) => { verseRefs.current[verseNo] = el; }}
                  className={`verse-checkbox-card ${isChecked ? 'checked' : ''} ${isPlayingNow ? 'playing' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
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
                          if (isPlayingNow && !isPlaying) {
                            togglePlay(); // Resume
                          } else if (isPlayingNow && isPlaying) {
                            togglePlay(); // Pause
                          } else {
                            playSpecificVerse(verseNo); // Play new verse
                          }
                        }}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: isPlayingNow ? 'var(--primary)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isPlayingNow && isPlaying ? <Pause size={18} /> : <Play size={18} />}
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
                  
                  {/* Arabic Text & Translation Section */}
                  {verseData[i] && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', paddingBottom: '4px' }}>
                      <div style={{ 
                        fontSize: '24px', 
                        textAlign: 'right', 
                        fontFamily: '"Amiri", "Times New Roman", serif',
                        color: 'var(--text-color)',
                        lineHeight: '1.9',
                        direction: 'rtl'
                      }}>
                        {verseData[i].arabic}
                      </div>
                      <div style={{
                        fontSize: '13.5px',
                        color: 'var(--text-muted)',
                        lineHeight: '1.6',
                        textAlign: 'left'
                      }}>
                        {verseData[i].translation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
