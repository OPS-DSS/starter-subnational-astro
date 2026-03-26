import {
  readParquet,
  dataPath,
  filterSuicideRows,
  pivotGaps,
  filterEducationRows,
  filterAnalyticsRows,
  buildAnalyticsData,
} from './parquet'
import { maternalMortalityIndicators } from '@/data/indicators'

import type {
  SuicideRow,
  SuicideDataRow,
  GapsRow,
  GapsChartPoint,
  EducationRow,
  EducationDataRow,
  AnalyticsRow,
  AnalyticsDataRow,
} from './parquet'

// ─── Loaded datasets ─────────────────────────────────────────────────────────

export interface PageDatasets {
  suicideData: SuicideDataRow[]
  suicideRawRows: SuicideRow[]
  suicideGapsData: GapsChartPoint[]
  educationData: EducationDataRow[]
  educationRawRows: EducationRow[]
  analyticsData: AnalyticsDataRow[]
}

export async function loadAllDatasets(): Promise<PageDatasets> {
  let suicideRawRows: SuicideRow[] = []
  let suicideData: SuicideDataRow[] = []
  try {
    suicideRawRows = await readParquet<SuicideRow>(
      dataPath('suicide_huila.parquet'),
    )
    suicideData = filterSuicideRows(suicideRawRows)
  } catch (e) {
    console.error('[loadAllDatasets] suicide:', e)
  }

  let suicideGapsData: GapsChartPoint[] = []
  try {
    const rows = await readParquet<GapsRow>(
      dataPath('suicide_huila_gaps.parquet'),
    )
    suicideGapsData = pivotGaps(rows)
  } catch (e) {
    console.error('[loadAllDatasets] gaps:', e)
  }

  let educationRawRows: EducationRow[] = []
  let educationData: EducationDataRow[] = []
  try {
    educationRawRows = await readParquet<EducationRow>(
      dataPath('education_suaza.parquet'),
    )
    educationData = filterEducationRows(educationRawRows)
  } catch (e) {
    console.error('[loadAllDatasets] education:', e)
  }

  let analyticsData: AnalyticsDataRow[] = []
  try {
    const rows = await readParquet<AnalyticsRow>(
      dataPath('analytics_suaza.parquet'),
    )
    analyticsData = filterAnalyticsRows(rows)
  } catch {
    analyticsData = buildAnalyticsData(suicideRawRows, educationRawRows)
  }

  return {
    suicideData,
    suicideRawRows,
    suicideGapsData,
    educationData,
    educationRawRows,
    analyticsData,
  }
}

// ─── Page definitions ─────────────────────────────────────────────────────────

export interface PageDefinition {
  slug: string | undefined
  title: string
  text: string
  date: string
  navbar: boolean
  data?: SuicideDataRow[] | EducationDataRow[] | AnalyticsDataRow[]
  gapsData?: GapsChartPoint[]
  description?: string
  category?: string
  priority?: boolean
}

export function buildPages(datasets: PageDatasets): PageDefinition[] {
  const staticPages: PageDefinition[] = [
    {
      slug: undefined,
      title: 'Inicio',
      text: 'Bienvenidos al Observatorio de Determinantes Sociales de la Salud, un espacio dedicado a la recopilación, análisis y visualización de datos relacionados con la salud. Nuestro objetivo es proporcionar información precisa y actualizada para apoyar la toma de decisiones informadas en el ámbito de la salud pública.',
      date: '2026-01-01',
      navbar: true,
    },
    {
      slug: 'analisis-de-inequidad',
      title: 'Análisis de Inequidad',
      text: 'Problemas, gráficos de tendencias y mediciones de brechas',
      date: '2026-01-01',
      navbar: true,
    },
    {
      slug: 'analisis-de-inequidad/mortalidad-materna',
      title: 'Mortalidad Materna',
      text: 'Problemas, gráficos de tendencias y mediciones de brechas',
      date: '2026-01-01',
      navbar: false,
      data: datasets.suicideData,
      gapsData: datasets.suicideGapsData,
    },
    {
      slug: 'determinantes-de-la-salud',
      title: 'Determinantes Sociales de la Salud',
      text: 'Factores que influyen en la salud de la población',
      date: '2026-01-01',
      navbar: true,
    },
    {
      slug: 'determinantes-de-la-salud/mortalidad-materna',
      title: 'Mortalidad Materna',
      text: 'Problemas, gráficos de tendencias y mediciones de brechas',
      date: '2026-01-01',
      navbar: false,
      data: datasets.suicideData,
      gapsData: datasets.suicideGapsData,
    },
    {
      slug: 'analisis',
      title: 'Análisis',
      text: 'Análisis de relaciones',
      date: '2026-01-01',
      navbar: true,
    },
    {
      slug: 'analisis/mortalidad-materna',
      title: 'Análisis',
      text: 'Análisis de relaciones',
      description: 'Indicadores de análisis de datos y visualización.',
      date: '2026-01-01',
      category: 'Tendencia',
      navbar: false,
      priority: false,
      data: datasets.analyticsData,
    },
  ]

  const indicatorPages: PageDefinition[] = maternalMortalityIndicators.map(
    (ind) => ({
      slug: ind.slug,
      title: ind.title,
      text: ind.text,
      date: ind.date,
      navbar: false,
      ...(ind.slug === 'educacion' ? { data: datasets.educationData } : {}),
    }),
  )

  return [...staticPages, ...indicatorPages]
}

// ─── Static path factory ──────────────────────────────────────────────────────

export async function buildStaticPaths() {
  const datasets = await loadAllDatasets()
  const pages = buildPages(datasets)

  return pages.map(({ slug, title, text, date, navbar, ...rest }) => ({
    params: { slug },
    props: {
      title,
      text,
      slug,
      date: new Date(date),
      navbar,
      pages,
      ...rest,
    },
  }))
}
