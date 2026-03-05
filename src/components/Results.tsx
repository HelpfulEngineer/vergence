import { toBlob } from 'html-to-image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { RollDetail } from './RollDetail'
import { SymbolKey } from './SymbolKey'
import type { ResolvedRoll } from '../dice/resolver'
import type { DieRoll, SymbolCode } from '../dice/types'

interface ResultsProps {
  symbols: SymbolCode[]
  rolls: DieRoll[]
  resolved: ResolvedRoll | null
  rolledAt: number | null
  poolSummary: string
}

type ExportStatus = 'idle' | 'copied' | 'downloaded' | 'failed'

const SYMBOL_LABELS: Record<SymbolCode, string> = {
  S: 'S',
  F: 'F',
  A: 'A',
  T: 'T',
  TRI: 'Tri',
  DES: 'Des',
  L: 'L',
  D: 'D',
}

const netClass = (value: number): string => {
  if (value > 0) return 'value-positive'
  if (value < 0) return 'value-negative'
  return 'value-neutral'
}

const formatNet = (value: number): string => (value > 0 ? `+${value}` : `${value}`)

const downloadBlob = (blob: Blob): void => {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = 'vergence-roll.png'
  anchor.click()
  URL.revokeObjectURL(objectUrl)
}

const copyBlobToClipboard = async (blob: Blob): Promise<boolean> => {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    return false
  }

  try {
    const clipboardItem = new ClipboardItem({ 'image/png': blob })
    await navigator.clipboard.write([clipboardItem])
    return true
  } catch {
    return false
  }
}

export const Results = ({ symbols, rolls, resolved, rolledAt, poolSummary }: ResultsProps) => {
  const exportCardRef = useRef<HTMLElement | null>(null)
  const statusTimeoutRef = useRef<number | null>(null)
  const pulseTimeoutRef = useRef<number | null>(null)
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')
  const [showDetail, setShowDetail] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const [pulseActive, setPulseActive] = useState(false)

  const exportMessage = useMemo(() => {
    if (exportStatus === 'copied') return 'Copied!'
    if (exportStatus === 'downloaded') return 'Downloaded!'
    if (exportStatus === 'failed') return 'Export failed'
    return null
  }, [exportStatus])

  useEffect(() => {
    if (!rolledAt) {
      return
    }

    setAnimationKey((previous) => previous + 1)
    setPulseActive(true)

    if (pulseTimeoutRef.current) {
      window.clearTimeout(pulseTimeoutRef.current)
    }

    pulseTimeoutRef.current = window.setTimeout(() => {
      setPulseActive(false)
      pulseTimeoutRef.current = null
    }, 520)
  }, [rolledAt])

  useEffect(
    () => () => {
      if (statusTimeoutRef.current) {
        window.clearTimeout(statusTimeoutRef.current)
      }

      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current)
      }
    },
    [],
  )

  const setTransientStatus = (nextStatus: ExportStatus): void => {
    setExportStatus(nextStatus)

    if (statusTimeoutRef.current) {
      window.clearTimeout(statusTimeoutRef.current)
    }

    statusTimeoutRef.current = window.setTimeout(() => {
      setExportStatus('idle')
      statusTimeoutRef.current = null
    }, 1600)
  }

  const handleExport = async (): Promise<void> => {
    if (!resolved || !exportCardRef.current) {
      return
    }

    try {
      const blob = await toBlob(exportCardRef.current, {
        backgroundColor: '#0a1627',
        pixelRatio: 3,
        cacheBust: true,
      })

      if (!blob) {
        throw new Error('Failed to render export image')
      }

      const copied = await copyBlobToClipboard(blob)

      if (copied) {
        setTransientStatus('copied')
        return
      }

      downloadBlob(blob)
      setTransientStatus('downloaded')
    } catch {
      setTransientStatus('failed')
    }
  }

  return (
    <section className="panel results-panel" aria-label="Roll results">
      <header className="panel-header">
        <h2>Results</h2>
        <div className="results-header-side">
          <p>{rolledAt ? new Date(rolledAt).toLocaleTimeString() : 'Waiting for first roll'}</p>
          <label className="detail-toggle">
            <input
              type="checkbox"
              checked={showDetail}
              onChange={() => setShowDetail((previous) => !previous)}
              disabled={!resolved}
            />
            <span>More Detail</span>
          </label>
          <SymbolKey />
          <button
            type="button"
            className="ghost-button export-button"
            onClick={() => {
              void handleExport()
            }}
            disabled={!resolved}
          >
            Export
          </button>
        </div>
      </header>

      {exportMessage ? <p className="export-feedback">{exportMessage}</p> : null}

      <article
        id="export-card"
        ref={exportCardRef}
        className={`results-export-card ${pulseActive ? 'results-pulse' : ''}`}
      >
        <p className="results-export-title">Vergence Roll Report</p>
        <p className="results-export-pool">{poolSummary}</p>

        {!resolved ? (
          <p className="empty-copy">Roll a pool to see symbols and net results.</p>
        ) : (
          <div key={animationKey} className="results-reveal">
            <p className="outcome-line">{resolved.outcome}</p>

            <div className="chip-wrap">
              {symbols.length > 0 ? (
                symbols.map((symbol, index) => (
                  <span key={`${symbol}-${index}`} className={`symbol-chip symbol-${symbol.toLowerCase()}`}>
                    {SYMBOL_LABELS[symbol]}
                  </span>
                ))
              ) : (
                <span className="empty-chip">No symbols rolled</span>
              )}
            </div>

            <dl className="tally-grid">
              <dt>Net Successes</dt>
              <dd className={netClass(resolved.netSuccess)}>{formatNet(resolved.netSuccess)}</dd>

              <dt>Net Advantages</dt>
              <dd className={netClass(resolved.netAdvantage)}>{formatNet(resolved.netAdvantage)}</dd>

              <dt>Triumph Count</dt>
              <dd>{resolved.totals.triumph}</dd>

              <dt>Despair Count</dt>
              <dd>{resolved.totals.despair}</dd>

              <dt>Light Pips</dt>
              <dd>{resolved.totals.light}</dd>

              <dt>Dark Pips</dt>
              <dd>{resolved.totals.dark}</dd>
            </dl>

            {showDetail ? <RollDetail rolls={rolls} /> : null}
          </div>
        )}
      </article>
    </section>
  )
}
