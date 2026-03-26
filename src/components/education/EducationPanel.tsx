import { EducationChart } from './EducationChart'
import type { EducationDataRow, EducationIndicator } from '@/lib/parquet'

const INDICATORS: { value: EducationIndicator; label: string }[] = [
  { value: 'cobertura_bruta', label: 'Cobertura Bruta' },
  { value: 'cobertura_neta', label: 'Cobertura Neta' },
  { value: 'deserci_n', label: 'Deserción' },
  { value: 'aprobaci_n', label: 'Aprobación' },
  { value: 'reprobaci_n', label: 'Reprobación' },
  { value: 'repitencia', label: 'Repitencia' },
]

interface EducationPanelProps {
  data: EducationDataRow[]
  csvPath?: string
}

export const EducationPanel = ({ data, csvPath }: EducationPanelProps) => {
  return (
    <div className="flex flex-col gap-8">
      {csvPath && (
        <div className="flex justify-end">
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
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {INDICATORS.map((ind) => (
          <div key={ind.value}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {ind.label}
            </h2>
            <EducationChart data={data} indicator={ind.value} />
          </div>
        ))}
      </div>
    </div>
  )
}
