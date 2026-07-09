import './DashboardStats.css'; 


const DashboardStats = ({ stats, filteredCount }) => {
  return (
    <div className="dashboard-stats">
 
      {/* Stat 1: Total artworks in the dataset */}
      <div className="dashboard-stats__card">
        <span className="dashboard-stats__number">{stats.total}</span>
        <span className="dashboard-stats__label">Total Artworks Loaded</span>
      </div>
 
      {/* Stat 2: How many match current search/filters (updates live) */}
      <div className="dashboard-stats__card">
        <span className="dashboard-stats__number">{filteredCount}</span>
        <span className="dashboard-stats__label">Matching Current Filter</span>
      </div>
 
      {/* Stat 3: Most common culture in the full dataset */}
      <div className="dashboard-stats__card">
        <span className="dashboard-stats__number dashboard-stats__number--text">
          {stats.topCulture}
        </span>
        <span className="dashboard-stats__label">Most Common Origin</span>
      </div>
 
      {/* Stat 4: Most common medium */}
      <div className="dashboard-stats__card">
        <span className="dashboard-stats__number dashboard-stats__number--text">
          {stats.topMedium}
        </span>
        <span className="dashboard-stats__label">Most Common Medium</span>
      </div>
 
    </div>
  );
};
 
export default DashboardStats;