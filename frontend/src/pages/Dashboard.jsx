import { useNavigate } from 'react-router-dom'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Boxes, CircleCheck, CircleX, Plus, Rocket } from 'lucide-react'
import DataTable from '../components/DataTable.jsx'
import { ErrorState, LoadingState } from '../components/LoadState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import useApiData from '../hooks/useApiData.js'
import { api, formatDate } from '../services/api.js'

const cards = [
  { key: 'totalReleases', label: 'Total releases', icon: Boxes, tone: 'blue', route: '/releases', note: 'Versions registered' },
  { key: 'totalDeployments', label: 'Total deployments', icon: Rocket, tone: 'violet', route: '/deployments', note: 'Across all environments' },
  { key: 'successfulDeployments', label: 'Successful', icon: CircleCheck, tone: 'green', route: '/deployments', note: 'Completed successfully' },
  { key: 'failedDeployments', label: 'Failed', icon: CircleX, tone: 'red', route: '/deployments', note: 'Need attention' },
  { key: 'productionDeployments', label: 'Production', icon: ArrowUpRight, tone: 'amber', route: '/deployments', note: 'Production records' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useApiData(api.dashboard)

  return (
    <>
      <section className="welcome-row">
        <div><div className="eyebrow"><span className="eyebrow-line" /> RELEASE OPERATIONS</div><h1>Good to see you.</h1><p>Here’s what’s happening across your releases today.</p></div>
        <button className="button button-primary" onClick={() => navigate('/releases', { state: { openCreate: true } })}><Plus size={17} /> New release</button>
      </section>

      {loading && <LoadingState label="Loading your dashboard…" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <>
          <section className="metric-grid" aria-label="Release statistics">
            {cards.map(({ key, label, icon: Icon, tone, route, note }, index) => (
              <button className={`metric-card metric-${tone}`} key={key} onClick={() => navigate(route)}>
                <div className="metric-top"><span className={`metric-icon metric-icon-${tone}`}><Icon size={19} /></span><span className={`metric-trend${index === 3 ? ' metric-trend-down' : ''}`}>{index === 3 ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}</span></div>
                <span className="metric-value">{data[key] ?? 0}</span><span className="metric-label">{label}</span><span className="metric-note">{note}</span>
              </button>
            ))}
          </section>

          <section className="content-card activity-card">
            <div className="section-heading"><div><div className="eyebrow">LIVE FEED</div><h2>Recent deployment activity</h2><p>Latest activity recorded across your environments.</p></div><button className="button button-quiet" onClick={() => navigate('/deployments')}>View all <ArrowRight size={16} /></button></div>
            <DataTable
              rows={data.recentDeployments || []}
              emptyTitle="No deployments yet"
              emptyDescription="Deployment records will show up here once they’re added."
              columns={[
                { key: 'version', label: 'RELEASE', render: (row) => <button className="table-link" onClick={() => navigate(`/releases/${row.releaseId}`)}><span className="release-mark"><Boxes size={16} /></span><span><strong>v{row.version}</strong><small>{row.serviceName}</small></span></button> },
                { key: 'environment', label: 'ENVIRONMENT', render: (row) => <StatusBadge value={row.environment} /> },
                { key: 'status', label: 'STATUS', render: (row) => <StatusBadge value={row.status} /> },
                { key: 'deployedAt', label: 'DEPLOYED', render: (row) => <span className="date-cell">{formatDate(row.deployedAt)}</span> },
              ]}
            />
          </section>
          <div className="dashboard-footnote"><span className="footnote-pulse" /> Dashboard data is synced from your ReleaseTrack database.</div>
        </>
      )}
    </>
  )
}
