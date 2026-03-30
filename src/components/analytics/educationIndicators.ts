export const ANALYTICS_INDICATORS = {
  cobertura_bruta: { label: 'Cobertura Bruta', color: '#6366f1' },
  cobertura_neta: { label: 'Cobertura Neta', color: '#8b5cf6' },
  desercion: { label: 'Deserción', color: '#f59e0b' },
  aprobacion: { label: 'Aprobación', color: '#10b981' },
  reprobacion: { label: 'Reprobación', color: '#ef4444' },
  repitencia: { label: 'Repitencia', color: '#3b82f6' },
} as const

export type AnalyticsIndicatorKey = keyof typeof ANALYTICS_INDICATORS
