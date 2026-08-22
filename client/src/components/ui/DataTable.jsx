import React from 'react'

const DataTable = React.forwardRef(function DataTable(
  { 
    columns,
    data,
    emptyMessage = 'No data available',
    className = '',
    ...props 
  },
  ref
) {
  return (
    <div className={"overflow-x-auto " + className} {...props}>
      <table className="w-full caption-text text-on-surface-variant">
        <thead className="bg-surface-container-low">
          <tr>
            {columns.map((col, index) => (
              <th
                key={col.key || index}
                className={"px-4 py-3 text-left meta-label " + (col.align === 'right' ? 'text-right' : 'text-left')}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={"odd:bg-surface-container-low/30 " + (rowIndex % 2 === 0 ? '' : 'even:bg-transparent')}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={col.key || colIndex}
                    className={"px-4 py-3 " + (col.align === 'right' ? 'text-right' : 'text-left')}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
})

DataTable.displayName = 'DataTable'

export default DataTable
