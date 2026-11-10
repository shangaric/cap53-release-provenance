import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, CirclePlus } from 'lucide-react'
import DataTable from '../components/DataTable.jsx'
import { ErrorState, LoadingState } from '../components/LoadState.jsx'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Toast, { useNotice } from '../components/Toast.jsx'
import useApiData from '../hooks/useApiData.js'
import { api, formatDate } from '../services/api.js'

const initialForm = { releaseId: '', testName: '', testStatus: 'PASSED', evidenceDetails: '' }

export default function TestEvidence() {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const { notice, setNotice } = useNotice()
  const evidence = useApiData(api.testEvidence)
  const releases = useApiData(api.releases)

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await api.createTestEvidence({ ...form, releaseId: Number(form.releaseId) })
      setModalOpen(false)
      setForm(initialForm)
      evidence.reload()
      setNotice({ type: 'success', message: 'Test result recorded.' })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="page-heading">
        <div><div className="eyebrow"><span className="eyebrow-line" /> QUALITY RECORDS</div><h1>Test evidence</h1><p>Keep test outcomes and supporting evidence with every release.</p></div>
        <button className="button button-primary" onClick={() => { setFormError(''); setModalOpen(true) }}><CirclePlus size={17} /> Record test result</button>
      </section>
      <section className="content-card">
        <div className="list-toolbar"><div className="list-title"><div className="section-icon"><ClipboardCheck size={18} /></div><div><h2>Test results</h2><p>Execution evidence linked to registered releases.</p></div></div><div className="toolbar-count">{evidence.data?.length ?? '—'} records</div></div>
        {evidence.error && <ErrorState message={evidence.error} onRetry={evidence.reload} />}
        {evidence.loading && !evidence.data && <LoadingState label="Loading test evidence…" />}
        {evidence.data && <DataTable rows={evidence.data} emptyTitle="No test evidence yet" emptyDescription="Record a test result to make quality evidence available to the team." columns={[
          { key: 'version', label: 'RELEASE', render: (row) => <Link className="table-link table-link-anchor" to={`/releases/${row.releaseId}`}><span className="release-mark"><ClipboardCheck size={16} /></span><span><strong>v{row.version}</strong><small>{row.testName}</small></span></Link> },
          { key: 'testStatus', label: 'RESULT', render: (row) => <StatusBadge value={row.testStatus} /> },
          { key: 'evidenceDetails', label: 'EVIDENCE', render: (row) => <span className="comment-cell" title={row.evidenceDetails}>{row.evidenceDetails || '—'}</span> },
          { key: 'executedAt', label: 'EXECUTED', render: (row) => <span className="date-cell">{formatDate(row.executedAt)}</span> },
        ]} />}
      </section>
      <Toast notice={notice} onClose={() => setNotice(null)} />

      {modalOpen && (
        <Modal title="Record test result" description="Attach a test outcome to one of your releases." onClose={() => setModalOpen(false)} wide>
          <form className="form-stack" onSubmit={submit}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            {!releases.loading && releases.data?.length === 0 && <p className="form-hint">Create a release before recording test results.</p>}
            <div className="form-grid">
              <label className="field field-full"><span>Release <b>*</b></span><select required value={form.releaseId} onChange={(event) => setForm({ ...form, releaseId: event.target.value })}><option value="">Select a release</option>{(releases.data || []).map((release) => <option key={release.id} value={release.id}>v{release.version} · {release.serviceName}</option>)}</select></label>
              <label className="field"><span>Test name <b>*</b></span><input required maxLength={150} value={form.testName} onChange={(event) => setForm({ ...form, testName: event.target.value })} placeholder="e.g. API integration suite" /></label>
              <label className="field"><span>Test status <b>*</b></span><select value={form.testStatus} onChange={(event) => setForm({ ...form, testStatus: event.target.value })}><option value="PASSED">Passed</option><option value="FAILED">Failed</option><option value="SKIPPED">Skipped</option></select></label>
              <label className="field field-full"><span>Evidence details</span><textarea rows={4} maxLength={10000} value={form.evidenceDetails} onChange={(event) => setForm({ ...form, evidenceDetails: event.target.value })} placeholder="Test summary, results, or a reference to supporting evidence" /></label>
            </div>
            <div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="button button-primary" disabled={saving || releases.loading || !releases.data?.length}>{saving ? 'Saving…' : 'Save test result'}</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}
