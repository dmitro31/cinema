interface ChartTableProps {
  headers: string[];
  rows: (string | number)[][];
  height?: number;
}

export function ChartTable({ headers, rows, height = 288 }: ChartTableProps) {
  return (
    <div className="overflow-auto" style={{ maxHeight: height }}>
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-[#121218]">
          <tr className="border-b border-[#262631]">
            {headers.map((header, index) => (
              <th
                key={header}
                scope="col"
                className={`whitespace-nowrap px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-[#6F6F7C] ${
                  index > 0 ? 'text-right' : ''
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-[#1E1E28]">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`px-3 py-2.5 ${
                    cellIndex > 0
                      ? 'text-right tabular-nums text-[#F4F4F5]'
                      : 'text-[#C3C2B7]'
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
