import { Cron } from 'croner';
import cronstrue from 'cronstrue';

const nicknames = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@hourly': '0 * * * *',
};

export function getCronHelpMessage(expression) {
  try {
    Cron(expression);

    if (nicknames[expression]) {
      expression = nicknames[expression];
    }

    return cronstrue.toString(expression, {
      use24HourTimeFormat: true,
      throwExceptionOnParseError: false,
    });
  } catch (error) {
    return error.message;
  }
}
