import { useEffect, useState } from 'react';

import { getCronHelpMessage } from '../utils/cron';

export function useCronHelpMessage(expression) {
  const [helpMessage, setHelpMessage] = useState('');

  useEffect(() => {
    setHelpMessage(getCronHelpMessage(expression));
  }, [expression]);

  return helpMessage;
}
