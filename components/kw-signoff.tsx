'use client';
import React from 'react';

/**
 * How Kaja ends every post. Part of the template rather than the text of each
 * post, so it is written once and cannot go missing from a new post.
 */
export const KwSignoff = ({ name }: { name?: string | null }) => (
  <p className='kw-display mt-12 text-center text-2xl text-[var(--kw-accent)]'>
    Eure {name || 'Kawaii Kaja'}
    <span className='mt-1 block text-lg text-[var(--kw-ink-soft)]'>Tschüss! 🎀</span>
  </p>
);
