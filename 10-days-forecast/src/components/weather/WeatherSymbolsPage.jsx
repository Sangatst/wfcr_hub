import React from 'react';
import { iconDescriptions } from './icon_mapping';
import SmartSymbolIcon from './SmartSymbolIcon';

// List of all day and night icon numbers as strings
const dayIcons = [
  "1","2","4","6","7","9","11","14","17","21","24","27","31","32","33","34","35","36","37","38","39","41","42","43","44","45","46","47","48","49","51","52","53","54","55","56","57","58","59","61","64","67","71","74","77"
];
const nightIcons = [
  "101","102","104","106","107","109","111","114","117","121","124","127","131","132","133","134","135","136","137","138","139","141","142","143","144","145","146","147","148","149","151","152","153","154","155","156","157","158","159","161","164","167","171","174","177"
];

// Pair day and night icons by their base number (e.g., 1 and 101)
const getAllSymbolRows = () => {
  // Get all unique base numbers
  const baseNumbers = Array.from(new Set([
    ...dayIcons.map(n => parseInt(n, 10)),
    ...nightIcons.map(n => parseInt(n, 10) - 100)
  ])).sort((a, b) => a - b);

  return baseNumbers.map(base => {
    const day = String(base);
    const night = String(base + 100);
    return {
      day,
      night,
      dayLabel: iconDescriptions[day] || '',
      nightLabel: iconDescriptions[night] || '',
    };
  });
};

const WeatherSymbolsPage = () => {
  const rows = getAllSymbolRows();
  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Weather Signs and Symbols</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
          <thead>
            <tr style={{ background: '#f4f6fa' }}>
              <th style={{ padding: 10, textAlign: 'center' }}>light</th>
              <th style={{ padding: 10, textAlign: 'center' }}>dark</th>
              <th style={{ padding: 10, textAlign: 'left' }}>definition</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.day} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                <td style={{ textAlign: 'center', padding: 10 }}>
                  {row.dayLabel && <SmartSymbolIcon symbolNumber={row.day} size={40} />}
                </td>
                <td style={{ textAlign: 'center', padding: 10 }}>
                  {row.nightLabel && <SmartSymbolIcon symbolNumber={row.night} size={40} />}
                </td>
                <td style={{ padding: 10, fontWeight: 500 }}>
                  {row.dayLabel || row.nightLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeatherSymbolsPage; 