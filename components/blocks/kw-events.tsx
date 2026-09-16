'use client';
import React from 'react';
import Link from 'next/link';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { PageBlocksKwEvents } from '../../tina/__generated__/types';
import { formatDate } from '@/lib/format-date';

/** Sort key. Undated entries sink to the bottom either way rather than jumping to the top. */
function sortKey(value?: string | null): string {
  return value || '9999';
}

/**
 * A list of events — what is coming up, or what has been covered.
 *
 * Ordering is an editor choice rather than something computed from "now": an
 * upcoming-events page wants the soonest at the top, an archive of covered events
 * wants the most recent. Nothing here depends on the current date, so the page
 * renders the same on the server and in the browser.
 */
export const KwEvents = ({ data }: { data: PageBlocksKwEvents }) => {
  const events = [...(data.events ?? [])].sort((a, b) => {
    const compared = sortKey(a?.date).localeCompare(sortKey(b?.date));
    return data.order === 'newest' ? -compared : compared;
  });

  return (
    <section className='border-b kw-rule'>
      <div className='mx-auto max-w-5xl px-6 py-20 sm:py-28'>
        {data.label && (
          <p className='kw-mono' data-tina-field={tinaField(data, 'label')}>
            {data.label}
          </p>
        )}
        {data.heading && (
          <h2 className='kw-display mt-3 text-[clamp(1.9rem,4vw,3rem)] text-[var(--kw-ink)]' data-tina-field={tinaField(data, 'heading')}>
            {data.heading}
          </h2>
        )}

        {events.length === 0 ? (
          <p className='kw-prose mt-8'>Noch nichts eingetragen.</p>
        ) : (
          <ul className='mt-10 grid gap-4'>
            {events.map((event, i) => (
              <li key={`${event?.title}-${i}`} className='rounded-xl border kw-rule bg-[var(--kw-card)] p-5 sm:p-6'>
                <div className='flex flex-wrap items-baseline gap-x-4 gap-y-1'>
                  <p className='kw-mono text-[var(--kw-accent)]' data-tina-field={tinaField(event, 'date')}>
                    {formatDate(event?.date)}
                  </p>
                  {event?.place && (
                    <p className='kw-mono' data-tina-field={tinaField(event, 'place')}>
                      {event.place}
                    </p>
                  )}
                </div>

                {event?.title && (
                  <h3 className='kw-display mt-2 text-2xl text-[var(--kw-ink)]' data-tina-field={tinaField(event, 'title')}>
                    {event.title}
                  </h3>
                )}

                {event?.text && (
                  <p className='kw-prose mt-2 max-w-2xl' data-tina-field={tinaField(event, 'text')}>
                    {event.text}
                  </p>
                )}

                {event?.link && (
                  <Link
                    href={event.link}
                    className='kw-mono mt-4 inline-block border-b border-[var(--kw-rule)] pb-1 text-[var(--kw-accent)] transition-colors hover:border-[var(--kw-accent)] hover:text-[var(--kw-ink)]'
                    data-tina-field={tinaField(event, 'linkLabel')}
                  >
                    {event.linkLabel || 'Mehr'} →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export const kwEventsBlockSchema: Template = {
  name: 'kwEvents',
  label: 'Terminliste',
  ui: {
    defaultItem: { label: 'Termine', heading: 'Demnächst', order: 'soonest' },
    itemProps: (item) => ({ label: item?.heading || 'Terminliste' }),
  },
  fields: [
    { type: 'string', label: 'Kleine Zeile über der Überschrift', name: 'label' },
    { type: 'string', label: 'Überschrift', name: 'heading' },
    {
      type: 'string',
      label: 'Reihenfolge',
      name: 'order',
      description: 'Nächster Termin zuerst für Sachen, die noch kommen. Neuester zuerst für Sachen, die vorbei sind.',
      options: [
        { label: 'Nächster zuerst', value: 'soonest' },
        { label: 'Neuester zuerst', value: 'newest' },
      ],
    },
    {
      type: 'object',
      label: 'Termine',
      name: 'events',
      list: true,
      ui: {
        itemProps: (item) => ({ label: [item?.date?.slice(0, 10), item?.title].filter(Boolean).join(' — ') }),
      },
      fields: [
        { type: 'datetime', label: 'Datum', name: 'date', ui: { dateFormat: 'D MMMM YYYY' } },
        { type: 'string', label: 'Titel', name: 'title' },
        { type: 'string', label: 'Ort', name: 'place' },
        { type: 'string', label: 'Beschreibung', name: 'text', ui: { component: 'textarea' } },
        { type: 'string', label: 'Link (optional)', name: 'link' },
        { type: 'string', label: 'Text auf dem Link', name: 'linkLabel', description: 'Steht auf dem Link. Standard: "Mehr".' },
      ],
    },
  ],
};
