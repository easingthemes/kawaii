import React from 'react';
import { SITE_NAME, SITE_URL } from './seo';

export const personJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${SITE_URL}/#site`,
  name: SITE_NAME,
  url: SITE_URL,
  description: 'Writes about events, with photos.',
});

type EventInput = {
  date?: string | null;
  title?: string | null;
  place?: string | null;
  text?: string | null;
  link?: string | null;
} | null;

/**
 * Structured data for an events list, so search engines can show the dates.
 *
 * Only entries with both a title and a date are included — schema.org `Event`
 * requires both, and a half-filled record is worse than none. The date is taken
 * from the string as stored rather than through `new Date()`, so it cannot shift
 * a day on the way out.
 */
export const eventsJsonLd = ({ events, path }: { events: EventInput[]; path: string }) => {
  const real = events.filter((event): event is NonNullable<EventInput> => Boolean(event?.title && event?.date));
  if (real.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_URL}${path}#events`,
    itemListElement: real.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Event',
        name: event.title,
        startDate: (event.date as string).slice(0, 10),
        ...(event.place ? { location: { '@type': 'Place', name: event.place } } : {}),
        ...(event.text ? { description: event.text } : {}),
        ...(event.link ? { url: event.link.startsWith('http') ? event.link : `${SITE_URL}${event.link}` } : {}),
      },
    })),
  };
};

/**
 * Renders a JSON-LD block. Server-only — it never needs to hydrate.
 *
 * `<` is escaped so a stray `</script>` in editable content cannot close the tag early.
 */
export const JsonLd = ({ data }: { data: object }) => (
  <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
);
