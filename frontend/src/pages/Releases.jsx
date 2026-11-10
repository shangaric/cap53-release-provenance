import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Boxes, CirclePlus, Search, Trash2 } from 'lucide-react'
import DataTable from '../components/DataTable.jsx'
import { ErrorState, LoadingState } from '../components/LoadState.jsx'
import Modal from '../components/Modal.jsx'
import Toast, { useNotice } from '../components/Toast.jsx'
import useApiData from '../hooks/useApiData.js'
import { api, formatDate } from '../services/api.js'

const emptyForm = { version: '', serviceName: '', gitCommit: '', artifactName: '', checksum: '' }

export default function Releases() {
  const [form, setForm] = useState(emptyForm)
  const [searchText, setSearchText] = useState('')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { notice, setNotice } = useNotice()
  const releases = useApiData(() => api.releases(query), [query])
  const deployments = useApiData(api.deployments)
  const deploymentReleaseIds = useMemo(
    () => new Set((deployments.data || []).map((item) => item.releaseId)),
    [deployments.data],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(searchText.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [searchText])

  useEffect(() => {
    if (location.state?.openCreate) {
      setModalOpen(true)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await api.createRelease(form)
      setModalOpen(false)
      setForm(emptyForm)
      releases.reload()
      setNotice({ type: 'success', message: 'Release registered successfully.' })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeRelease(release) {
    if (!window.confirm(`Delete release v${release.version}? This cannot be undone.`)) return
    try {
      await api.deleteRelease(release.id)
      releases.reload()
      setNotice({ type: 'success', message: `Release v${release.version} was deleted.` })
    } catch (error) {
      setNotice({ type: 'error', message: error.message })
    }
  }

  const rows = releases.data || []
  const columns = [
    { key: 'version', label: 'RELEASE', render: (row) => <Link className="table-link table-link-anchor" to={`/releases/${row.id}`}><span className="release-mark"><Boxes size={16} /></span><span><strong>v{row.version}</strong><small>{row.serviceName}</small></span></Link> },
    { key: 'gitCommit', label: 'GIT COMMIT', render: (row) => row.gitCommit ? <code className="code-chip">{row.gitCommit}</code> : <span className="muted-cell">Not provided</span> },
    { key: 'artifactName', label: 'ARTIFACT', render: (row) => <span className="artifact-cell" title={row.artifactName}>{row.artifactName || '—'}</span> },
    { key: 'createdAt', label: 'CREATED', render: (row) => <span className="date-cell">{formatDate(row.createdAt)}</span> },
    { key: 'actions', label: '', className: 'actions-cell', render: (row) => (
      <div className="row-actions">
        <Link className="icon-button row-action" to={`/releases/${row.id}`} aria-label={`View release ${row.version}`}><ArrowUpRight size={17} /></Link>
        <button className="icon-button row-action row-action-danger" type="button" disabled={deploymentReleaseIds.has(row.id)} title={deploymentReleaseIds.has(row.id) ? 'Releases with deployment history cannot be deleted' : 'Delete release'} onClick={() => removeRelease(row)} aria-label={`Delete release ${row.version}`}><Trash2 size={16} /></button>
      </div>
    ) },
  ]

  return (
    <>
      <section className="page-heading">
        <div><div className="eyebrow"><span className="eyebrow-line" /> RELEASE CATALOG</div><h1>Releases</h1><p>Register versions and keep their release details in one place.</p></div>
        <button className="button button-primary" onClick={() => { setFormError(''); setModalOpen(true) }}><CirclePlus size={17} /> Create release</button>
      </section>
      <section className="content-card">
        <div className="list-toolbar">
          <div className="list-title"><div className="section-icon"><Boxes size={18} /></div><div><h2>All releases</h2><p>{releases.data ? `${releases.data.length} ${releases.data.length === 1 ? 'version' : 'versions'} in your catalog` : 'Versions registered in your catalog'}</p></div></div>
          <label className="search-box"><Search size={17} /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search versions or services" aria-label="Search releases" />{searchText && <button type="button" className="search-clear" onClick={() => setSearchText('')}>Clear</button>}</label>
        </div>
        {(releases.error || deployments.error) && <ErrorState message={releases.error || deployments.error} onRetry={() => { releases.reload(); deployments.reload() }} />}
        {(releases.loading || deployments.loading) && !releases.data && <LoadingState label="Loading releases…" />}
        {releases.data && !releases.error && (
          <DataTable rows={rows} columns={columns} emptyTitle={query ? 'No matching releases' : 'Your release catalog is empty'} emptyDescription={query ? 'Try another version number or service name.' : 'Create your first release to start tracking its deployments and evidence.'} />
        )}
      </section>
      <div className="page-tip"><span>Tip</span> Releases with deployment history are protected from deletion.</div>
      <Toast notice={notice} onClose={() => setNotice(null)} />

      {modalOpen && (
        <Modal title="Create a release" description="Add a version to your release catalog." onClose={() => setModalOpen(false)} wide>
          <form className="form-stack" onSubmit={submit}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="form-grid">
              <label className="field"><span>Version <b>*</b></span><input required maxLength={30} value={form.version} onChange={(event) => setForm({ ...form, version: event.target.value })} placeholder="e.g. 2.4.0" autoFocus /></label>
              <label className="field"><span>Service name <b>*</b></span><input required maxLength={100} value={form.serviceName} onChange={(event) => setForm({ ...form, serviceName: event.target.value })} placeholder="e.g. Payments API" /></label>
              <label className="field"><span>Git commit</span><input maxLength={100} value={form.gitCommit} onChange={(event) => setForm({ ...form, gitCommit: event.target.value })} placeholder="Short or full commit hash" /></label>
              <label className="field"><span>Artifact filename</span><input maxLength={255} value={form.artifactName} onChange={(event) => setForm({ ...form, artifactName: event.target.value })} placeholder="payments-api-2.4.0.jar" /></label>
              <label className="field field-full"><span>SHA-256 checksum</span><input maxLength={255} value={form.checksum} onChange={(event) => setForm({ ...form, checksum: event.target.value })} placeholder="Record the checksum for traceability" /></label>
            </div>
            <div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Create release'}</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}
