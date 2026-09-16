'use client';
import { Heart } from 'lucide-react';
import React from 'react';

const MAX = 10;

/** Clamps whatever the editor typed into 1–10, so a stray 42 cannot draw 42 hearts. */
function clamp(value?: number | null): number | null {
  if (value === null || value === undefined) return null;
  const rounded = Math.round(value);
  if (Number.isNaN(rounded)) return null;
  return Math.min(MAX, Math.max(1, rounded));
}

/**
 * Kaja's 1–10 rating: a row of ten hearts, the number, and why she gave it.
 *
 * Nothing here reads the current date or any other browser-only value — the row
 * renders the same on the server and in the browser.
 */
export const KwRating = ({ value, why, className = '' }: { value?: number | null; why?: string | null; className?: string }) => {
  const score = clamp(value);
  if (score === null) return null;

  return (
    <div className={`rounded-2xl border kw-rule bg-[var(--kw-card)] px-5 py-4 ${className}`}>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
        <p className='kw-mono text-[var(--kw-ink-soft)]'>Bewertung</p>
        <div className='flex items-center gap-0.5' role='img' aria-label={`${score} von ${MAX} Herzen`}>
          {Array.from({ length: MAX }, (_, i) => (
            <Heart
              key={i}
              aria-hidden='true'
              className={
                i < score
                  ? 'size-4 fill-[var(--kw-accent)] text-[var(--kw-accent)] sm:size-5'
                  : 'size-4 fill-transparent text-[var(--kw-accent-soft)] sm:size-5'
              }
            />
          ))}
        </div>
        <p className='kw-display text-2xl text-[var(--kw-accent)]'>
          {score}
          <span className='text-[var(--kw-ink-soft)]'>/{MAX}</span>
        </p>
      </div>
      {why && <p className='kw-prose mt-2'>{why}</p>}
    </div>
  );
};

/** The compact version for the blog list — just the number and a heart. */
export const KwRatingBadge = ({ value }: { value?: number | null }) => {
  const score = clamp(value);
  if (score === null) return null;

  return (
    <span
      className='kw-mono inline-flex items-center gap-1 rounded-full border kw-rule bg-[var(--kw-card)] px-3 py-1 text-[var(--kw-accent)]'
      aria-label={`Bewertung ${score} von ${MAX}`}
    >
      <Heart aria-hidden='true' className='size-3.5 fill-[var(--kw-accent)] text-[var(--kw-accent)]' />
      {score}/{MAX}
    </span>
  );
};
