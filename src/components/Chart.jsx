// ─── ChartSection.jsx ─────────────────────────────────────────────────────────
// Displays one bar chart at a time. User clicks tabs to toggle which
// aspect of the data is visualized: Museum, Medium, Culture, or Time Period.
//
// RECHARTS BASICS:
// Recharts works by composing chart pieces as JSX components.
// <BarChart data={array}> takes an array of objects like [{name: "India", count: 42}]
// <XAxis dataKey="name"> tells which field is the X axis label
// <Bar dataKey="count"> tells which field is the bar height
// That's the minimum viable chart — everything else is optional styling.
//
// useParams and useNavigate are NOT used here — this is a pure display component.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import './Chart.css';

// ── buildChartData ─────────────────────────────────────────────────────────────
// Takes the artwork array and a field name, counts occurrences of each unique
// value, and returns a sorted array formatted for Recharts.
// e.g. for field="medium": [{name: "Gouache", count: 23}, {name: "Bronze", count: 11}, ...]
function buildChartData(artworks, field) {
  const counts = {};
  artworks.forEach(a => {
    const val = a[field] || 'Unknown';
    // Truncate very long strings for axis readability
    const key = val.length > 30 ? val.slice(0, 28) + '…' : val;
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12); // show top 12 values max
}

// ── buildTimePeriodData ────────────────────────────────────────────────────────
// Special case for time period — parses the date string into a rough century.
// "1750–1800" → "18th century", "late 17th century" → "17th century", etc.
function buildTimePeriodData(artworks) {
  const counts = {};
  artworks.forEach(a => {
    const raw = a.date || '';
    // Extract any 4-digit year from the string
    const match = raw.match(/\d{4}/);
    let label = 'Unknown';
    if (match) {
      const year = parseInt(match[0]);
      const century = Math.ceil(year / 100);
      const suffix = ['th','st','nd','rd'][(century % 10 < 4 && century % 10 > 0 && !(century % 100 >= 11 && century % 100 <= 13)) ? century % 10 : 0] || 'th';
      label = `${century}${suffix} c.`;
    }
    counts[label] = (counts[label] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name)); // chronological sort
}

// Accent colors for bars — cycles through the palette
const BAR_COLORS = ['#e05a5a', '#c94545', '#a83535', '#8a2828', '#e07a5a', '#c96045'];

const CHART_TABS = [
  { key: 'museum',  label: 'Museum'      },
  { key: 'medium',  label: 'Medium'      },
  { key: 'culture', label: 'Culture'     },
  { key: 'time',    label: 'Time Period' },
];

const ChartSection = ({ artworks }) => {
  const [activeChart, setActiveChart] = useState('medium');

  if (!artworks || artworks.length === 0) return null;

  // Build data for whichever chart tab is active
  const chartData = activeChart === 'time'
    ? buildTimePeriodData(artworks)
    : buildChartData(artworks, activeChart);

  return (
    <div className="chart-section">
      <div className="chart-section__header">
        <span className="chart-section__label">Charts</span>
        <div className="chart-section__tabs">
          {CHART_TABS.map(({ key, label }) => (
            <button
              key={key}
              className={`chart-section__tab ${activeChart === key ? 'chart-section__tab--active' : ''}`}
              onClick={() => setActiveChart(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ResponsiveContainer makes the chart fill its parent's width.
          Without it, Recharts uses a fixed pixel width that breaks layouts. */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 0, bottom: 60 }}
        >
          <XAxis
            dataKey="name"
            tick={{ fill: '#a08070', fontSize: 10 }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fill: '#a08070', fontSize: 10 }}
            allowDecimals={false}
          />
          {/* Tooltip shows exact count on hover */}
          <Tooltip
            contentStyle={{
              background: '#2a1515',
              border: '1px solid #3d2020',
              borderRadius: '6px',
              color: '#f0e8d0',
              fontSize: '12px',
            }}
            cursor={{ fill: 'rgba(224,90,90,0.1)' }}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartSection;