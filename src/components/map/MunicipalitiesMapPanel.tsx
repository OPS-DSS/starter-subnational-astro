import { useState, useEffect } from 'react'
import { DSChoroplethMap } from '@ops-dss/charts/choropleth-map'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from '../ui/select'
import type { EducationIndicator } from '@/lib/parquet'

const INDICATORS: { value: EducationIndicator; label: string }[] = [
  { value: 'cobertura_bruta', label: 'Cobertura Bruta' },
  { value: 'cobertura_neta', label: 'Cobertura Neta' },
  { value: 'deserci_n', label: 'Deserción' },
  { value: 'aprobaci_n', label: 'Aprobación' },
  { value: 'reprobaci_n', label: 'Reprobación' },
  { value: 'repitencia', label: 'Repitencia' },
]

const INDICATOR_LABEL: Record<EducationIndicator, string> = {
  cobertura_bruta: 'Cobertura Bruta (%)',
  cobertura_neta: 'Cobertura Neta (%)',
  deserci_n: 'Deserción (%)',
  aprobaci_n: 'Aprobación (%)',
  reprobaci_n: 'Reprobación (%)',
  repitencia: 'Repitencia (%)',
}

type TableRow = { name: string; value: number | null }

interface MunicipalitiesMapPanelProps {
  geojsonUrls: Record<EducationIndicator, string>
  csvUrl?: string
}

export const MunicipalitiesMapPanel = ({
  geojsonUrls,
  csvUrl,
}: MunicipalitiesMapPanelProps) => {
  const [indicator, setIndicator] =
    useState<EducationIndicator>('cobertura_bruta')
  const [view, setView] = useState<'map' | 'table'>('map')
  const [tableData, setTableData] = useState<TableRow[]>([])
  const [tableLoading, setTableLoading] = useState(false)

  useEffect(() => {
    if (view !== 'table') return

    setTableLoading(true)
    fetch(geojsonUrls[indicator])
      .then((res) => res.json())
      .then((geojson) => {
        const rows: TableRow[] = (geojson.features ?? [])
          .map((f: { properties: { NAME_2?: string; value?: number } }) => ({
            name: f.properties.NAME_2 ?? '',
            value: f.properties.value ?? null,
          }))
          .sort((a: TableRow, b: TableRow) => a.name.localeCompare(b.name))
        setTableData(rows)
        setTableLoading(false)
      })
      .catch(() => setTableLoading(false))
  }, [indicator, view, geojsonUrls])

  return (
    <div className="flex flex-col gap-4">
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Select
          value={indicator}
          onValueChange={(v) => setIndicator(v as EducationIndicator)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-1000">
            <SelectGroup>
              {INDICATORS.map((ind) => (
                <SelectItem key={ind.value} value={ind.value}>
                  {ind.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-gray-200 text-sm">
            <button
              onClick={() => setView('map')}
              className={`px-4 py-1.5 transition-colors ${
                view === 'map'
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Mapa
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

          {csvUrl && (
            <a
              href={csvUrl}
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
              Descargar CSV
            </a>
          )}
        </div>
      </div>

      {/* Map view */}
      {view === 'map' && (
        <>
          <DSChoroplethMap
            geojsonUrl={geojsonUrls[indicator]}
            center={[2.3, -75.7]}
            zoom={8}
            height="520px"
            nameProperty="NAME_2"
            valueProperty="value"
            valueName={INDICATOR_LABEL[indicator]}
          />

          <div className="flex flex-wrap gap-4 items-center text-sm">
            <span className="font-medium text-gray-700">Leyenda:</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Menor</span>
              <div
                style={{
                  width: 160,
                  height: 18,
                  background:
                    'linear-gradient(to right, #FFFFB2, #FECC5C, #FD8D3C, #F03B20, #BD0026)',
                  border: '1px solid #9ca3af',
                  borderRadius: 3,
                }}
              />
              <span className="text-gray-600">Mayor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                style={{
                  width: 18,
                  height: 18,
                  background: '#CCCCCC',
                  border: '1px solid #9ca3af',
                  borderRadius: 3,
                  flexShrink: 0,
                }}
              />
              <span className="text-gray-600">Sin datos</span>
            </div>
          </div>
        </>
      )}

      {/* Table view */}
      {view === 'table' &&
        (tableLoading ? (
          <p className="text-gray-500 italic py-8 text-center">
            Cargando datos…
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 font-medium">Municipio</th>
                  <th className="px-4 py-3 font-medium">
                    {INDICATOR_LABEL[indicator]}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.map((row) => (
                  <tr
                    key={row.name}
                    className="bg-white hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.value != null && Number.isFinite(row.value)
                        ? row.value.toFixed(2)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  )
}
