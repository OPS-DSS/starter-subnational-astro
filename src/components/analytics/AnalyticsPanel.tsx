import { useState } from 'react'
import { AnalyticsDualChart } from './AnalyticsDualChart'
import { ols, designMatrix, pStars, fmtFixed, fmt } from '@/lib/stats'
import type { AnalyticsDataRow } from '@/lib/parquet'
import type { OlsResult } from '@/lib/stats'

interface AnalyticsPanelProps {
  data: AnalyticsDataRow[]
  csvPath?: string
}

// ── Lag model runner ──────────────────────────────────────────────────────────

type LagRow = {
  anio: number
  valor: number
  desercion: number
  desercion_lag1: number | null
  desercion_lag2: number | null
}

function buildLagData(data: AnalyticsDataRow[]): LagRow[] {
  return data.map((row, i) => ({
    anio: row.anio,
    valor: row.valor,
    desercion: row.desercion,
    desercion_lag1: i >= 1 ? data[i - 1].desercion : null,
    desercion_lag2: i >= 2 ? data[i - 2].desercion : null,
  }))
}

function runLag1(lagData: LagRow[]): OlsResult | null {
  const rows = lagData.filter((r) => r.desercion_lag1 !== null)
  if (rows.length < 3) return null
  const X = designMatrix(
    rows.map((r) => ({ desercion_lag1: r.desercion_lag1 as number })),
    ['desercion_lag1'],
  )
  const y = rows.map((r) => r.valor)
  return ols(X, y, ['(Intercept)', 'desercion_lag1'])
}

function runLag1Trend(lagData: LagRow[]): OlsResult | null {
  const rows = lagData.filter((r) => r.desercion_lag1 !== null)
  if (rows.length < 4) return null
  const X = designMatrix(
    rows.map((r) => ({
      desercion_lag1: r.desercion_lag1 as number,
      anio: r.anio,
    })),
    ['desercion_lag1', 'anio'],
  )
  const y = rows.map((r) => r.valor)
  return ols(X, y, ['(Intercept)', 'desercion_lag1', 'anio'])
}

