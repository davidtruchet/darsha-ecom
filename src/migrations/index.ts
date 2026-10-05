import * as migration_services_white from './20261005_005400_darsha_services_white';
import * as migration_20261003_220012_baseline from './20261003_220012_baseline';
import * as migration_20261003_220125_darsha_home from './20261003_220125_darsha_home';
import * as migration_20261004_012330_darsha_services from './20261004_012330_darsha_services';
import * as migration_20261005_005229_darsha_services_colors from './20261005_005229_darsha_services_colors';

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
    name: '20261005_005229_darsha_services_colors'
  },
  { up: migration_services_white.up, down: migration_services_white.down, name: '20261005_005400_darsha_services_white' },
];
