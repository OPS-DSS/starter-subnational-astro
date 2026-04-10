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

const NONE_VALUE = '__none__'

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

const MATERNAL_LABEL = 'Mortalidad Materna (por 100k nv)'

// Bivariate colour palette — BIVARIATE_COLORS[mmRow][eduCol]
// mmRow  0 = low MM … 2 = high MM  (displayed bottom → top in legend)
// eduCol 0 = low edu … 2 = high edu (displayed left → right in legend)
const BIVARIATE_COLORS: string[][] = [
  ['#e8e8e8', '#ace4e4', '#5ac8c8'], // mm low
  ['#dfb0d6', '#a5b8c5', '#5a9ab5'], // mm med
  ['#be64ac', '#8c62aa', '#3b4994'], // mm high
]

type TableRow = { name: string; value: number | null }

interface MunicipalitiesMapPanelProps {
  geojsonUrls: Record<EducationIndicator, string>
  maternalGeojsonUrl?: string
  csvUrl?: string
}

// ── Bivariate legend ─────────────────────────────────────────────────────────

function BivariateLegend({ eduLabel }: { eduLabel: string }) {
  const cellSize = 22

  return (
    <div className="flex items-end gap-3">
      {/* Y-axis label (Maternal Mortality) */}
      <div
        className="flex flex-col items-center gap-1 shrink-0"
        style={{ width: 14 }}
      >
        <span
          className="text-gray-500 text-xs font-medium"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            whiteSpace: 'nowrap',
            lineHeight: 1.1,
          }}
        >
          Mortalidad Materna →
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {/* 3×3 grid — rendered top (high MM) to bottom (low MM) */}
        {[...BIVARIATE_COLORS].reverse().map((mmRow, reversedIdx) => {
          const mmIdx = BIVARIATE_COLORS.length - 1 - reversedIdx
          return (
            <div key={mmIdx} className="flex gap-0.5">
              {mmRow.map((color, eduIdx) => (
                <div
                  key={eduIdx}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: color,
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                  title={`MM: ${mmIdx === 0 ? 'Baja' : mmIdx === 1 ? 'Media' : 'Alta'} / Edu: ${eduIdx === 0 ? 'Baja' : eduIdx === 1 ? 'Media' : 'Alta'}`}
                />
              ))}
            </div>
          )
        })}

        {/* X-axis arrow row */}
        <div
          className="flex items-center gap-1 mt-0.5"
          style={{ paddingLeft: 2 }}
        >
          <span className="text-gray-400 text-xs">Bajo</span>
          <div
            className="flex-1 border-t border-gray-400"
            style={{ marginTop: 1 }}
          />
          <span className="text-gray-400 text-xs">→</span>
        </div>

        {/* X-axis label */}
        <div className="text-center">
          <span
            className="text-gray-500 text-xs font-medium"
            style={{ whiteSpace: 'nowrap' }}
          >
            {eduLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export const MunicipalitiesMapPanel = ({
  geojsonUrls,
  maternalGeojsonUrl,
  csvUrl,
}: MunicipalitiesMapPanelProps) => {
  // null = "Solo Mortalidad Materna" (no education indicator)
  const [indicator, setIndicator] = useState<EducationIndicator | null>(null)
  const [view, setView] = useState<'map' | 'table'>('map')
  const [tableData, setTableData] = useState<TableRow[]>([])
  const [tableLoading, setTableLoading] = useState(false)

  // Active GeoJSON URL:
  //   - no indicator → maternal mortality solo
  //   - indicator selected → bivariate GeoJSON for that indicator
  const activeGeojsonUrl =
    indicator !== null ? geojsonUrls[indicator] : maternalGeojsonUrl

  useEffect(() => {
    if (view !== 'table') return
    if (!activeGeojsonUrl) return

    setTableLoading(true)
    fetch(activeGeojsonUrl)
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
  }, [activeGeojsonUrl, view])

  const tableColumnLabel =
    indicator !== null ? INDICATOR_LABEL[indicator] : MATERNAL_LABEL

  return (
    <div className="flex flex-col gap-4">
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Select
          value={indicator ?? NONE_VALUE}
          onValueChange={(v) =>
            setIndicator(v === NONE_VALUE ? null : (v as EducationIndicator))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-1000">
            <SelectGroup>
              <SelectItem value={NONE_VALUE}>
                Solo Mortalidad Materna
              </SelectItem>
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
              Descargar Tabla
            </a>
          )}
        </div>
      </div>

      {/* Map view */}
      {view === 'map' && (
        <>
          <DSChoroplethMap
            geojsonUrl={activeGeojsonUrl}
            center={[2.3, -75.7]}
            zoom={8}
            height="520px"
            nameProperty="NAME_2"
            valueProperty="value"
            valueName={
              indicator !== null ? INDICATOR_LABEL[indicator] : MATERNAL_LABEL
            }
            secondaryValueProperty={
              indicator !== null ? 'maternal_value' : undefined
            }
            secondaryValueName={indicator !== null ? MATERNAL_LABEL : undefined}
          />

          {/* Legend */}
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-gray-700">Leyenda:</span>

            {indicator !== null ? (
              /* Bivariate legend */
              <div className="flex items-start gap-6 flex-wrap">
                <BivariateLegend eduLabel={INDICATOR_LABEL[indicator]} />
                <div className="flex items-center gap-1.5 self-end">
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      background: '#CCCCCC',
                      border: '1px solid #9ca3af',
                      borderRadius: 3,
                      flexShrink: 0,
                    }}
                  />
                  <span className="text-gray-600 text-xs">Sin datos</span>
                </div>
              </div>
            ) : (
              /* Solo maternal mortality legend */
              <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs w-36 shrink-0">
                    Mortalidad Materna
                  </span>
                  <span className="text-gray-600 text-xs">Menor</span>
                  <div
                    style={{
                      width: 120,
                      height: 14,
                      background:
                        'linear-gradient(to right, #FFFFB2, #FECC5C, #FD8D3C, #F03B20, #BD0026)',
                      border: '1px solid #9ca3af',
                      borderRadius: 3,
                    }}
                  />
                  <span className="text-gray-600 text-xs">Mayor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      background: '#CCCCCC',
                      border: '1px solid #9ca3af',
                      borderRadius: 3,
                      flexShrink: 0,
                    }}
                  />
                  <span className="text-gray-600 text-xs">Sin datos</span>
                </div>
              </div>
            )}
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
                  <th className="px-4 py-3 font-medium">{tableColumnLabel}</th>
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
