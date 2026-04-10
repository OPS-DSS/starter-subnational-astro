import { useState } from 'react'
import { MaternalMortalityChart } from './MaternalMortalityChart'
import { MaternalMortalityGapsChart } from './MaternalMortalityGapsChart'
import type {
  MaternalMortalityRateRow,
  MaternalMortalityQuintilRow,
  MaternalMortalityGapsRow,
} from '@/lib/parquet'

interface MaternalMortalityPanelProps {
  data: MaternalMortalityRateRow[]
  quintilData: MaternalMortalityQuintilRow[]
  maternalGapsData: MaternalMortalityGapsRow[]
  csvPath?: string
  quintilCsvPath?: string
  gapsCsvPath?: string
}

export const MaternalMortalityPanel = ({
  data,
  quintilData,
  maternalGapsData,
  csvPath,
  quintilCsvPath,
  gapsCsvPath,
}: MaternalMortalityPanelProps) => {
  const [metric, setMetric] = useState<'brecha_absoluta' | 'brecha_relativa'>(
    'brecha_absoluta',
  )

  const lastYear =
    maternalGapsData.length > 0
      ? maternalGapsData[maternalGapsData.length - 1]
      : null

  return (
    <div className="flex flex-col gap-8">
      <MaternalMortalityChart data={data} csvPath={csvPath} />

      <MaternalMortalityGapsChart
        quintilData={quintilData}
        gapsData={maternalGapsData}
        metric={metric}
        onMetricChange={setMetric}
        quintilCsvPath={quintilCsvPath}
        gapsCsvPath={gapsCsvPath}
      />

      <p className="text-sm text-gray-600">
        La brecha absoluta se estimó para todos los años con información
        disponible. La razón entre grupos (brecha relativa) se calculó
        únicamente cuando ambas tasas fueron mayores que cero, debido a que los
        valores iguales a cero no permiten distinguir con certeza entre ausencia
        real del evento y posibles limitaciones del dato reportado. Los
        intervalos de confianza al 95% se calcularon con base en el error
        estándar ponderado de cada quintil.
      </p>

      <h2 className="text-xl font-bold">Análisis del Último Año</h2>

      {lastYear ? (
        <table className="w-full text-sm text-left rounded-lg border border-gray-200 overflow-hidden">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 font-medium">Año</th>
              <th className="px-4 py-3 font-medium">Quintil</th>
              <th className="px-4 py-3 font-medium">
                Tasa ponderada (x 100.000 NV)
              </th>
              <th className="px-4 py-3 font-medium">Brecha Absoluta (Q5−Q1)</th>
              <th className="px-4 py-3 font-medium">Brecha Relativa (Q5/Q1)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="bg-white hover:bg-gray-50 transition-colors text-center">
              <td
                className="px-4 py-2 font-medium text-gray-900 border"
                rowSpan={2}
              >
                {lastYear.anio}
              </td>
              <td className="px-4 py-2 border">Quintil 1 (menor deserción)</td>
              <td className="px-4 py-2 border">
                {Number.isFinite(lastYear.valor_ref)
                  ? lastYear.valor_ref.toFixed(2)
                  : 'N/A'}
              </td>
              <td className="px-4 py-2 border" rowSpan={2}>
                {Number.isFinite(lastYear.brecha_absoluta)
                  ? lastYear.brecha_absoluta.toFixed(2)
                  : 'N/A'}
              </td>
              <td className="px-4 py-2 border" rowSpan={2}>
                {Number.isFinite(lastYear.brecha_relativa)
                  ? lastYear.brecha_relativa.toFixed(2)
                  : 'N/A'}
              </td>
            </tr>
            <tr className="bg-white hover:bg-gray-50 transition-colors text-center">
              <td className="px-4 py-2 border">Quintil 5 (mayor deserción)</td>
              <td className="px-4 py-2 border">
                {Number.isFinite(lastYear.valor_comp)
                  ? lastYear.valor_comp.toFixed(2)
                  : 'N/A'}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 italic">No hay datos disponibles.</p>
      )}
    </div>
  )
}
