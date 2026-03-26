import { useState } from 'react'
import { DSComboChart } from '@ops-dss/charts/combo-chart'

type GapsChartPoint = {
  anio: number
  brechaHuila?: number
  brechaNacional?: number
  brechaSuaza?: number
  razonHuila?: number
  razonNacional?: number
  razonSuaza?: number
}

interface MaternalMortalityGapsChartProps {
  data: GapsChartPoint[]
  stratifier: string
  csvPath?: string
}

const brechaColumns = [
  { dataKey: 'brechaHuila', label: 'Huila' },
  { dataKey: 'brechaNacional', label: 'Nacional' },
  { dataKey: 'brechaSuaza', label: 'Suaza' },
] as const

const razonColumns = [
  { dataKey: 'razonHuila', label: 'Huila' },
  { dataKey: 'razonNacional', label: 'Nacional' },
  { dataKey: 'razonSuaza', label: 'Suaza' },
] as const

const brechaLines = [
  {
    dataKey: 'brechaHuila',
    name: 'Huila',
    color: '#6b7280',
    yAxisId: 'left',
  },
  {
    dataKey: 'brechaNacional',
    name: 'Nacional',
    color: '#3b82f6',
    yAxisId: 'left',
  },
]

const brechaBars = [
  {
    dataKey: 'brechaSuaza',
    name: 'Suaza',
    color: '#f59e0b',
    yAxisId: 'right',
  },
]

const razonLines = [
  {
    dataKey: 'razonHuila',
    name: 'Huila',
    color: '#6b7280',
    yAxisId: 'left',
  },
  {
    dataKey: 'razonNacional',
    name: 'Nacional',
    color: '#3b82f6',
    yAxisId: 'left',
  },
]

const razonBars = [
  {
    dataKey: 'razonSuaza',
    name: 'Suaza',
    color: '#f59e0b',
    yAxisId: 'right',
  },
]

export const MaternalMortalityGapsChart = ({
  data,
  stratifier,
  csvPath,
}: MaternalMortalityGapsChartProps) => {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [metric, setMetric] = useState<'brecha' | 'razon'>('brecha')

  const columns = metric === 'brecha' ? brechaColumns : razonColumns
  const lines = metric === 'brecha' ? brechaLines : razonLines
  const bars = metric === 'brecha' ? brechaBars : razonBars

  if (!data || data.length === 0) {
    return (
      <p className="text-gray-500 italic py-8 text-center">
        No hay datos disponibles.
      </p>
    )
  }

  return (
    <div
      style={{ width: '100%', margin: '0 auto' }}
      data-stratifier={stratifier}
    >
      {metric === 'brecha' ? (
        <div className="py-4">
          <h2 className="text-xl font-bold">Brecha Absoluta</h2>
          <p>Suaza en barras; Nacional y Huila como referencia</p>
        </div>
      ) : (
        <div className="py-4">
          <h2 className="text-xl font-bold">Brecha Relativa</h2>
          <p>Suaza en barras; Nacional y Huila como referencia</p>
        </div>
      )}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
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

          <div className="flex rounded-lg overflow-hidden border border-gray-200 text-sm">
            <button
              onClick={() => setMetric('brecha')}
              className={`px-4 py-1.5 transition-colors ${
                metric === 'brecha'
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Brecha Absoluta
            </button>
            <button
              onClick={() => setMetric('razon')}
              className={`px-4 py-1.5 transition-colors ${
                metric === 'razon'
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Brecha Relativa
            </button>
          </div>
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
        <DSComboChart
          data={data}
          xAxisKey="anio"
          lines={lines}
          bars={bars}
          height={400}
          alignZeroAxes
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Año</th>
                {columns.map((col) => (
                  <th key={col.dataKey} className="px-4 py-3 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row) => (
                <tr
                  key={row.anio}
                  className="bg-white hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.anio}
                  </td>
                  {columns.map((col) => {
                    const value = row[col.dataKey]
                    return (
                      <td key={col.dataKey} className="px-4 py-3 text-gray-600">
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
