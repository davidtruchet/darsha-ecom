import { DarshaShopIntroBlock, DarshaShopPromotionBlock } from '@/blocks/DarshaShop/Component'
import { DarshaProductCatalogBlock, type CatalogSearchParams } from '@/blocks/DarshaShop/Catalog'
import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { CarouselBlock } from '@/blocks/Carousel/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { ThreeItemGridBlock } from '@/blocks/ThreeItemGrid/Component'
import {
  DarshaCardsBlock,
  DarshaContactBlock,
  DarshaHeroBlock,
  DarshaImageTextBlock,
  DarshaTestimonialsBlock,
} from '@/blocks/Darsha/Component'
import { DarshaBookingCTABlock } from '@/blocks/Darsha/BookingCTA'
import { DarshaServicesIntroBlock } from '@/blocks/Darsha/ServicesIntro'
import { DarshaTreatmentsBlock } from '@/blocks/Darsha/Treatments'
import { toKebabCase } from '@/utilities/toKebabCase'
import React, { Fragment } from 'react'

import type { Page } from '../payload-types'

const blockComponents = {
  darshaShopIntro: DarshaShopIntroBlock,
  darshaShopPromotion: DarshaShopPromotionBlock,
  darshaProductCatalog: DarshaProductCatalogBlock,
  archive: ArchiveBlock,
  banner: BannerBlock,
  carousel: CarouselBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  threeItemGrid: ThreeItemGridBlock,
  darshaHero: DarshaHeroBlock,
  darshaCards: DarshaCardsBlock,
  darshaImageText: DarshaImageTextBlock,
  darshaTestimonials: DarshaTestimonialsBlock,
  darshaContact: DarshaContactBlock,
  darshaServicesIntro: DarshaServicesIntroBlock,
  darshaTreatments: DarshaTreatmentsBlock,
  darshaBookingCTA: DarshaBookingCTABlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
  catalogSearchParams?: CatalogSearchParams
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockName, blockType } = block

          if (block.blockType === 'darshaProductCatalog') {
            return (
              <DarshaProductCatalogBlock
                key={index}
                {...block}
                catalogSearchParams={props.catalogSearchParams}
              />
            )
          }

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <div className={blockType.startsWith('darsha') ? undefined : 'my-16'} key={index}>
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore - weird type mismatch here */}
                  <Block id={toKebabCase(blockName!)} {...block} />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
