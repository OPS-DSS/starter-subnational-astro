import { asyncBufferFromFile, parquetRead } from 'hyparquet'
import { resolve, isAbsolute } from 'node:path'

export function dataPath(filename: string) {
  return resolve(process.cwd(), 'src/data', filename)
}

/**
 * Reads a parquet file at build time (Node.js / Astro SSG).
 * Pass a path relative to the project root, e.g. 'src/data/foo.parquet'.
 */
export async function readParquet<T = Record<string, unknown>>(
  filePath: string,
): Promise<T[]> {
  const resolvedPath = isAbsolute(filePath)
    ? filePath
    : resolve(process.cwd(), filePath)

  const file = await asyncBufferFromFile(resolvedPath)
  return new Promise<T[]>((resolve, reject) => {
    try {
      parquetRead({
        file,
        onComplete: (rows) => {
          try {
            // rows is an array of row-arrays from hyparquet
            // Each row is an array of column values
            if (!rows || rows.length === 0) {
              resolve([] as unknown as T[])
              return
            }
            // parquetRead returns row-oriented arrays (each row is an array of values)
            // We need column names from metadata to build objects
            resolve(rows as unknown as T[])
          } catch (err) {
            reject(err)
          }
        },
      })
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Reads a parquet file and returns row objects with named keys.
 * Uses parquet schema to map column indices to field names.
 */
export async function readParquetAsObjects<T = Record<string, unknown>>(
  filePath: string,
): Promise<T[]> {
  const resolvedPath = isAbsolute(filePath)
    ? filePath
    : resolve(process.cwd(), filePath)

  const file = await asyncBufferFromFile(resolvedPath)
  return new Promise<T[]>((resolve, reject) => {
    try {
      // First pass: read metadata to get column names
      let columnNames: string[] = []
      parquetRead({
        file,
        onComplete: (rows) => {
          try {
            if (!rows || rows.length === 0) {
              resolve([] as unknown as T[])
              return
            }
            // If rows are already objects, return as-is
            if (!Array.isArray(rows[0])) {
              resolve(rows as unknown as T[])
              return
            }
            // Get column names from metadata if available
            if (columnNames.length === 0) {
              // Fallback: generate indexed column names
              const numCols = (rows[0] as unknown[]).length
              columnNames = Array.from({ length: numCols }, (_, i) => `col${i}`)
            }
            // Convert each row array to a named object
            const objects = rows.map((row) => {
              const rowArr = row as unknown[]
              const obj: Record<string, unknown> = {}
              for (let i = 0; i < columnNames.length; i++) {
                obj[columnNames[i]] = rowArr[i]
              }
              return obj as T
            })
            resolve(objects)
          } catch (err) {
            reject(err)
          }
        },
        columns: undefined, // read all columns
      })
    } catch (err) {
      reject(err)
    }
  })
}

export type SuicideRow = {
  anio: number
  sexo: string
  valor: number
  [key: string]: unknown
}
export type ChartPoint = { anio: number; [key: string]: number | string }

export function pivotBySexo(rows: SuicideRow[]): ChartPoint[] {
  const byYear = new Map<number, ChartPoint>()
  for (const row of rows) {
    const year = Number(row[4])
    const sex = String(row[5])
    const value = Number(row[6])
    if (!byYear.has(year)) byYear.set(year, { anio: year })
    if (value !== 0) byYear.get(year)![sex] = value
  }
  return Array.from(byYear.values()).sort(
    (a, b) => (a.anio as number) - (b.anio as number),
  )
}

export type SuicideDataRow = {
  anio: number
  territorio: string
  sexo: string
  valor: number
}

const CHART_TERRITORIES = new Set(['Suaza', 'Huila', 'Nacional'])

/**
 * Filters the raw suicide parquet rows to only Suaza, Huila, and Nacional,
 * returning flat objects suitable for client-side pivoting.
 * Columns: iso3[0], territorio[1], cod_sub[2], cod_local[3], anio[4], sexo[5], valor[6]
 */
export function filterSuicideRows(rows: SuicideRow[]): SuicideDataRow[] {
  const result: SuicideDataRow[] = []
  for (const row of rows) {
    const territorio = String(row[1])
    if (!CHART_TERRITORIES.has(territorio)) continue
    const anio = Number(row[4])
    const sexo = String(row[5])
    const valor = Number(row[6])
    if (Number.isFinite(anio) && Number.isFinite(valor) && valor !== 0) {
      result.push({ anio, territorio, sexo, valor })
    }
  }
  return result
}

// Gaps data types — columns: anio, territorio, Femenino, Masculino, brecha_absoluta, razon
export type GapsRow = unknown[]
export type GapsChartPoint = {
  anio: number
  brechaHuila?: number
  brechaNacional?: number
  brechaSuaza?: number
  razonHuila?: number
  razonNacional?: number
  razonSuaza?: number
  femeninoHuila?: number
  femeninoNacional?: number
  femeninoSuaza?: number
  masculinoHuila?: number
  masculinoNacional?: number
  masculinoSuaza?: number
}

// Education data types
// Parquet columns (by index): anio[0], municipio[1], departamento[2],
// cobertura_bruta[3], cobertura_neta[4], deserci_n[5],
// aprobaci_n[6], reprobaci_n[7], repitencia[8]
export type EducationRow = unknown[]

export type EducationDataRow = {
  anio: number
  cobertura_bruta: number
  cobertura_neta: number
  deserci_n: number
  aprobaci_n: number
  reprobaci_n: number
  repitencia: number
}

export type EducationIndicator =
  | 'cobertura_bruta'
  | 'cobertura_neta'
  | 'deserci_n'
  | 'aprobaci_n'
  | 'reprobaci_n'
  | 'repitencia'

export function filterEducationRows(rows: EducationRow[]): EducationDataRow[] {
  const result: EducationDataRow[] = []
  for (const row of rows) {
    const anio = Number(row[0])
    if (!Number.isFinite(anio)) continue

    const cobertura_bruta = Number(row[3])
    const cobertura_neta = Number(row[4])
    const deserci_n = Number(row[5])
    const aprobaci_n = Number(row[6])
    const reprobaci_n = Number(row[7])
    const repitencia = Number(row[8])

    // Skip rows where any indicator value is not a finite number
    if (
      !Number.isFinite(cobertura_bruta) ||
      !Number.isFinite(cobertura_neta) ||
      !Number.isFinite(deserci_n) ||
      !Number.isFinite(aprobaci_n) ||
      !Number.isFinite(reprobaci_n) ||
      !Number.isFinite(repitencia)
    ) {
      continue
    }

    result.push({
      anio,
      cobertura_bruta,
      cobertura_neta,
      deserci_n,
      aprobaci_n,
      reprobaci_n,
      repitencia,
    })
  }
  return result.sort((a, b) => a.anio - b.anio)
}

// ── Analytics data types ──────────────────────────────────────────────────────
// Cross-indicator: suicide mortality (Suaza, Total) joined with education data.
// Parquet columns (by index) when analytics_suaza.parquet is present:
//   anio[0], valor[1], cobertura_bruta[2], cobertura_neta[3],
//   desercion[4], aprobacion[5], reprobacion[6], repitencia[7]
export type AnalyticsRow = unknown[]

export type AnalyticsDataRow = {
  anio: number
  valor: number
  cobertura_bruta: number
  cobertura_neta: number
  desercion: number
  aprobacion: number
  reprobacion: number
  repitencia: number
}

/** Parse rows from analytics_suaza.parquet (produced by the R script). */
export function filterAnalyticsRows(rows: AnalyticsRow[]): AnalyticsDataRow[] {
  const result: AnalyticsDataRow[] = []
  for (const row of rows) {
    const anio = Number(row[0])
    const valor = Number(row[1])
    const cobertura_bruta = Number(row[2])
    const cobertura_neta = Number(row[3])
    const desercion = Number(row[4])
    const aprobacion = Number(row[5])
    const reprobacion = Number(row[6])
    const repitencia = Number(row[7])
    if (!Number.isFinite(anio) || !Number.isFinite(repitencia)) continue
    result.push({
      anio,
      valor,
      cobertura_bruta,
      cobertura_neta,
      desercion,
      aprobacion,
      reprobacion,
      repitencia,
    })
  }
  return result.sort((a, b) => a.anio - b.anio)
}

/**
 * Build the analytics joined dataset from already-read suicide and education
 * parquet rows (fallback when analytics_suaza.parquet has not been generated yet).
 * Mirrors the R inner_join(suicidio, educacion, by="anio") for Suaza/Total.
 */
export function buildAnalyticsData(
  suicideRows: SuicideRow[],
  educationRows: EducationRow[],
): AnalyticsDataRow[] {
  // Index education by year
  const eduByYear = new Map<number, AnalyticsDataRow>()
  for (const row of educationRows) {
    const anio = Number(row[0])
    const repitencia = Number(row[8])
    if (!Number.isFinite(anio) || !Number.isFinite(repitencia)) continue
    eduByYear.set(anio, {
      anio,
      valor: 0, // filled below
      cobertura_bruta: Number(row[3]),
      cobertura_neta: Number(row[4]),
      desercion: Number(row[5]),
      aprobacion: Number(row[6]),
      reprobacion: Number(row[7]),
      repitencia,
    })
  }
  // Join with Suaza/Total suicide rows
  const result: AnalyticsDataRow[] = []
  for (const row of suicideRows) {
    const territorio = String(row[1])
    const sexo = String(row[5])
    if (territorio !== 'Suaza' || sexo !== 'Total') continue
    const anio = Number(row[4])
    const valor = Number(row[6])
    if (!Number.isFinite(anio)) continue
    const edu = eduByYear.get(anio)
    if (!edu) continue
    result.push({ ...edu, valor })
  }
  return result.sort((a, b) => a.anio - b.anio)
}

export function pivotGaps(rows: GapsRow[]): GapsChartPoint[] {
  const byYear = new Map<number, GapsChartPoint>()

  for (const row of rows) {
    const anio = Number(row[0])
    if (!Number.isFinite(anio)) continue

    const territorio = String(row[1])
    if (
      territorio !== 'Huila' &&
      territorio !== 'Nacional' &&
      territorio !== 'Suaza'
    )
      continue

    const brechaAbsoluta = Number(row[4])
    if (!Number.isFinite(brechaAbsoluta)) continue

    if (!byYear.has(anio)) byYear.set(anio, { anio })
    const point = byYear.get(anio)!

    const femenino = Number(row[2])
    const masculino = Number(row[3])
    const razon = Number(row[5])

    if (territorio === 'Huila') {
      point.brechaHuila = brechaAbsoluta
      if (Number.isFinite(razon)) point.razonHuila = razon
      if (Number.isFinite(masculino)) point.masculinoHuila = masculino
      if (Number.isFinite(femenino)) point.femeninoHuila = femenino
    } else if (territorio === 'Nacional') {
      point.brechaNacional = brechaAbsoluta
      if (Number.isFinite(razon)) point.razonNacional = razon
      if (Number.isFinite(masculino)) point.masculinoNacional = masculino
      if (Number.isFinite(femenino)) point.femeninoNacional = femenino
    } else {
      point.brechaSuaza = brechaAbsoluta
      if (Number.isFinite(razon)) point.razonSuaza = razon
      if (Number.isFinite(masculino)) point.masculinoSuaza = masculino
      if (Number.isFinite(femenino)) point.femeninoSuaza = femenino
    }
  }

  return Array.from(byYear.values()).sort((a, b) => a.anio - b.anio)
}
