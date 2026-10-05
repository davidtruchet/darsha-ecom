import * as migration_20261003_220012_baseline from './20261003_220012_baseline'
import * as migration_20261003_220125_darsha_home from './20261003_220125_darsha_home'
import * as migration_20261004_012330_darsha_services from './20261004_012330_darsha_services'
import * as migration_20261005_005229_darsha_services_colors from './20261005_005229_darsha_services_colors'
import * as migration_20261005_005400_darsha_services_white from './20261005_005400_darsha_services_white'
import * as migration_20261005_011812_darsha_uyu from './20261005_011812_darsha_uyu'
import * as migration_20261005_011813_darsha_shop from './20261005_011813_darsha_shop'
import * as migration_20261005_013529_darsha_product_details from './20261005_013529_darsha_product_details'

export const migrations = [
  {
    up: migration_20261003_220012_baseline.up,
    down: migration_20261003_220012_baseline.down,
    name: '20261003_220012_baseline',
  },
  {
    up: migration_20261003_220125_darsha_home.up,
    down: migration_20261003_220125_darsha_home.down,
    name: '20261003_220125_darsha_home',
  },
  {
    up: migration_20261004_012330_darsha_services.up,
    down: migration_20261004_012330_darsha_services.down,
    name: '20261004_012330_darsha_services',
  },
  {
    up: migration_20261005_005229_darsha_services_colors.up,
    down: migration_20261005_005229_darsha_services_colors.down,
    name: '20261005_005229_darsha_services_colors',
  },
  {
    up: migration_20261005_005400_darsha_services_white.up,
    down: migration_20261005_005400_darsha_services_white.down,
    name: '20261005_005400_darsha_services_white',
  },
  {
    up: migration_20261005_011812_darsha_uyu.up,
    down: migration_20261005_011812_darsha_uyu.down,
    name: '20261005_011812_darsha_uyu',
  },
  {
    up: migration_20261005_011813_darsha_shop.up,
    down: migration_20261005_011813_darsha_shop.down,
    name: '20261005_011813_darsha_shop',
  },
  {
    up: migration_20261005_013529_darsha_product_details.up,
    down: migration_20261005_013529_darsha_product_details.down,
    name: '20261005_013529_darsha_product_details',
  },
]
