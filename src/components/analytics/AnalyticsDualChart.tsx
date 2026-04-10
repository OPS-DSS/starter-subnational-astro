import { DSLineChart } from '@ops-dss/charts/line-chart'
import type { AnalyticsMaternalRow } from '@/lib/parquet'
import {
  ANALYTICS_INDICATORS,
  type AnalyticsIndicatorKey,
} from './educationIndicators'

interface AnalyticsDualChartProps {
  data: AnalyticsMaternalRow[]
  selectedIndicator?: AnalyticsIndicatorKey
}

/**
 * Two side-by-side line charts:
 *   - Left:  Mortalidad materna (Huila, por 100.000 NV)
 *   - Right: Selected education indicator (Huila weighted mean)
 */
export const AnalyticsDualChart = ({
  data,
  selectedIndicator = 'desercion',
}: AnalyticsDualChartProps) => {
  if (!data || data.length === 0) {
    return (
      <p className="text-gray-500 italic py-8 text-center">
        No hay datos disponibles.
      </p>
    )
  }

  const indicatorMeta = ANALYTICS_INDICATORS[selectedIndicator]
  const mortalityData = data.map((row) => ({
    anio: row.anio,
    valor: row.valor,
  }))
  const indicatorData = data.map((row) => ({
    anio: row.anio,
    [selectedIndicator]: row[selectedIndicator],
  }))

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-800">
        Tendencias temporales
      </h2>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-center text-gray-600">
            Mortalidad materna (×100.000 NV)
          </p>
          <DSLineChart
            data={mortalityData}
            xAxisKey="anio"
            lines={[
              {
                dataKey: 'valor',
                name: 'Mortalidad materna (×100k NV)',
                color: '#e11d48',
              },
            ]}
            height={320}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p
            className="text-sm font-semibold text-center"
            style={{ color: indicatorMeta.color }}
          >
            {indicatorMeta.label}
          </p>
          <DSLineChart
            data={indicatorData}
            xAxisKey="anio"
            lines={[
              {
                dataKey: selectedIndicator,
                name: indicatorMeta.label,
                color: indicatorMeta.color,
              },
            ]}
            height={320}
          />
        </div>
      </div>
    </div>
  )
}
