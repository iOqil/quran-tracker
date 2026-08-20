import React from 'react';

interface FaollikHeatmapProps {
  activities: Record<string, number>;
}

export const FaollikHeatmap: React.FC<FaollikHeatmapProps> = ({ activities }) => {
  const dates: { dateStr: string; count: number; dayOfWeek: number }[] = [];
  const today = new Date();
  
  const startDay = new Date();
  startDay.setDate(today.getDate() - 364);
  
  const dayOfWeek = startDay.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startDay.setDate(startDay.getDate() - diffToMonday);

  for (let i = 0; i < 371; i++) {
    const d = new Date(startDay);
    d.setDate(startDay.getDate() + i);
    
    const tzOffset = d.getTimezoneOffset() * 60000;
    const dateStr = new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
    const count = activities[dateStr] || 0;
    
    dates.push({
      dateStr,
      count,
      dayOfWeek: d.getDay()
    });
  }

  const rows: typeof dates[] = Array.from({ length: 7 }, () => []);
  
  dates.forEach((item) => {
    const rowIndex = item.dayOfWeek === 0 ? 6 : item.dayOfWeek - 1;
    rows[rowIndex].push(item);
  });

  return (
    <div className="heatmap-wrapper" style={{ marginBottom: '24px' }}>
      <div className="heatmap-header">
        <span className="heatmap-title">📊 Kunlik Faollik Kalendari</span>
        <div className="heatmap-legend">
          <span>Kam</span>
          <div className="legend-cell level-0"></div>
          <div className="legend-cell level-1"></div>
          <div className="legend-cell level-2"></div>
          <div className="legend-cell level-3"></div>
          <div className="legend-cell level-4"></div>
          <span>Ko'p</span>
        </div>
      </div>
      
      <div className="heatmap-scroll-container">
        <div className="heatmap-grid">
          <div className="heatmap-labels">
            <span>Du</span>
            <span>Ch</span>
            <span>Ju</span>
            <span>Ya</span>
          </div>
          
          <div className="heatmap-days-container">
            {rows.map((row, rIndex) => (
              <div key={rIndex} className="heatmap-row">
                {row.map((day) => {
                  let level = 'level-0';
                  if (day.count > 0 && day.count <= 2) level = 'level-1';
                  else if (day.count > 2 && day.count <= 4) level = 'level-2';
                  else if (day.count > 4 && day.count <= 7) level = 'level-3';
                  else if (day.count > 7) level = 'level-4';

                  const formattedDate = new Date(day.dateStr).toLocaleDateString('uz-UZ', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  });

                  return (
                    <div
                      key={day.dateStr}
                      className={`heatmap-cell ${level}`}
                      title={`${formattedDate}: ${day.count} ta harakat`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
