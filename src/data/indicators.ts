export type IndicatorMeta = {
  slug: string
  title: string
  text: string
  description: string
  date: string
  category: string
  priority: boolean
}

export const maternalMortalityIndicators: IndicatorMeta[] = [
  {
    slug: 'educacion',
    title: 'Educación',
    text: 'Indicadores de educación, incluyendo tasa de deserción escolar, entre otros.',
    description:
      'Indicadores de educación, incluyendo tasa de deserción escolar, entre otros.',
    date: '2026-01-01',
    category: 'dss',
    priority: true,
  },
  {
    slug: 'pobreza',
    title: 'Pobreza',
    text: 'Indicadores de pobreza, incluyendo tasa de pobreza, entre otros.',
    description:
      'Indicadores de pobreza, incluyendo tasa de pobreza, entre otros.',
    date: '2026-01-01',
    category: 'dss',
    priority: true,
  },
]
