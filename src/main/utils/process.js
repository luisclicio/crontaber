import { exec } from 'node:child_process';
import util from 'util';

export const execAsync = util.promisify(exec);

export async function executor(command, options) {
  try {
    const result = await execAsync(command, options);

    return {
      failed: false,
      ...result
    };
  } catch (error) {
    return {
      failed: true,
      ...error
    };
  }
}
