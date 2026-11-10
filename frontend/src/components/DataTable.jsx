import { Inbox } from 'lucide-react'

export default function DataTable({ columns, rows, rowKey = 'id', emptyTitle = 'Nothing here yet', emptyDescription = 'Records will appear here when they are added.' }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>{columns.map((column) => <th key={column.key} className={column.className || ''}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row[rowKey] ?? index}>
              {columns.map((column) => (
                <td key={column.key} className={column.className || ''}>
                  {column.render ? column.render(row) : (row[column.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon"><Inbox size={22} /></span>
          <strong>{emptyTitle}</strong>
          <p>{emptyDescription}</p>
        </div>
      )}
    </div>
  )
}
