import { useState, useMemo } from 'react'
import { DSLineChart } from '@ops-dss/charts/line-chart'

type MaternalMortalityDataRow = {
  anio: number
  territorio: string
  sexo: string
  valor: number
}

interface MaternalMortalityChartProps {
  data: MaternalMortalityDataRow[]
  csvPath?: string
  stratifier?: string
}

// Total mode: one line per territory
const TOTAL_COLORS: Record<string, string> = {
  Nacional: '#6b7280',
  Huila: '#3b82f6',
  Suaza: '#10b981',
}

// Sexo mode: one line per territory+sex combination
const SEXO_COLORS: Record<string, string> = {
  'Nacional Femenino': '#f43f5e',
  'Nacional Masculino': '#6b7280',
  'Huila Femenino': '#ec4899',
  'Huila Masculino': '#3b82f6',
  'Suaza Femenino': '#f97316',
  'Suaza Masculino': '#10b981',
}

const FALLBACK_COLORS = ['#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6']

// Preferred display order
const TOTAL_ORDER = ['Nacional', 'Huila', 'Suaza']
const SEXO_ORDER = [
  'Nacional Femenino',
  'Nacional Masculino',
  'Huila Femenino',
  'Huila Masculino',
  'Suaza Femenino',
  'Suaza Masculino',
]

function pivotRows(rows: MaternalMortalityDataRow[], stratifier: string) {
  const byYear = new Map<number, Record<string, number>>()

  for (const row of rows) {
    const isTotal = stratifier === 'total'
    if (isTotal && row.sexo !== 'Total') continue
    if (!isTotal && row.sexo === 'Total') continue

    const key = isTotal ? row.territorio : `${row.territorio} ${row.sexo}`
    if (!byYear.has(row.anio)) byYear.set(row.anio, {})
    byYear.get(row.anio)![key] = row.valor
  }

  const chartData = Array.from(byYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([anio, vals]) => ({ anio, ...vals }))

  const order = stratifier === 'total' ? TOTAL_ORDER : SEXO_ORDER
  const colorMap = stratifier === 'total' ? TOTAL_COLORS : SEXO_COLORS
  const getOrderIndex = (key: string): number => {
    const idx = order.indexOf(key)
    return idx === -1 ? Number.POSITIVE_INFINITY : idx
  }
  const keys = Array.from(
    new Set(
      chartData.flatMap((row) => Object.keys(row).filter((k) => k !== 'anio')),
    ),
  ).sort((a, b) => {
    const indexA = getOrderIndex(a)
    const indexB = getOrderIndex(b)
    if (indexA === indexB) {
      // For keys not present in the preferred order, fall back to alphabetical order
      return a.localeCompare(b)
    }
    return indexA - indexB
  })

  const lines = keys.map((key, i) => ({
    dataKey: key,
    name: key,
    color: colorMap[key] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }))

  return { chartData, lines, keys }
}

export const MaternalMortalityChart = ({
  data,
  csvPath,
  stratifier = 'total',
}: MaternalMortalityChartProps) => {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  const { chartData, lines, keys } = useMemo(
    () => pivotRows(data, stratifier),
    [data, stratifier],
  )

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
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Año</th>
                {keys.map((cat) => (
                  <th key={cat} className="px-4 py-3 font-medium">
                    {cat}
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
                  {keys.map((cat) => {
                    const value = (row as Record<string, unknown>)[cat]
                    return (
                      <td key={cat} className="px-4 py-3 text-gray-600">
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
