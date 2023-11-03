import path from 'path';
import { app } from 'electron';

import { Database } from '../libs/db';

export const jobsDb = new Database(path.join(app.getPath('userData'), 'jobs'));
