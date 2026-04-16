import {
  readParquet,
  dataPath,
  filterEducationRows,
  filterAnalyticsRows,
  buildAnalyticsData,
  filterMaternalMortalityRateRows,
  filterMaternalMortalityQuintilRows,
  filterMaternalMortalityGapsRows,
  filterForestPlotRows,
  filterAnalyticsMaternalRows,
  filterScatterMaternalRows,
} from './parquet'
import { maternalMortalityIndicators } from '@/data/indicators'

import type {
  EducationRow,
  EducationDataRow,
  AnalyticsRow,
  AnalyticsDataRow,
  MaternalMortalityRateRawRow,
  MaternalMortalityRateRow,
  MaternalMortalityQuintilRawRow,
  MaternalMortalityQuintilRow,
  MaternalMortalityGapsRawRow,
  MaternalMortalityGapsRow,
  ForestPlotRawRow,
  ForestPlotDataRow,
  AnalyticsMaternalRawRow,
  AnalyticsMaternalRow,
  ScatterMaternalRawRow,
  ScatterMaternalRow,
} from './parquet'

// ─── Loaded datasets ─────────────────────────────────────────────────────────

export interface PageDatasets {
  educationData: EducationDataRow[]
  educationRawRows: EducationRow[]
  analyticsData: AnalyticsDataRow[]
  forestPlotData: ForestPlotDataRow[]
  analyticsMaternalData: AnalyticsMaternalRow[]
  scatterMaternalData: ScatterMaternalRow[]
  maternalMortalityRateData: MaternalMortalityRateRow[]
  maternalMortalityQuintilData: MaternalMortalityQuintilRow[]
  maternalMortalityGapsData: MaternalMortalityGapsRow[]
}

export async function loadAllDatasets(): Promise<PageDatasets> {
  let educationRawRows: EducationRow[] = []
  let educationData: EducationDataRow[] = []
  try {
    educationRawRows = await readParquet<EducationRow>(
      dataPath('education.parquet'),
    )
    educationData = filterEducationRows(educationRawRows)
  } catch (e) {
    console.error('[loadAllDatasets] education:', e)
  }

  let analyticsData: AnalyticsDataRow[] = []
  try {
    const rows = await readParquet<AnalyticsRow>(dataPath('analytics.parquet'))
    analyticsData = filterAnalyticsRows(rows)
  } catch (e) {
    console.error('[loadAllDatasets] analytics:', e)
  }

  let forestPlotData: ForestPlotDataRow[] = []
  try {
    const rows = await readParquet<ForestPlotRawRow>(
      dataPath('forest_plot.parquet'),
    )
    forestPlotData = filterForestPlotRows(rows)
  } catch (e) {
    console.error('[loadAllDatasets] forest_plot_suaza:', e)
  }

  let analyticsMaternalData: AnalyticsMaternalRow[] = []
  try {
    const rows = await readParquet<AnalyticsMaternalRawRow>(
      dataPath('analytics_maternal.parquet'),
    )
    analyticsMaternalData = filterAnalyticsMaternalRows(rows)
  } catch (e) {
    console.error('[loadAllDatasets] analytics_maternal:', e)
  }

  let scatterMaternalData: ScatterMaternalRow[] = []
  try {
    const rows = await readParquet<ScatterMaternalRawRow>(
      dataPath('scatter_maternal.parquet'),
    )
    scatterMaternalData = filterScatterMaternalRows(rows)
  } catch (e) {
    console.error('[loadAllDatasets] scatter_maternal:', e)
  }

  let maternalMortalityRateData: MaternalMortalityRateRow[] = []
  try {
    const rows = await readParquet<MaternalMortalityRateRawRow>(
      dataPath('maternal_mortality_rate.parquet'),
    )
    maternalMortalityRateData = filterMaternalMortalityRateRows(rows)
  } catch (e) {
    console.error('[loadAllDatasets] maternal_mortality_rate:', e)
  }

  let maternalMortalityQuintilData: MaternalMortalityQuintilRow[] = []
  try {
    const rows = await readParquet<MaternalMortalityQuintilRawRow>(
      dataPath('maternal_mortality_quintiles.parquet'),
    )
    maternalMortalityQuintilData = filterMaternalMortalityQuintilRows(rows)
  } catch (e) {
    console.error('[loadAllDatasets] maternal_mortality_quintiles:', e)
  }

  let maternalMortalityGapsData: MaternalMortalityGapsRow[] = []
  try {
    const rows = await readParquet<MaternalMortalityGapsRawRow>(
      dataPath('maternal_mortality_gaps.parquet'),
    )
    maternalMortalityGapsData = filterMaternalMortalityGapsRows(rows)
  } catch (e) {
    console.error('[loadAllDatasets] maternal_mortality_gaps:', e)
  }

  return {
    educationData,
    educationRawRows,
    analyticsData,
    forestPlotData,
    analyticsMaternalData,
    scatterMaternalData,
    maternalMortalityRateData,
    maternalMortalityQuintilData,
    maternalMortalityGapsData,
  }
}

// ─── Page definitions ─────────────────────────────────────────────────────────

export interface PageDefinition {
  slug: string | undefined
  title: string
  text: string
  date: string
  navbar: boolean
  data?: EducationDataRow[] | AnalyticsDataRow[] | MaternalMortalityRateRow[]
  forestPlotData?: ForestPlotDataRow[]
  analyticsMaternalData?: AnalyticsMaternalRow[]
  scatterMaternalData?: ScatterMaternalRow[]
  quintilData?: MaternalMortalityQuintilRow[]
  maternalGapsData?: MaternalMortalityGapsRow[]
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
      data: datasets.maternalMortalityRateData,
      quintilData: datasets.maternalMortalityQuintilData,
      maternalGapsData: datasets.maternalMortalityGapsData,
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
    },
    {
      slug: 'analisis',
      title: 'Análisis Avanzado',
      text: 'Análisis de relaciones',
      date: '2026-01-01',
      navbar: true,
    },
    {
      slug: 'analisis/mortalidad-materna',
      title: 'Análisis de Mortalidad Materna',
      text: 'Análisis de relaciones',
      description: 'Indicadores de análisis de datos y visualización.',
      date: '2026-01-01',
      category: 'Tendencia',
      navbar: false,
      priority: false,
      forestPlotData: datasets.forestPlotData,
      analyticsMaternalData: datasets.analyticsMaternalData,
      scatterMaternalData: datasets.scatterMaternalData,
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
