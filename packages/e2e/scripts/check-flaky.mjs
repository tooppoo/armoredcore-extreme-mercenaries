#!/usr/bin/env node
/* eslint-env node */
// Detect flaky tests from Playwright JSON report and control exit code.
// Policy:
//  - FLAKY_POLICY=fail (default): exit 1 if any flaky tests found
//  - FLAKY_POLICY=warn: print summary, exit 0

import fs from 'node:fs'
import path from 'node:path'

<<<<<<< HEAD
const POLICY = (process.env.FLAKY_POLICY || 'warn').toLowerCase()
const DEFAULT_JSON = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
  'playwright-report',
  'report.json',
)
const REPORT_PATH = process.env.PLAYWRIGHT_JSON_PATH
  ? path.resolve(process.env.PLAYWRIGHT_JSON_PATH)
  : DEFAULT_JSON
=======
const POLICY = (process.env.FLAKY_POLICY || 'fail').toLowerCase()
const BASE_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const CANDIDATES = [
  process.env.PLAYWRIGHT_JSON_PATH
    ? path.resolve(process.env.PLAYWRIGHT_JSON_PATH)
    : undefined,
  path.join(BASE_DIR, 'playwright-report.json'),
  path.join(BASE_DIR, 'playwright-report', 'report.json'),
].filter(Boolean)

function chooseReportPath() {
  for (const p of CANDIDATES) {
    try {
      if (fs.existsSync(p)) return p
    } catch {}
  }
  // Fallback to first candidate for messaging
  return CANDIDATES[0]
}
>>>>>>> eb2b7c5 (e2e: separate JSON report from HTML folder to avoid cleanup; update flaky-check to locate JSON; include JSON in artifact upload)

function readJsonSafe(p) {
  try {
    const data = fs.readFileSync(p, 'utf8')
    return JSON.parse(data)
  } catch (e) {
    console.error(`[flaky-check] Failed to read JSON report: ${p}`)
    console.error(e?.stack || e?.message || String(e))
    // Return null; caller decides whether to fail based on policy
    return null
  }
}

function pushSummary(lines) {
  try {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY
    if (summaryPath) {
      fs.appendFileSync(summaryPath, lines.join('\n') + '\n')
    }
  } catch {
    // Non-fatal
  }
}

function collectFlakyTests(report) {
  const findings = []

  // 1) Prefer explicit stats.flaky if provided
  const stats = report?.stats
  if (stats && typeof stats.flaky === 'number' && stats.flaky > 0) {
    // Still try to gather concrete cases
  }

  // The JSON reporter structure contains nested suites with tests
  const rootSuites = Array.isArray(report?.suites) ? report.suites : []

  function traverseSuite(suite, titlePath = []) {
    const newPath = [...titlePath, suite?.title].filter(Boolean)

    // Tests array can be named 'tests'
    const tests = Array.isArray(suite?.tests) ? suite.tests : []
    for (const t of tests) {
      const testTitle = [...newPath, t?.title].filter(Boolean).join(' > ')
      const isFlaky = detectFlakyTest(t)
      if (isFlaky) {
        findings.push({ title: testTitle })
      }
    }

    // Nested suites
    const children = Array.isArray(suite?.suites) ? suite.suites : []
    for (const child of children) traverseSuite(child, newPath)
  }

  for (const s of rootSuites) traverseSuite(s, [])

  // Fallback: if stats.flaky indicates >0 but no tests collected, synthesize a note
  if (findings.length === 0 && stats && stats.flaky > 0) {
    findings.push({
      title: '(flaky tests detected; details unavailable in report version)',
    })
  }

  return findings
}

function detectFlakyTest(test) {
  // Heuristics across reporter versions
  // 1) Explicit outcome flag
  const outcome = test?.outcome || test?.status
  if (typeof outcome === 'string' && outcome.toLowerCase() === 'flaky') {
    return true
  }
  // 2) Mixed results attempts: some failed, later passed
  const results = Array.isArray(test?.results) ? test.results : []
  if (results.length > 1) {
    let hasFailish = false
    let hasPass = false
    for (const r of results) {
      const st = (r?.status || '').toLowerCase()
      if (st === 'passed') hasPass = true
      else if (st && st !== 'skipped') hasFailish = true
    }
    if (hasFailish && hasPass) return true
  }
  return false
}

function main() {
  const REPORT_PATH = chooseReportPath()
  const report = readJsonSafe(REPORT_PATH)
  if (!report) {
    const lines = []
    lines.push('## Flaky Test Check')
    lines.push(`- Policy: ${POLICY}`)
    lines.push(`- Report: \`${REPORT_PATH}\``)
    lines.push('- Note: JSON report not found. Skipping flaky analysis.')
    console.log(lines.join('\n'))
    pushSummary(lines)
    if (POLICY !== 'warn') {
      return process.exit(1)
    }
    return
  }

  const findings = collectFlakyTests(report)
  const count = findings.length

  const lines = []
  lines.push('## Flaky Test Check')
  lines.push(`- Policy: ${POLICY}`)
  lines.push(`- Report: \`${REPORT_PATH}\``)
  lines.push(`- Flaky Count: ${count}`)

  if (count > 0) {
    lines.push('\n### Flaky Tests')
    for (const f of findings) lines.push(`- ${f.title}`)
  }

  console.log(lines.join('\n'))
  pushSummary(lines)

  if (count > 0 && POLICY !== 'warn') {
    console.error(
      '[flaky-check] Flaky tests detected. Failing the job (policy=fail).',
    )
    process.exit(1)
  }
}

main()
