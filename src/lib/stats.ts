/**
 * Minimal OLS regression utilities for the analytics page.
 * Implements matrix algebra, the regularised incomplete beta function,
 * and t / F distribution p-values from scratch — no runtime dependencies.
 */

// ── Gamma / Beta ─────────────────────────────────────────────────────────────

/** Log-gamma via Lanczos approximation (Numerical Recipes, g=7). */
function lgamma(x: number): number {
  const g = 7
  const C = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x)
  }
  let z = x - 1
  let a = C[0]
  const t = z + g + 0.5
  for (let i = 1; i < g + 2; i++) a += C[i] / (z + i)
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a)
}

/**
 * Regularised incomplete beta function I_x(a, b) via continued fractions
 * (Press et al., Numerical Recipes 3rd ed., §6.4).
 */
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 300
  const EPS = 3e-12
  const FPMIN = 1e-300
  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1.0
  let d = 1.0 - (qab * x) / qap
  if (Math.abs(d) < FPMIN) d = FPMIN
  d = 1.0 / d
  let h = d
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1.0 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1.0 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1.0 / d
    h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1.0 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1.0 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1.0 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1.0) < EPS) break
  }
  return h
}

function ibeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const bt = Math.exp(
    lgamma(a + b) -
      lgamma(a) -
      lgamma(b) +
      a * Math.log(x) +
      b * Math.log(1 - x),
  )
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a
  return 1 - (bt * betacf(b, a, 1 - x)) / b
}

/** Two-tailed p-value for the t-distribution with `df` degrees of freedom. */
export function tPValue(t: number, df: number): number {
  if (!Number.isFinite(t) || !Number.isFinite(df) || df <= 0) return NaN
  const x = df / (df + t * t)
  return ibeta(df / 2, 0.5, x)
}

/** Upper-tail p-value for the F-distribution F(df1, df2). */
export function fPValue(f: number, df1: number, df2: number): number {
  if (!Number.isFinite(f) || f <= 0) return NaN
  const x = df2 / (df2 + df1 * f)
  return ibeta(df2 / 2, df1 / 2, x)
}

// ── Matrix algebra ────────────────────────────────────────────────────────────

function transpose(A: number[][]): number[][] {
  return A[0].map((_, j) => A.map((row) => row[j]))
}

function matMul(A: number[][], B: number[][]): number[][] {
  const n = A.length
  const m = B[0].length
  const k = B.length
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) =>
      Array.from({ length: k }, (_, l) => A[i][l] * B[l][j]).reduce(
        (s, v) => s + v,
        0,
      ),
    ),
  )
}

function matVec(A: number[][], v: number[]): number[] {
  return A.map((row) => row.reduce((s, a, j) => s + a * v[j], 0))
}

/** Gauss-Jordan matrix inversion (in-place on a copy). */
function matInv(A: number[][]): number[][] {
  const n = A.length
  const aug = A.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ])
  for (let col = 0; col < n; col++) {
    let maxRow = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row
    }
    ;[aug[col], aug[maxRow]] = [aug[maxRow], aug[col]]
    const piv = aug[col][col]
    if (Math.abs(piv) < 1e-14) throw new Error('Singular matrix in matInv')
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= piv
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const f = aug[row][col]
        for (let j = 0; j < 2 * n; j++) aug[row][j] -= f * aug[col][j]
      }
    }
  }
  return aug.map((row) => row.slice(n))
}

// ── OLS ───────────────────────────────────────────────────────────────────────

export type OlsTerm = {
  term: string
  estimate: number
  stdError: number
  tValue: number
  pValue: number
}

export type OlsResult = {
  terms: OlsTerm[]
  r2: number
  r2Adj: number
  fStat: number
  fPVal: number
  dfModel: number
  dfResidual: number
  rse: number // residual standard error
  n: number
}

/**
 * Ordinary least-squares regression.
 *
 * @param X  Design matrix (n × p), already including the intercept column.
 * @param y  Response vector (length n).
 * @param termNames  Names for each column of X (length p).
 */
export function ols(
  X: number[][],
  y: number[],
  termNames: string[],
): OlsResult {
  const n = y.length
  const p = X[0].length

  const Xt = transpose(X)
  const XtX = matMul(Xt, X)
  const XtXinv = matInv(XtX)
  const Xty = matVec(Xt, y)
  const beta = matVec(XtXinv, Xty)

  const yhat = X.map((row) => row.reduce((s, xi, i) => s + xi * beta[i], 0))
  const resid = y.map((yi, i) => yi - yhat[i])

  const rss = resid.reduce((s, r) => s + r * r, 0)
  const dfResidual = n - p
  const s2 = rss / dfResidual

  const se = beta.map((_, i) => Math.sqrt(XtXinv[i][i] * s2))
  const tVals = beta.map((b, i) => b / se[i])
  const pVals = tVals.map((t) => tPValue(t, dfResidual))

  const ymean = y.reduce((s, yi) => s + yi, 0) / n
  const tss = y.reduce((s, yi) => s + (yi - ymean) ** 2, 0)
  const r2 = 1 - rss / tss
  const r2Adj = 1 - rss / dfResidual / (tss / (n - 1))

  const dfModel = p - 1
  const fStat = (tss - rss) / dfModel / (rss / dfResidual)
  const fPVal = fPValue(fStat, dfModel, dfResidual)

  return {
    terms: termNames.map((name, i) => ({
      term: name,
      estimate: beta[i],
      stdError: se[i],
      tValue: tVals[i],
      pValue: pVals[i],
    })),
    r2,
    r2Adj,
    fStat,
    fPVal,
    dfModel,
    dfResidual,
    rse: Math.sqrt(s2),
    n,
  }
}

/** Convenience: build intercept design matrix from named predictor columns. */
export function designMatrix(
  data: Record<string, number>[],
  predictors: string[],
): number[][] {
  return data.map((row) => [1, ...predictors.map((p) => row[p])])
}

/** Format p-value with significance stars (R convention). */
export function pStars(p: number): string {
  if (!Number.isFinite(p)) return ''
  if (p < 0.001) return '***'
  if (p < 0.01) return '**'
  if (p < 0.05) return '*'
  if (p < 0.1) return '.'
  return ''
}

/** Format a number to `digits` significant figures, fallback to '—'. */
export function fmt(v: number, digits = 4): string {
  if (!Number.isFinite(v)) return '—'
  return v.toPrecision(digits)
}

export function fmtFixed(v: number, d = 4): string {
  if (!Number.isFinite(v)) return '—'
  return v.toFixed(d)
}
