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
    slug: 'traslado',
    title: 'Tiempo promedio de traslado a centro de salud',
    text: 'Minutos promedio desde hogar al centro de salud.',
    description: 'Minutos promedio desde hogar al centro de salud.',
    date: '2026-04-10',
    category: 'dss',
    priority: true,
  },
  {
    slug: 'frecuencia-transporte',
    title: 'Frecuencia de transporte público',
    text: 'Número de buses por hora en el territorio.',
    description: 'Número de buses por hora en el territorio.',
    date: '2026-04-10',
    category: 'dss',
    priority: true,
  },
  {
    slug: 'sobrecarga-embarazadas',
    title: 'Porcentaje de mujeres embarazadas con sobrecarga de cuidados',
    text: 'Proporción con alta carga de cuidados.',
    description: 'Proporción con alta carga de cuidados.',
    date: '2026-04-10',
    category: 'dss',
    priority: true,
  },
  {
    slug: 'embarazadas-empleo-informal',
    title: 'Porcentaje de mujeres embarazadas con empleo informal',
    text: 'Proporción sin contrato o protección laboral.',
    description: 'Proporción sin contrato o protección laboral.',
    date: '2026-04-10',
    category: 'dss',
    priority: true,
  },
  {
    slug: 'apoyo-embarazadas',
    title: 'Porcentaje de cobertura de programa apoyo a embarazadas',
    text: 'Proporción de embarazadas que acceden al programa.',
    description: 'Proporción de embarazadas que acceden al programa.',
    date: '2026-04-10',
    category: 'policy',
    priority: true,
  },
  {
    slug: 'controles-prenatales',
    title: 'Porcentaje de mujeres con mas o igual a 4 controles prenatales',
    text: 'Proporción que completa controles recomendados.',
    description: 'Proporción que completa controles recomendados.',
    date: '2026-04-10',
    category: 'policy',
    priority: true,
  },
]
