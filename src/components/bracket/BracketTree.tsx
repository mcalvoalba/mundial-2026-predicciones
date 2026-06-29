'use client'

import { useState, useCallback } from 'react'
import type { Match, DraftPrediction, Round } from '@/lib/types'
import { ROUND_LABELS, ROUND_ORDER } from '@/lib/types'
import { MatchCard } from './MatchCard'
import { PredictionForm } from '@/components/predictions/PredictionForm'
import { updateDraftAndPropagate, createEmptyDraft, countCompletedPredictions, isDraftComplete } from '@/lib/bracket'

interface BracketTreeProps {
  matches: Match[]
  draft: Map<number, DraftPrediction>
  mode: 'edit' | 'view'
  onDraftChange?: (draft: Map<number, DraftPrediction>) => void
}

const ROUND_SEQUENCE: Round[] = ['R32', 'R16', 'QF', 'SF', 'FINAL']
const THIRD_PLACE: Round[] = ['3RD']

export function BracketTree({ matches, draft, mode, onDraftChange }: BracketTreeProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  const handleMatchClick = useCallback((match: Match) => {
    if (mode !== 'edit') return
    setSelectedMatch(match)
  }, [mode])

  const handleSave = useCallback((updatedDraft: DraftPrediction) => {
    if (!selectedMatch || !onDraftChange) return
    const newDraft = updateDraftAndPropagate(draft, matches, selectedMatch.id, updatedDraft)
    onDraftChange(newDraft)
    setSelectedMatch(null)
  }, [selectedMatch, draft, matches, onDraftChange])

  function getMatchesForRound(round: Round): Match[] {
    return matches
      .filter((m) => m.round === round)
      .sort((a, b) => a.match_number - b.match_number)
  }

  // Only count matches that aren't already played (locked = no prediction needed)
  const playableMatches = matches.filter((m) => !m.result_locked)
  const totalMatches = playableMatches.length
  const completed = countCompletedPredictions(draft, playableMatches)

  return (
    <div className="flex flex-col">
      {/* Progress bar */}
      {mode === 'edit' && (
        <div className="px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Partidos rellenados</span>
            <span className="text-xs font-semibold">{completed}/{totalMatches}</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 rounded-full transition-all duration-300"
              style={{ width: totalMatches > 0 ? `${(completed / totalMatches) * 100}%` : '0%' }}
            />
          </div>
        </div>
      )}

      {/* Main bracket */}
      <div className="overflow-x-auto">
        <div className="flex gap-6 p-4 pb-2 min-w-max">
          {ROUND_SEQUENCE.map((round) => {
            const roundMatches = getMatchesForRound(round)
            if (roundMatches.length === 0) return null
            return (
              <RoundColumn
                key={round}
                round={round}
                matches={roundMatches}
                draft={draft}
                mode={mode}
                onMatchClick={handleMatchClick}
              />
            )
          })}
        </div>

        {/* 3rd place match (separate row) */}
        {getMatchesForRound('3RD').length > 0 && (
          <div className="px-4 pb-4">
            <div className="border-t border-dashed border-border pt-3">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                {ROUND_LABELS['3RD']}
              </p>
              <div className="flex gap-3">
                {getMatchesForRound('3RD').map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    draft={draft.get(match.id)}
                    mode={mode}
                    onClick={() => handleMatchClick(match)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prediction form sheet */}
      {selectedMatch && (
        <PredictionForm
          match={selectedMatch}
          draft={draft.get(selectedMatch.id) ?? createEmptyDraft(selectedMatch)}
          open={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function RoundColumn({
  round,
  matches,
  draft,
  mode,
  onMatchClick,
}: {
  round: Round
  matches: Match[]
  draft: Map<number, DraftPrediction>
  mode: 'edit' | 'view'
  onMatchClick: (match: Match) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground text-center px-2">
        {ROUND_LABELS[round]}
      </h3>
      <div className={`flex flex-col gap-3 justify-around`} style={{ minHeight: `${Math.max(matches.length * 80, 80)}px` }}>
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            draft={draft.get(match.id)}
            mode={mode}
            onClick={() => onMatchClick(match)}
          />
        ))}
      </div>
    </div>
  )
}
