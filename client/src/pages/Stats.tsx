import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Award, TrendingUp, Calendar } from 'lucide-react';
import type { Stats as StatsType, UserSession } from '../types';

interface StatsContextType {
  currentUser: UserSession;
  stats: StatsType | null;
}

export const Stats: React.FC = () => {
  const { currentUser, stats } = useOutletContext<StatsContextType>();

  return (
    <div className="content-scroll-container padding-20" style={{ padding: '20px' }}>
      <div className="stats-tab-grid">
        <div className="achievement-card">
          <Award className="achievement-badge-icon" />
          <h3 className="achievement-mashallah">Mashallah!</h3>
          <p className="achievement-msg">
            Siz hozirgacha <strong>{stats?.memorizedSurahs || 0} ta sura</strong> va <strong>{stats?.memorizedVerses || 0} ta oyat</strong> yodladingiz. Alloh hifzu himoyasida saqlasin!
          </p>
        </div>

        <div className="stats-side-widgets">
          <div className="streak-card">
            <div className="streak-icon">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="streak-label">Kunlik maqsad</span>
              <p className="streak-value">{currentUser.dailyTarget}</p>
            </div>
          </div>
          <div className="streak-card">
            <div className="streak-icon">
              <Calendar size={20} />
            </div>
            <div>
              <span className="streak-label">Ketma-ketlik</span>
              <p className="streak-value">7 kun yodlandi</p>
            </div>
          </div>

          <div className="motivation-quote-card">
            "Albatta, Qur'on oson yodlanish xususiyatiga ega. Kim xohlasa, Alloh unga o'qishni va yodlashni oson qiladi."
            <span className="motivation-author">(Buxoriy)</span>
          </div>
        </div>
      </div>

      <h3 className="surah-section-title" style={{ margin: '24px 0 12px 0' }}>Juzlar Progressi (1-30)</h3>
      <div className="juz-progress-grid-desktop">
        {stats?.juzs.map((juz) => {
          const p = (juz.memorizedVerses / (juz.totalVerses || 1)) * 100;
          return (
            <div key={juz.juzNumber} className="juz-progress-box">
              <div className="juz-progress-header">
                <span className="juz-number-title">{juz.juzNumber}-juz</span>
                <span className="juz-progress-ratio">{juz.memorizedVerses} / {juz.totalVerses} oyat ({p.toFixed(0)}%)</span>
              </div>
              <div className="juz-progress-track">
                <div className="juz-progress-fill" style={{ width: `${p}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default Stats;
