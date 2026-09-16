'use client';
import React from 'react';
import Image from 'next/image';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { PageBlocksKwGallery } from '../../tina/__generated__/types';

/**
 * A photo grid.
 *
 * Deliberately not a lightbox: a plain responsive grid has no JavaScript to go
 * wrong, works on a phone, and keeps the editor's job to "add photo, write alt
 * text". Photos with a caption get one under the image; photos without stay bare.
 *
 * `sizes` matches the grid so Next only ships the width each slot actually needs —
 * an editor uploading a 4000px phone photo does not turn into a 4000px download.
 */
export const KwGallery = ({ data }: { data: PageBlocksKwGallery }) => {
  const photos = data.photos?.filter((photo) => photo?.src) ?? [];
  const columns = data.columns === '2' ? 'sm:grid-cols-2' : data.columns === '4' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';

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

        {photos.length === 0 ? (
          <p className='kw-prose mt-8'>Noch keine Fotos.</p>
        ) : (
          <ul className={`mt-10 grid grid-cols-1 gap-6 ${columns}`}>
            {photos.map((photo, i) => (
              <li key={`${photo?.src}-${i}`}>
                <figure>
                  <div className='relative aspect-[4/3] overflow-hidden rounded-xl border kw-rule bg-[var(--kw-card)]'>
                    <Image
                      src={photo?.src as string}
                      alt={photo?.alt || ''}
                      fill
                      sizes='(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw'
                      className='object-cover'
                      data-tina-field={tinaField(photo, 'src')}
                    />
                  </div>
                  {photo?.caption && (
                    <figcaption className='kw-prose mt-3 text-sm' data-tina-field={tinaField(photo, 'caption')}>
                      {photo.caption}
                    </figcaption>
                  )}
                </figure>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export const kwGalleryBlockSchema: Template = {
  name: 'kwGallery',
  label: 'Fotogalerie',
  ui: {
    defaultItem: { label: 'Fotos', heading: 'Fotos', columns: '3' },
    itemProps: (item) => ({ label: item?.heading || 'Fotogalerie' }),
  },
  fields: [
    { type: 'string', label: 'Kleine Zeile über der Überschrift', name: 'label' },
    { type: 'string', label: 'Überschrift', name: 'heading' },
    {
      type: 'string',
      label: 'Fotos pro Reihe (auf großem Bildschirm)',
      name: 'columns',
      options: [
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
      ],
    },
    {
      type: 'object',
      label: 'Fotos',
      name: 'photos',
      list: true,
      ui: {
        itemProps: (item) => ({ label: item?.caption || item?.alt || 'Foto' }),
      },
      fields: [
        { type: 'image', label: 'Foto', name: 'src' },
        {
          type: 'string',
          label: 'Was ist auf dem Foto?',
          name: 'alt',
          description: 'In ein paar Worten. Wird Leuten vorgelesen, die das Foto nicht sehen können.',
        },
        { type: 'string', label: 'Bildunterschrift (optional)', name: 'caption' },
      ],
    },
  ],
};
