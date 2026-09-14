import { tinaField } from 'tinacms/dist/react';
import type { Page, PageBlocks } from '@/tina/__generated__/types';
import { Content } from './content';
import { Hero } from './hero';

export const Blocks = (props: Omit<Page, 'id' | '_sys' | '_values'>) => {
  if (!props.blocks) return null;
  return (
    <>
      {props.blocks.map((block, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: blocks have no stable id
        <div key={i} data-tina-field={block ? tinaField(block) : undefined}>
          <Block {...(block as PageBlocks)} />
        </div>
      ))}
    </>
  );
};

const Block = (block: PageBlocks) => {
  switch (block.__typename) {
    case 'PageBlocksHero':
      return <Hero data={block} />;
    case 'PageBlocksContent':
      return <Content data={block} />;
    default:
      return null;
  }
};