function runLag2Trend(lagData: LagRow[]): OlsResult | null {
  const rows = lagData.filter((r) => r.desercion_lag2 !== null)
  if (rows.length < 4) return null
  const X = designMatrix(
    rows.map((r) => ({
      desercion_lag2: r.desercion_lag2 as number,
      anio: r.anio,
    })),
    ['desercion_lag2', 'anio'],
  )
  const y = rows.map((r) => r.valor)
  return ols(X, y, ['(Intercept)', 'desercion_lag2', 'anio'])
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ModelSummary({ result, title }: { result: OlsResult; title: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 bg-gray-50">
      <h3 className="font-semibold text-gray-800">{title}</h3>

      {/* Coefficients table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left font-mono">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
              <th className="pr-4 py-1">Término</th>
              <th className="px-4 py-1 text-right">Estimado</th>
              <th className="px-4 py-1 text-right">Error Estándar</th>
              <th className="px-4 py-1 text-right">t</th>
              <th className="px-4 py-1 text-right">p</th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {result.terms.map((term) => (
              <tr key={term.term} className="bg-white">
                <td className="pr-4 py-1.5 text-gray-700">{term.term}</td>
                <td className="px-4 py-1.5 text-right">
                  {fmtFixed(term.estimate, 4)}
                </td>
                <td className="px-4 py-1.5 text-right">
                  {fmtFixed(term.stdError, 4)}
                </td>
                <td className="px-4 py-1.5 text-right">
                  {fmtFixed(term.tValue, 3)}
                </td>
                <td className="px-4 py-1.5 text-right">
                  {fmt(term.pValue, 3)}
                </td>
                <td className="px-2 py-1.5 text-blue-600 font-bold">
                  {pStars(term.pValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fit statistics */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm font-mono text-gray-600 border-t border-gray-200 pt-2">
        <span>
          Error estándar residual:{' '}
          <span className="text-gray-900">{fmtFixed(result.rse, 4)}</span> con{' '}
          {result.dfResidual} g.l.
        </span>
        <span>
          n = <span className="text-gray-900">{result.n}</span>
        </span>
        <span>
          R² = <span className="text-gray-900">{fmtFixed(result.r2, 4)}</span>
        </span>
        <span>
          R² ajustado ={' '}
          <span className="text-gray-900">{fmtFixed(result.r2Adj, 4)}</span>
        </span>
        <span className="col-span-2">
          F({result.dfModel}, {result.dfResidual}) ={' '}
          <span className="text-gray-900">{fmtFixed(result.fStat, 4)}</span>
          {', '}p ={' '}
          <span className="text-gray-900">{fmt(result.fPVal, 3)}</span>{' '}
          <span className="text-blue-600 font-bold">
            {pStars(result.fPVal)}
          </span>
        </span>
      </div>
      <p className="text-xs text-gray-400">
        Significancia: *** p&lt;0.001 &nbsp; ** p&lt;0.01 &nbsp; * p&lt;0.05
        &nbsp; . p&lt;0.1
      </p>
    </div>
  )
}

function DataTable({ data }: { data: AnalyticsDataRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            <th className="px-3 py-2">Año</th>
            <th className="px-3 py-2 text-right">
              Suicidio
              <br />
              (×100k)
            </th>
            <th className="px-3 py-2 text-right">
              Deserción
              <br />
              (%)
            </th>
            <th className="px-3 py-2 text-right">Cob. Bruta</th>
            <th className="px-3 py-2 text-right">Cob. Neta</th>
            <th className="px-3 py-2 text-right">Aprobación</th>
            <th className="px-3 py-2 text-right">Reprobación</th>
            <th className="px-3 py-2 text-right">Repitencia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr
              key={row.anio}
              className="bg-white hover:bg-gray-50 transition-colors"
            >
              <td className="px-3 py-2 font-medium text-gray-900">
                {row.anio}
              </td>
              <td className="px-3 py-2 text-right text-gray-700">
                {Number.isFinite(row.valor) ? row.valor.toFixed(2) : '—'}
              </td>
              <td className="px-3 py-2 text-right text-gray-700">
                {Number.isFinite(row.desercion)
                  ? row.desercion.toFixed(2)
                  : '—'}
              </td>
              <td className="px-3 py-2 text-right text-gray-700">
                {Number.isFinite(row.cobertura_bruta)
                  ? row.cobertura_bruta.toFixed(2)
                  : '—'}
              </td>
              <td className="px-3 py-2 text-right text-gray-700">
                {Number.isFinite(row.cobertura_neta)
                  ? row.cobertura_neta.toFixed(2)
                  : '—'}
              </td>
              <td className="px-3 py-2 text-right text-gray-700">
                {Number.isFinite(row.aprobacion)
                  ? row.aprobacion.toFixed(2)
                  : '—'}
              </td>
              <td className="px-3 py-2 text-right text-gray-700">
                {Number.isFinite(row.reprobacion)
                  ? row.reprobacion.toFixed(2)
                  : '—'}
              </td>
              <td className="px-3 py-2 text-right text-gray-700">
                {Number.isFinite(row.repitencia)
                  ? row.repitencia.toFixed(2)
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export const AnalyticsPanel = ({ data, csvPath }: AnalyticsPanelProps) => {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  if (!data || data.length === 0) {
    return (
      <p className="text-gray-500 italic py-8 text-center">
        No hay datos disponibles.
      </p>
    )
  }

  const lagData = buildLagData(data)
  const lag1 = runLag1(lagData)
  const lag1t = runLag1Trend(lagData)
  const lag2t = runLag2Trend(lagData)

  return (
    <div className="flex flex-col gap-10">
      {/* ── Temporal trends chart ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
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
              Descargar CSV
            </a>
          )}
        </div>

        {view === 'chart' ? (
          <AnalyticsDualChart data={data} />
        ) : (
          <DataTable data={data} />
        )}
      </section>

      {/* ── Lag regression models ── */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-gray-900">Modelos de rezago</h2>
        <p className="text-sm text-gray-600">
          Regresión lineal entre la tasa de mortalidad por suicidio (variable
          dependiente) y la deserción escolar rezagada uno o dos años. Los
          modelos con sufijo <em>_trend</em> incluyen el año como covariable de
          tendencia.
        </p>

        <div className="flex flex-col gap-6">
          {lag1 ? (
            <ModelSummary
              result={lag1}
              title="Modelo 1 — Lag 1: valor ~ desercion_lag1"
            />
          ) : (
            <p className="text-gray-400 italic text-sm">
              Modelo lag 1 no disponible (datos insuficientes).
            </p>
          )}

          {lag1t ? (
            <ModelSummary
              result={lag1t}
              title="Modelo 2 — Lag 1 + Tendencia: valor ~ desercion_lag1 + anio"
            />
          ) : (
            <p className="text-gray-400 italic text-sm">
              Modelo lag 1 + tendencia no disponible (datos insuficientes).
            </p>
          )}

          {lag2t ? (
            <ModelSummary
              result={lag2t}
              title="Modelo 3 — Lag 2 + Tendencia: valor ~ desercion_lag2 + anio"
            />
          ) : (
            <p className="text-gray-400 italic text-sm">
              Modelo lag 2 + tendencia no disponible (datos insuficientes).
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
