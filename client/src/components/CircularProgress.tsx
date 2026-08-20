import React from 'react';

interface CircularProgressProps {
  percentage: number;
  value: number | string;
  total: number | string;
  label: string;
  color?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  value,
  total,
  label,
  color = '#E57399'
}) => {
  const radius = 28;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="stat-circle-box">
      <div className="circle-svg-wrapper">
        <svg width="70" height="70" viewBox="0 0 70 70" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="35"
            cy="35"
            r={radius}
            fill="transparent"
            stroke="#F3E5E9"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="35"
            cy="35"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div className="circle-label">
          <span className="circle-val">{value}</span>
          <span className="circle-desc">{label}</span>
        </div>
      </div>
      <div className="stat-title">
        {percentage.toFixed(0)}%
      </div>
      <div className="stat-subtitle">
        Jami: {total}
      </div>
    </div>
  );
};
