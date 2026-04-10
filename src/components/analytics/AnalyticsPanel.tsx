import { useState } from 'react'
import { AnalyticsDualChart } from './AnalyticsDualChart'
import {
  ANALYTICS_INDICATORS,
  type AnalyticsIndicatorKey,
} from './educationIndicators'
import type {
  ForestPlotDataRow,
  AnalyticsMaternalRow,
  ScatterMaternalRow,
} from '@/lib/parquet'
import { DSForestPlot } from '@ops-dss/charts/forest-plot'
import { DSScatterChart } from '@ops-dss/charts/scatter-chart'

interface AnalyticsPanelProps {
  forestPlotData?: ForestPlotDataRow[]
  analyticsMaternalData?: AnalyticsMaternalRow[]
  scatterMaternalData?: ScatterMaternalRow[]
  csvPath?: string
}

// ── Main panel ────────────────────────────────────────────────────────────────

export const AnalyticsPanel = ({
  forestPlotData,
  analyticsMaternalData,
  scatterMaternalData,
  csvPath,
}: AnalyticsPanelProps) => {
  const [selectedIndicator, setSelectedIndicator] =
    useState<AnalyticsIndicatorKey>('desercion')

  const hasData =
    (forestPlotData && forestPlotData.length > 0) ||
    (analyticsMaternalData && analyticsMaternalData.length > 0) ||
    (scatterMaternalData && scatterMaternalData.length > 0)

  if (!hasData) {
    return (
      <p className="text-gray-500 italic py-8 text-center">
        No hay datos disponibles.
      </p>
    )
  }

  const selectedMeta = ANALYTICS_INDICATORS[selectedIndicator]

  // Build scatter data: filter last year, use municipality as label + nacimientos as size
  const lastYear =
    scatterMaternalData && scatterMaternalData.length > 0
      ? Math.max(...scatterMaternalData.map((r) => r.anio))
      : null

  const scatterPoints =
    scatterMaternalData && lastYear !== null
      ? scatterMaternalData
          .filter((r) => r.anio === lastYear)
          .map((r) => ({
            x: r[selectedIndicator] as number,
            y: r.valor,
            label: r.territorio,
            size: r.nacimientos,
          }))
          .filter((d) => Number.isFinite(d.x) && Number.isFinite(d.y))
      : []

  return (
    <div className="flex flex-col gap-10">
      {/* ── Correlation chart ── */}
      {forestPlotData && forestPlotData.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900">
            Correlaciones con mortalidad materna
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Correlación de Spearman entre cada indicador educativo y la
            mortalidad materna (municipios de Huila, último año disponible). Haz
            clic en un indicador para explorar su relación.
          </p>
          <DSForestPlot
            data={forestPlotData}
            selectedIndicator={selectedIndicator}
            onSelectIndicator={(ind) =>
              setSelectedIndicator(ind as AnalyticsIndicatorKey)
            }
          />
        </section>
      )}
      <div className="flex flex-col gap-10">
        {/* ── Temporal trends ── */}
        {analyticsMaternalData && analyticsMaternalData.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-end gap-2 flex-wrap">
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
                  Descargar datos
                </a>
              )}
            </div>
            <AnalyticsDualChart
              data={analyticsMaternalData}
              selectedIndicator={selectedIndicator}
            />
          </section>
        )}

        {/* ── Scatter chart ── */}
        {scatterPoints.length > 0 && (
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Dispersión:{' '}
                <span style={{ color: selectedMeta.color }}>
                  {selectedMeta.label}
                </span>{' '}
                vs mortalidad materna
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Cada punto es un municipio de Huila (último año disponible). El
                tamaño refleja el número de nacidos vivos. La línea punteada
                muestra la tendencia lineal.
              </p>
            </div>
            <DSScatterChart
              data={scatterPoints}
              xLabel={selectedMeta.label}
              yLabel="Mortalidad materna (×100k NV)"
            />
          </section>
        )}
      </div>
    </div>
  )
}
