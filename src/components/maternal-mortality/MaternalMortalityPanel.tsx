import { useState } from 'react'
import { StratifierSelector } from '../StratifierSelector'
import { MaternalMortalityChart } from './MaternalMortalityChart'
import { MaternalMortalityGapsChart } from './MaternalMortalityGapsChart'
import type { SuicideDataRow, GapsChartPoint } from '@/lib/parquet'

interface MaternalMortalityPanelProps {
  data: SuicideDataRow[]
  gapsData: GapsChartPoint[]
  csvPath?: string
  gapsCsvPath?: string
}

export const MaternalMortalityPanel = ({
  data,
  gapsData,
  csvPath,
  gapsCsvPath,
}: MaternalMortalityPanelProps) => {
  const [stratifier, setStratifier] = useState('total')

  return (
    <div className="flex flex-col gap-8">
      <StratifierSelector value={stratifier} onValueChange={setStratifier} />
      <MaternalMortalityChart
        data={data}
        csvPath={csvPath}
        stratifier={stratifier}
      />
      <MaternalMortalityGapsChart
        data={gapsData}
        csvPath={gapsCsvPath}
        stratifier={stratifier}
      />
      <p>
        La brecha absoluta se estimó para todos los años con información
        disponible. La razón entre grupos se calculó únicamente cuando ambas
        tasas fueron mayores que cero, debido a que los valores iguales a cero
        no permiten distinguir con certeza entre ausencia real del evento y
        posibles limitaciones del dato reportado.
      </p>
      <h2 className="text-xl font-bold">Análisis del Último Año</h2>
      <table>
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">Territorio</th>
            <th className="px-4 py-2 border">Año Tasa</th>
            <th className="px-4 py-2 border">Tasa Mujeres</th>
            <th className="px-4 py-2 border">Tasa Hombres</th>
            <th className="px-4 py-2 border">Brecha Absoluta</th>
            <th className="px-4 py-2 border">Razón Hombre/Mujer</th>
          </tr>
        </thead>

        {gapsData.length > 0 ? (
          gapsData.slice(-1).map((row, i) => (
            <tbody key={row.anio}>
              <tr key={`nacional-${row.anio}`} className="text-center">
                <td className="px-4 py-2 border">Nacional</td>
                <td className="px-4 py-2 border">{row.anio}</td>
                <td className="px-4 py-2 border">
                  {row.femeninoNacional == null
                    ? 'N/A'
                    : row.femeninoNacional.toFixed(2)}
                </td>
                <td className="px-4 py-2 border">
                  {row.masculinoNacional == null
                    ? 'N/A'
                    : row.masculinoNacional.toFixed(2)}
                </td>
                <td className="px-4 py-2 border">
                  {row.brechaNacional == null
                    ? 'N/A'
                    : row.brechaNacional.toFixed(2)}
                </td>
                <td className="px-4 py-2 border">
                  {row.razonNacional == null
                    ? 'N/A'
                    : row.razonNacional.toFixed(2)}
                </td>
              </tr>
              <tr key={`huila-${row.anio}`} className="text-center">
                <td className="px-4 py-2 border">Huila</td>
                <td className="px-4 py-2 border">{row.anio}</td>
                <td className="px-4 py-2 border">
                  {row.femeninoHuila ? row.femeninoHuila.toFixed(2) : 'N/A'}
                </td>
                <td className="px-4 py-2 border">
                  {row.masculinoHuila ? row.masculinoHuila.toFixed(2) : 'N/A'}
                </td>
                <td className="px-4 py-2 border">
                  {row.brechaHuila ? row.brechaHuila.toFixed(2) : 'N/A'}
                </td>
                <td className="px-4 py-2 border">
                  {row.razonHuila ? row.razonHuila.toFixed(2) : 'N/A'}
                </td>
              </tr>
              <tr
                key={`<REPLACE_WITH_TERRITORY>-${row.anio}`}
                className="text-center"
              >
                <td className="px-4 py-2 border">Suaza</td>
                <td className="px-4 py-2 border">{row.anio}</td>
                <td className="px-4 py-2 border">
                  {row.femeninoSuaza ? row.femeninoSuaza.toFixed(2) : 'N/A'}
                </td>
                <td className="px-4 py-2 border">
                  {row.masculinoSuaza ? row.masculinoSuaza.toFixed(2) : 'N/A'}
                </td>
                <td className="px-4 py-2 border">
                  {row.brechaSuaza ? row.brechaSuaza.toFixed(2) : 'N/A'}
                </td>
                <td className="px-4 py-2 border">
                  {row.razonSuaza ? row.razonSuaza.toFixed(2) : 'N/A'}
                </td>
              </tr>
            </tbody>
          ))
        ) : (
          <tbody>
            <tr>
              <td
                colSpan={6}
                className="text-center text-gray-500 italic px-4 py-2"
              >
                No hay datos disponibles.
              </td>
            </tr>
          </tbody>
        )}
      </table>
    </div>
  )
}
