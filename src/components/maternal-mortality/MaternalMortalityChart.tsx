import { useState, useMemo } from 'react'
import { DSLineChart } from '@ops-dss/charts/line-chart'
import type { MaternalMortalityRateRow } from '@/lib/parquet'

const COLORS: Record<string, string> = {
  Nacional: '#6b7280',
  Huila: '#3b82f6',
}

const ORDER = ['Nacional', 'Huila']

function pivotRows(rows: MaternalMortalityRateRow[]) {
  const byYear = new Map<number, Record<string, number>>()

  for (const row of rows) {
    if (!byYear.has(row.anio)) byYear.set(row.anio, {})
    byYear.get(row.anio)![row.territorio] = row.valor
  }

  const chartData = Array.from(byYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([anio, vals]) => ({ anio, ...vals }))

  const keys = Array.from(
    new Set(
      chartData.flatMap((row) => Object.keys(row).filter((k) => k !== 'anio')),
    ),
  ).sort((a, b) => {
    const ia = ORDER.indexOf(a)
    const ib = ORDER.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  const lines = keys.map((key) => ({
    dataKey: key,
    name: key,
    color: COLORS[key] ?? '#8b5cf6',
  }))

  return { chartData, lines, keys }
}

interface MaternalMortalityChartProps {
  data: MaternalMortalityRateRow[]
  csvPath?: string
}

export const MaternalMortalityChart = ({
  data,
  csvPath,
}: MaternalMortalityChartProps) => {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const { chartData, lines, keys } = useMemo(() => pivotRows(data), [data])

  if (!data || data.length === 0) {
    return (
      <p className="text-gray-500 italic py-8 text-center">
        No hay datos disponibles.
      </p>
    )
  }

  return (
    <div style={{ width: '100%', margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 text-sm">
          <button
            onClick={() => setView('chart')}
            className={`px-4 py-1.5 transition-colors ${
              view === 'chart'
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Gráfico
          </button>
          <button
            onClick={() => setView('table')}
            className={`px-4 py-1.5 transition-colors ${
              view === 'table'
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Tabla
          </button>
        </div>

        {csvPath && (
          <a
            href={csvPath}
            download
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Descargar tabla
          </a>
        )}
      </div>

      {view === 'chart' ? (
        <DSLineChart
          data={chartData}
          xAxisKey="anio"
          lines={lines}
          height={400}
          xAxisLabel="Año"
          yAxisLabel="Tasa (×100.000 NV)"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Año</th>
                {keys.map((k) => (
                  <th key={k} className="px-4 py-3 font-medium">
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chartData.map((row) => (
                <tr
                  key={row.anio}
                  className="bg-white hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.anio}
                  </td>
                  {keys.map((k) => {
                    const value = (row as Record<string, unknown>)[k]
                    return (
                      <td key={k} className="px-4 py-3 text-gray-600">
                        {typeof value === 'number' ? value.toFixed(2) : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
