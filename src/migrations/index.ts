import * as migration_20261003_220012_baseline from './20261003_220012_baseline';
import * as migration_20261003_220125_darsha_home from './20261003_220125_darsha_home';

export const migrations = [
  {
    up: migration_20261003_220012_baseline.up,
    down: migration_20261003_220012_baseline.down,
    name: '20261003_220012_baseline'
  },
  {
    up: migration_20261003_220125_darsha_home.up,
    down: migration_20261003_220125_darsha_home.down,
    name: '20261003_220125_darsha_home'
  },
];
