import PouchDb from 'pouchdb';

export class Database extends PouchDb {
  constructor(name) {
    super(name);
  }

  async createJob(data) {
    return await this.put({
      _id: this.generateId(),
      executions: [],
      ...data
    });
  }

  async createExecution(jobId, data) {
    const job = await this.get(jobId);
    job.executions.push(data);
    return await this.put(job);
  }

  generateId() {
    return new Date().getTime().toString();
  }
}
