import { JobsService } from '../libs/jobs';
import { jobsDb } from './db';

export const jobsService = new JobsService(jobsDb);
