import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CirclePlus, ShieldCheck, X } from 'lucide-react'
import DataTable from '../components/DataTable.jsx'
import { ErrorState, LoadingState } from '../components/LoadState.jsx'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Toast, { useNotice } from '../components/Toast.jsx'
import useApiData from '../hooks/useApiData.js'
import { api, formatDate } from '../services/api.js'

export default function Approvals() {
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [decision, setDecision] = useState('APPROVED')
  const [approverName, setApproverName] = useState('')
  const [comments, setComments] = useState('')
  const [createForm, setCreateForm] = useState({ releaseId: '', approverName: '', comments: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const { notice, setNotice } = useNotice()
  const approvals = useApiData(api.approvals)
  const releases = useApiData(api.releases)

  function openDecision(approval, nextDecision) {
    setFormError('')
    setSelected(approval)
    setDecision(nextDecision)
    setApproverName(approval.approverName || '')
    setComments(approval.comments || '')
  }

  async function submitRequest(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await api.createApproval({ ...createForm, releaseId: Number(createForm.releaseId) })
      setCreateOpen(false)
      setCreateForm({ releaseId: '', approverName: '', comments: '' })
      approvals.reload()
      setNotice({ type: 'success', message: 'Approval request created.' })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function submitDecision(event) {
    event.preventDefault()
    if (!selected) return
    setSaving(true)
    setFormError('')
    try {
      await api.decideApproval(selected.id, { approvalStatus: decision, approverName, comments })
      setSelected(null)
      approvals.reload()
      setNotice({ type: 'success', message: `Release ${decision.toLowerCase()} successfully.` })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="page-heading">
        <div><div className="eyebrow"><span className="eyebrow-line" /> RELEASE GOVERNANCE</div><h1>Approvals</h1><p>Review release requests before they reach production.</p></div>
        <button className="button button-primary" onClick={() => { setFormError(''); setCreateOpen(true) }}><CirclePlus size={17} /> Request approval</button>
      </section>
      <div className="callout-banner"><div className="callout-icon"><ShieldCheck size={18} /></div><div><strong>Production deployments need an approval.</strong><p>At least one approved request must exist for a release before it can be recorded in production.</p></div></div>
      <section className="content-card">
        <div className="list-toolbar"><div className="list-title"><div className="section-icon"><ShieldCheck size={18} /></div><div><h2>Approval requests</h2><p>Requests and decisions associated with your releases.</p></div></div><div className="toolbar-count">{approvals.data?.filter((item) => item.approvalStatus === 'PENDING').length ?? '—'} pending</div></div>
        {approvals.error && <ErrorState message={approvals.error} onRetry={approvals.reload} />}
        {approvals.loading && !approvals.data && <LoadingState label="Loading approval requests…" />}
        {approvals.data && <DataTable rows={approvals.data} emptyTitle="No approval requests" emptyDescription="Create a request when a release is ready for review." columns={[
          { key: 'version', label: 'RELEASE', render: (row) => <Link className="table-link table-link-anchor" to={`/releases/${row.releaseId}`}><span className="release-mark"><ShieldCheck size={16} /></span><span><strong>v{row.version}</strong><small>{row.serviceName}</small></span></Link> },
          { key: 'approverName', label: 'APPROVER', render: (row) => <span className="person-cell"><span className="person-avatar">{row.approverName?.slice(0, 1).toUpperCase() || 'A'}</span>{row.approverName}</span> },
          { key: 'approvalStatus', label: 'STATUS', render: (row) => <StatusBadge value={row.approvalStatus} /> },
          { key: 'comments', label: 'COMMENTS', render: (row) => <span className="comment-cell" title={row.comments}>{row.comments || '—'}</span> },
          { key: 'approvedAt', label: 'DECIDED', render: (row) => <span className="date-cell">{formatDate(row.approvedAt)}</span> },
          { key: 'actions', label: '', className: 'actions-cell', render: (row) => row.approvalStatus === 'PENDING' ? <div className="row-actions"><button className="icon-button row-action row-action-approve" onClick={() => openDecision(row, 'APPROVED')} aria-label={`Approve release ${row.version}`} title="Approve"><Check size={17} /></button><button className="icon-button row-action row-action-danger" onClick={() => openDecision(row, 'REJECTED')} aria-label={`Reject release ${row.version}`} title="Reject"><X size={17} /></button></div> : null },
        ]} />}
      </section>
      <Toast notice={notice} onClose={() => setNotice(null)} />

      {createOpen && (
        <Modal title="Request release approval" description="Create a review request for a release." onClose={() => setCreateOpen(false)}>
          <form className="form-stack" onSubmit={submitRequest}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            {!releases.loading && releases.data?.length === 0 && <p className="form-hint">Create a release before requesting approval.</p>}
            <label className="field"><span>Release <b>*</b></span><select required value={createForm.releaseId} onChange={(event) => setCreateForm({ ...createForm, releaseId: event.target.value })}><option value="">Select a release</option>{(releases.data || []).map((release) => <option key={release.id} value={release.id}>v{release.version} · {release.serviceName}</option>)}</select></label>
            <label className="field"><span>Request owner / approver <b>*</b></span><input required maxLength={100} value={createForm.approverName} onChange={(event) => setCreateForm({ ...createForm, approverName: event.target.value })} placeholder="Name of the reviewer" /></label>
            <label className="field"><span>Comments</span><textarea rows={3} maxLength={5000} value={createForm.comments} onChange={(event) => setCreateForm({ ...createForm, comments: event.target.value })} placeholder="Context for the review (optional)" /></label>
            <div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setCreateOpen(false)}>Cancel</button><button type="submit" className="button button-primary" disabled={saving || releases.loading || !releases.data?.length}>{saving ? 'Submitting…' : 'Submit request'}</button></div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal title={`${decision === 'APPROVED' ? 'Approve' : 'Reject'} v${selected.version}`} description="Record the reviewer and decision details." onClose={() => setSelected(null)}>
          <form className="form-stack" onSubmit={submitDecision}>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className={`decision-banner decision-${decision.toLowerCase()}`}>{decision === 'APPROVED' ? <Check size={17} /> : <X size={17} />} This will mark the request as {decision.toLowerCase()}.</div>
            <label className="field"><span>Approver name <b>*</b></span><input required maxLength={100} value={approverName} onChange={(event) => setApproverName(event.target.value)} autoFocus /></label>
            <label className="field"><span>Comments</span><textarea rows={3} maxLength={5000} value={comments} onChange={(event) => setComments(event.target.value)} placeholder="Add a note (optional)" /></label>
            <div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setSelected(null)}>Cancel</button><button type="submit" className={`button ${decision === 'APPROVED' ? 'button-primary' : 'button-danger'}`} disabled={saving}>{saving ? 'Saving…' : `Confirm ${decision.toLowerCase()}`}</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}
