import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CirclePlus, Rocket } from 'lucide-react'
import DataTable from '../components/DataTable.jsx'
import { ErrorState, LoadingState } from '../components/LoadState.jsx'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Toast, { useNotice } from '../components/Toast.jsx'
import useApiData from '../hooks/useApiData.js'
import { api, formatDate } from '../services/api.js'

const defaultForm = { releaseId: '', environment: 'STAGING', status: 'PENDING' }

export default function Deployments() {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const { notice, setNotice } = useNotice()
  const deployments = useApiData(api.deployments)
  const releases = useApiData(api.releases)

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await api.createDeployment({ ...form, releaseId: Number(form.releaseId) })
      setModalOpen(false)
      setForm(defaultForm)
      deployments.reload()
      setNotice({ type: 'success', message: 'Deployment record added.' })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="page-heading">
        <div><div className="eyebrow"><span className="eyebrow-line" /> ENVIRONMENT ACTIVITY</div><h1>Deployments</h1><p>Track deployment records across staging and production.</p></div>
        <button className="button button-primary" onClick={() => { setFormError(''); setModalOpen(true) }}><CirclePlus size={17} /> Record deployment</button>
      </section>
      <section className="content-card">
        <div className="list-toolbar"><div className="list-title"><div className="section-icon"><Rocket size={18} /></div><div><h2>Deployment history</h2><p>Deployment outcomes recorded for each release.</p></div></div><div className="toolbar-count">{deployments.data?.length ?? '—'} records</div></div>
        {deployments.error && <ErrorState message={deployments.error} onRetry={deployments.reload} />}
        {deployments.loading && !deployments.data && <LoadingState label="Loading deployments…" />}
        {deployments.data && (
          <DataTable rows={deployments.data} emptyTitle="No deployments recorded" emptyDescription="Add a deployment record to start tracking release activity." columns={[
            { key: 'version', label: 'RELEASE', render: (row) => <Link className="table-link table-link-anchor" to={`/releases/${row.releaseId}`}><span className="release-mark"><Rocket size={16} /></span><span><strong>v{row.version}</strong><small>{row.serviceName}</small></span></Link> },
            { key: 'environment', label: 'ENVIRONMENT', render: (row) => <StatusBadge value={row.environment} /> },
            { key: 'status', label: 'STATUS', render: (row) => <StatusBadge value={row.status} /> },
            { key: 'deployedAt', label: 'DEPLOYMENT DATE', render: (row) => <span className="date-cell">{formatDate(row.deployedAt)}</span> },
            { key: 'detail', label: '', className: 'actions-cell', render: (row) => <Link className="icon-button row-action" to={`/releases/${row.releaseId}`} aria-label={`View release ${row.version}`}><ArrowUpRight size={17} /></Link> },
          ]} />
        )}
      </section>
      <Toast notice={notice} onClose={() => setNotice(null)} />

      {modalOpen && (
        <Modal title="Record a deployment" description="Log a deployment outcome for an existing release." onClose={() => setModalOpen(false)}>
          <form className="form-stack" onSubmit={submit}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            {!releases.loading && releases.data?.length === 0 && <p className="form-hint">Create a release before recording a deployment.</p>}
            <label className="field"><span>Release <b>*</b></span><select required value={form.releaseId} onChange={(event) => setForm({ ...form, releaseId: event.target.value })}><option value="">Select a release</option>{(releases.data || []).map((release) => <option key={release.id} value={release.id}>v{release.version} · {release.serviceName}</option>)}</select></label>
            <label className="field"><span>Environment <b>*</b></span><select value={form.environment} onChange={(event) => setForm({ ...form, environment: event.target.value })}><option value="STAGING">Staging</option><option value="PRODUCTION">Production</option></select></label>
            <label className="field"><span>Status <b>*</b></span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="PENDING">Pending</option><option value="SUCCESS">Success</option><option value="FAILED">Failed</option></select></label>
            {form.environment === 'PRODUCTION' && <p className="form-hint approval-hint">Production deployments require an approved approval request for the selected release.</p>}
            <div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="button button-primary" disabled={saving || releases.loading || !releases.data?.length}>{saving ? 'Saving…' : 'Save deployment'}</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}
