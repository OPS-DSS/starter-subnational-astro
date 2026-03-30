import type { AstroComponentFactory } from 'astro/runtime/server/index.js'

import Education from '@/components/education/Education.astro'
import MaternalMortalityInequity from '@/components/maternal-mortality/MaternalMortalityInequity.astro'
import Analytics from '@/components/analytics/Analytics.astro'
import Welcome from '@/components/Welcome.astro'
import MaternalMortalitySDoH from '@/components/maternal-mortality/MaternalMortalitySDoH.astro'
import PrioritySelector from '@/components/PrioritySelector.astro'

import type {
  SuicideDataRow,
  GapsChartPoint,
  EducationDataRow,
  AnalyticsDataRow,
  MaternalMortalityRateRow,
  MaternalMortalityQuintilRow,
  MaternalMortalityGapsRow,
  ForestPlotDataRow,
  AnalyticsMaternalRow,
  ScatterMaternalRow,
} from '@/lib/parquet'

export interface PageProps {
  title: string
  text: string
  pages: unknown[]
  slug: string | undefined
  date: Date
  data?: SuicideDataRow[] | EducationDataRow[] | AnalyticsDataRow[] | MaternalMortalityRateRow[]
  forestPlotData?: ForestPlotDataRow[]
  analyticsMaternalData?: AnalyticsMaternalRow[]
  scatterMaternalData?: ScatterMaternalRow[]
  gapsData?: GapsChartPoint[]
  quintilData?: MaternalMortalityQuintilRow[]
  maternalGapsData?: MaternalMortalityGapsRow[]
}

type PropsResolver = (
  props: PageProps,
  baseUrl: string,
) => Record<string, unknown>

interface PageRegistryEntry {
  component: AstroComponentFactory
  resolveProps: PropsResolver
}

const base = (url: string, path: string) => `${url}/data/${path}`

export const pageRegistry: Record<string, PageRegistryEntry> = {
  // ─── No slug (home) ────────────────────────────────────────────────────────
  '': {
    component: Welcome,
    resolveProps: ({ text }) => ({ text }),
  },

  // ─── Section index pages ───────────────────────────────────────────────────
  'analisis-de-inequidad': {
    component: PrioritySelector,
    resolveProps: ({ title, text, slug }) => ({ title, text, section: slug }),
  },
  'determinantes-de-la-salud': {
    component: PrioritySelector,
    resolveProps: ({ title, text, slug }) => ({ title, text, section: slug }),
  },
  analisis: {
    component: PrioritySelector,
    resolveProps: ({ title, text, slug }) => ({ title, text, section: slug }),
  },

  // ─── Detail pages ──────────────────────────────────────────────────────────
  'determinantes-de-la-salud/mortalidad-materna': {
    component: MaternalMortalitySDoH,
    resolveProps: ({ title, text }) => ({ title, text }),
  },
  'analisis-de-inequidad/mortalidad-materna': {
    component: MaternalMortalityInequity,
    resolveProps: ({ title, text, data, quintilData, maternalGapsData }, baseUrl) => ({
      title,
      text,
      data,
      quintilData,
      maternalGapsData,
      csvPath: base(baseUrl, 'maternal_mortality_rate.csv'),
      quintilCsvPath: base(baseUrl, 'maternal_mortality_quintiles.csv'),
      gapsCsvPath: base(baseUrl, 'maternal_mortality_gaps.csv'),
    }),
  },
  'analisis/mortalidad-materna': {
    component: Analytics,
    resolveProps: (
      { title, text, forestPlotData, analyticsMaternalData, scatterMaternalData },
      baseUrl,
    ) => ({
      title,
      text,
      forestPlotData,
      analyticsMaternalData,
      scatterMaternalData,
      csvPath: base(baseUrl, 'analytics_maternal.csv'),
      geojsonUrls: {
        cobertura_bruta: base(baseUrl, 'huila_cobertura_bruta.geojson'),
        cobertura_neta: base(baseUrl, 'huila_cobertura_neta.geojson'),
        deserci_n: base(baseUrl, 'huila_desercion.geojson'),
        aprobaci_n: base(baseUrl, 'huila_aprobacion.geojson'),
        reprobaci_n: base(baseUrl, 'huila_reprobacion.geojson'),
        repitencia: base(baseUrl, 'huila_repitencia.geojson'),
      },
      csvUrl: base(baseUrl, 'huila_map.csv'),
    }),
  },
  educacion: {
    component: Education,
    resolveProps: ({ title, text, data }, baseUrl) => ({
      title,
      text,
      data,
      csvPath: base(baseUrl, 'education_suaza.csv'),
    }),
  },
}
