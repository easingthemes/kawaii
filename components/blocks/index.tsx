import { tinaField } from 'tinacms/dist/react';
import { Page, PageBlocks } from '../../tina/__generated__/types';
import { Content } from './content';
import { Video } from './video';
import { CallToAction } from './call-to-action';
import { KwHero } from './kw-hero';
import { KwProse } from './kw-prose';
import { KwTimeline } from './kw-timeline';
import { KwGallery } from './kw-gallery';
import { KwEvents } from './kw-events';

export const Blocks = (props: Omit<Page, 'id' | '_sys' | '_values'>) => {
  if (!props.blocks) return null;
  return (
    <>
      {props.blocks.map(function (block, i) {
        return (
          <div key={i} data-tina-field={tinaField(block)}>
            <Block {...block} />
          </div>
        );
      })}
    </>
  );
};

const Block = (block: PageBlocks) => {
  switch (block.__typename) {
    case 'PageBlocksKwHero':
      return <KwHero data={block} />;
    case 'PageBlocksKwProse':
      return <KwProse data={block} />;
    case 'PageBlocksKwGallery':
      return <KwGallery data={block} />;
    case 'PageBlocksKwEvents':
      return <KwEvents data={block} />;
    case 'PageBlocksKwTimeline':
      return <KwTimeline data={block} />;
    case 'PageBlocksCta':
      return <CallToAction data={block} />;
    case 'PageBlocksContent':
      return <Content data={block} />;
    case 'PageBlocksVideo':
      return <Video data={block} />;
    default:
      return null;
  }
};
