import croner from 'croner';

import { executor } from '../utils/process';

/**
 * @typedef {import('../libs/db').Database} Database
 */

export class JobsService {
  /**
   * @param {Database} jobsDb
   */
  constructor(jobsDb) {
    this._jobsDb = jobsDb;
  }

  get scheduledJobs() {
    return croner.scheduledJobs;
  }

  findScheduledJob(jobId) {
    return this.scheduledJobs.find((scheduledJob) => scheduledJob.name === jobId);
  }

  async startJobs() {
    const jobs = await this._jobsDb.getJobs();

    jobs.forEach((job) => {
      if (job.autoStart) {
        this.setupJob(job);
      }
    });
  }

  setupJob({ id, command, frequency, workDirectory, maxExecutions, timezone }) {
    croner.Cron(
      frequency,
      {
        name: id,
        maxRuns: maxExecutions ? maxExecutions : undefined,
        timezone: timezone ? timezone : undefined,
      },
      async () => {
        const startedAt = new Date().getTime();
        const result = await executor(command, {
          cwd: workDirectory ? workDirectory : undefined,
        });

        await this._jobsDb.createJobExecution(id, {
          ...result,
          startedAt,
          finishedAt: new Date().getTime(),
        });
      }
    );
  }

  async createJob({ name, command, frequency, maxExecutions, workDirectory, timezone, autoStart }) {
    const job = await this._jobsDb.createJob({
      name,
      command,
      frequency,
      maxExecutions,
      workDirectory,
      timezone,
      autoStart,
    });

    if (autoStart) {
      this.setupJob({
        id: job.id,
        name,
        command,
        frequency,
        maxExecutions,
        workDirectory,
        timezone,
        autoStart,
      });
    }
  }

  async runJob(jobId) {
    const cronJob = this.findScheduledJob(jobId);

    if (cronJob) {
      cronJob.resume();
    } else {
      const job = await this._jobsDb.getJob(jobId);

      if (job) {
        this.setupJob(job);
      }
    }
  }

  pauseJob(jobId) {
    const cronJob = this.findScheduledJob(jobId);

    if (cronJob) {
      cronJob.pause();
    }
  }

  async stopJob(jobId) {
    this._stopJob(jobId);
    await this._jobsDb.updateJob(jobId, { autoStart: false });
  }

  async deleteJob(jobId) {
    this._stopJob(jobId);
    await this._jobsDb.deleteJob(jobId);
  }

  async updateJob(
    jobId,
    { name, command, frequency, maxExecutions, workDirectory, timezone, autoStart }
  ) {
    this._stopJob(jobId);

    await this._jobsDb.updateJob(jobId, {
      name,
      command,
      frequency,
      maxExecutions,
      workDirectory,
      timezone,
      autoStart,
    });

    if (autoStart) {
      this.setupJob({
        id: jobId,
        name,
        command,
        frequency,
        maxExecutions,
        workDirectory,
        timezone,
        autoStart,
      });
    }
  }

  _stopJob(jobId) {
    const cronJob = this.findScheduledJob(jobId);

    if (cronJob) {
      cronJob.stop();
    }
  }

  async listJobs() {
    const jobs = await this._jobsDb.getJobs();

    return jobs.map((job) => this._fillJobWithScheduleData(job));
  }

  async getJob(jobId) {
    const job = await this._jobsDb.getJob(jobId);

    return job ? this._fillJobWithScheduleData(job) : null;
  }

  _fillJobWithScheduleData(job) {
    const cronJob = this.scheduledJobs.find((scheduledJob) => scheduledJob.name === job.id);
    const status =
      !cronJob || cronJob.isStopped()
        ? 'stopped'
        : !cronJob.isRunning()
        ? 'paused'
        : cronJob.isBusy()
        ? 'running'
        : 'active';
    const lastExecution = job?.executions?.length > 0 ? job.executions.at(-1) : null;

    return {
      ...job,
      status,
      lastExecutionStatus: !lastExecution ? 'never' : lastExecution.failed ? 'failed' : 'success',
      nextExecution: status === 'stopped' || status === 'paused' ? null : cronJob?.nextRun(),
    };
  }
}
