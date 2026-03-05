import { useEffect, useMemo, useRef, useState } from 'react'
import type { DicePool } from '../dice/types'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { computeIntel, makeIntelCacheKey } from '../odds/intel'

interface OddsIntelPanelProps {
  pool: DicePool
}

type DecryptStage = 'idle' | 'stage1' | 'stage2' | 'granted'

const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`
const formatMean = (value: number): string => value.toFixed(2)

const formatMostLikelyOutcome = (
  deltaSuccess: number,
  deltaAdvantage: number,
  probability: number,
  hasTriumph: boolean,
  hasDespair: boolean,
): string => {
  const successPart = `${deltaSuccess >= 0 ? '+' : ''}${deltaSuccess} Success`
  const advantagePart = `${deltaAdvantage >= 0 ? '+' : ''}${deltaAdvantage} Advantage`
  const tags: string[] = []

  if (hasTriumph) tags.push('TRI')
  if (hasDespair) tags.push('DES')

  const tagSuffix = tags.length > 0 ? `, ${tags.join(' + ')}` : ''
  return `${successPart}, ${advantagePart}${tagSuffix} (${(probability * 100).toFixed(1)}%)`
}

export const OddsIntelPanel = ({ pool }: OddsIntelPanelProps) => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [isDecrypted, setIsDecrypted] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [stage, setStage] = useState<DecryptStage>('idle')
  const timeoutIdsRef = useRef<number[]>([])

  const intel = useMemo(
    () => computeIntel(pool, { includeAdvanced: isDecrypted }),
    [isDecrypted, pool],
  )

  const poolKey = useMemo(() => makeIntelCacheKey(pool), [pool])

  const terminalLines = useMemo(() => {
    if (stage === 'stage1') {
      return ['> ACCESSING RESTRICTED TACTICAL MODEL...']
    }

    if (stage === 'stage2') {
      return [
        '> ACCESSING RESTRICTED TACTICAL MODEL...',
        '> DECRYPTING ANALYSIS MODULE...',
      ]
    }

    if (stage === 'granted') {
      return ['> CLEARANCE GRANTED // ADVANCED INTEL UNLOCKED']
    }

    return []
  }, [stage])

  const clearTimers = (): void => {
    for (const timeoutId of timeoutIdsRef.current) {
      window.clearTimeout(timeoutId)
    }

    timeoutIdsRef.current = []
  }

  useEffect(
    () => () => {
      clearTimers()
    },
    [],
  )

  const startDecryptSequence = (): void => {
    if (isDecrypted || isDecrypting) {
      return
    }

    clearTimers()

    if (prefersReducedMotion) {
      setStage('granted')
      setIsDecrypting(false)
      setIsDecrypted(true)
      return
    }

    setIsDecrypting(true)
    setStage('stage1')

    timeoutIdsRef.current.push(
      window.setTimeout(() => {
        setStage('stage2')
      }, 250),
    )

    timeoutIdsRef.current.push(
      window.setTimeout(() => {
        setStage('granted')
      }, 600),
    )

    timeoutIdsRef.current.push(
      window.setTimeout(() => {
        setIsDecrypting(false)
        setIsDecrypted(true)
      }, 800),
    )
  }

  return (
    <section className="panel intel-panel" aria-label="Odds and intelligence">
      <header className="intel-header">
        <div>
          <p className="intel-kicker">CLASSIFIED INTEL // ODDS ESTIMATE</p>
          <h2>ODDS / INTEL</h2>
        </div>
        <div className="intel-badges">
          <span className="intel-lock">{isDecrypted ? 'UNLOCKED' : 'LOCKED'}</span>
          <span className="intel-classified">CLASSIFIED</span>
        </div>
      </header>

      <p className="intel-pool">POOL KEY: {poolKey}</p>

      <div className="intel-decrypt">
        <button
          type="button"
          className="ghost-button intel-command"
          onClick={startDecryptSequence}
          disabled={isDecrypting || isDecrypted}
        >
          {isDecrypted ? 'ADVANCED MODEL ONLINE' : 'Decrypt Full Tactical Model'}
        </button>

        {terminalLines.length > 0 ? (
          <div className={`intel-terminal ${isDecrypting ? 'intel-terminal-active' : ''}`}>
            {terminalLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
      </div>

      <dl className="intel-grid">
        <dt>Chance of Success</dt>
        <dd>{formatPercent(intel.pSuccess)}</dd>

        <dt>Chance of Failure</dt>
        <dd>{formatPercent(intel.pFailure)}</dd>

        <dt>Expected Net Success</dt>
        <dd>{formatMean(intel.expectedNetSuccess)}</dd>

        <dt>Chance of Advantage</dt>
        <dd>{formatPercent(intel.pAdvantage)}</dd>

        <dt>Chance of Threat</dt>
        <dd>{formatPercent(intel.pThreat)}</dd>

        <dt>Expected Net Advantage</dt>
        <dd>{formatMean(intel.expectedNetAdvantage)}</dd>

        <dt>Cinematic Event Likelihood</dt>
        <dd>{formatPercent(intel.pCinematic)}</dd>
      </dl>

      {isDecrypted ? (
        <section className="intel-advanced" aria-label="Advanced analysis">
          <p className="intel-divider">--- ADVANCED ANALYSIS ---</p>
          <h3>CLASSIFIED INTEL // ADVANCED ANALYSIS</h3>
          <dl className="intel-advanced-grid">
            <dt>Dramatic Tension</dt>
            <dd>{formatPercent(intel.pDramaticTension)}</dd>

            <dt>Hero Moment Probability</dt>
            <dd>{formatPercent(intel.pHeroMoment)}</dd>

            <dt>Catastrophic Event Chance</dt>
            <dd>{formatPercent(intel.pCatastrophic)}</dd>

            <dt>Narrative Chaos Index</dt>
            <dd>
              {intel.chaosIndex.toFixed(2)} ({intel.chaosLabel})
            </dd>

            <dt>Strategic Advisory</dt>
            <dd>{intel.advisoryLabel}</dd>
          </dl>

          {intel.destinyConflictDetected ? (
            <p className="intel-warning">⚠ DESTINY CONFLICT DETECTED</p>
          ) : null}

          <p className="intel-most-likely">
            Most Likely Outcome:{' '}
            {formatMostLikelyOutcome(
              intel.mostLikelyOutcome.deltaSuccess,
              intel.mostLikelyOutcome.deltaAdvantage,
              intel.mostLikelyOutcome.probability,
              intel.mostLikelyOutcome.hasTriumph,
              intel.mostLikelyOutcome.hasDespair,
            )}
          </p>
        </section>
      ) : null}

      <p className="intel-footnote">Never tell me the odds.</p>
    </section>
  )
}
