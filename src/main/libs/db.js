import PouchDb from 'pouchdb';

export class Database extends PouchDb {
  constructor(name) {
    super(name);
  }

  async createJob({ name, command, frequency, maxExecutions, workDirectory, timezone, autoStart }) {
    return await this.put({
      _id: this.generateId(),
      name,
      command,
      frequency,
      maxExecutions,
      workDirectory,
      timezone,
      autoStart,
      executions: [],
    });
  }

  async createJobExecution(jobId, { failed, startedAt, finishedAt, ...data }) {
    const job = await this.get(jobId);

    if (!job) {
      return null;
    }

    job.executions.push({
      failed,
      startedAt,
      finishedAt,
      ...data,
    });

    return await this.put(job);
  }

  async getJob(id) {
    const job = await this.get(id);

    return job ? { id: job._id, ...job } : null;
  }

  async getJobs() {
    const jobs = await this.allDocs({ include_docs: true });

    return jobs.rows.map((row) => ({
      id: row.doc._id,
      ...row.doc,
    }));
  }

  async deleteJob(id) {
    const job = await this.get(id);

    return job ? await this.remove(job) : null;
  }

  async updateJob(
    id,
    { name, command, frequency, maxExecutions, workDirectory, timezone, autoStart } = {}
  ) {
    const job = await this.get(id);

    if (!job) {
      return null;
    }

    const newValues = Object.fromEntries(
      Object.entries({
        name,
        command,
        frequency,
        maxExecutions,
        workDirectory,
        timezone,
        autoStart,
      }).filter(([key, value]) => value !== undefined)
    );

    return await this.put({
      ...job,
      ...newValues,
    });
  }

  generateId() {
    return new Date().getTime().toString();
  }
}
