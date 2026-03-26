import { DSLineChart } from '@ops-dss/charts/line-chart'
import type { AnalyticsDataRow } from '@/lib/parquet'

interface AnalyticsDualChartProps {
  data: AnalyticsDataRow[]
}

/**
 * Two side-by-side line charts mirroring the R ggplot facet_wrap output:
 *   - Left:  Mortalidad por suicidio (100.000 hab.)
 *   - Right: Deserción escolar (%)
 */
export const AnalyticsDualChart = ({ data }: AnalyticsDualChartProps) => {
  if (!data || data.length === 0) {
    return (
      <p className="text-gray-500 italic py-8 text-center">
        No hay datos disponibles.
      </p>
    )
  }

  const suicideData = data.map((row) => ({ anio: row.anio, valor: row.valor }))
  const desercionData = data.map((row) => ({
    anio: row.anio,
    desercion: row.desercion,
  }))

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-800">
        Tendencia temporal de A y B
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-center text-gray-600">
            Mortalidad por suicidio (100.000 hab.)
          </p>
          <DSLineChart
            data={suicideData}
            xAxisKey="anio"
            lines={[
              {
                dataKey: 'valor',
                name: 'Mortalidad por suicidio (100.000 hab.)',
                color: '#ef4444',
              },
            ]}
            height={320}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-center text-gray-600">
            Deserción escolar (%)
          </p>
          <DSLineChart
            data={desercionData}
            xAxisKey="anio"
            lines={[
              {
                dataKey: 'desercion',
                name: 'Deserción escolar (%)',
                color: '#3b82f6',
              },
            ]}
            height={320}
          />
        </div>
      </div>
    </div>
  )
}
