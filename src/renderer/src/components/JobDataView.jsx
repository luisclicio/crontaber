import { Badge, Code, Text, Tooltip } from '@mantine/core';

import { getCronHelpMessage } from '../utils/cron';

export function JobStatusBadge({ status }) {
  return (
    <Badge
      color={
        status === 'active'
          ? 'blue'
          : status === 'running'
          ? 'green'
          : status === 'paused'
          ? 'gray'
          : 'red'
      }
    >
      {status}
    </Badge>
  );
}

export function JobLastExecutionStatusBadge({ lastExecutionStatus }) {
  return (
    <Badge
      color={
        lastExecutionStatus === 'success'
          ? 'blue'
          : lastExecutionStatus === 'failed'
          ? 'red'
          : 'gray'
      }
    >
      {lastExecutionStatus}
    </Badge>
  );
}

export function JobFrequency({ frequency }) {
  return (
    <Tooltip label={getCronHelpMessage(frequency)} multiline maw={400} withArrow>
      <Code fz="sm" maw="max-content" bg="none" p={0}>
        {frequency}
      </Code>
    </Tooltip>
  );
}

export function JobWorkDirectory({ workDirectory }) {
  return workDirectory ? (
    <Code fz="sm" maw="max-content" bg="none" p={0}>
      {workDirectory}
    </Code>
  ) : (
    <Text>Not set</Text>
  );
}

export function JobTimezone({ timezone }) {
  return timezone ? (
    <Code fz="sm" maw="max-content" bg="none" p={0}>
      {timezone}
    </Code>
  ) : (
    <Text>Not set</Text>
  );
}

export function JobNextExecution({ nextExecution }) {
  return nextExecution ? (
    <Code fz="sm" maw="max-content" bg="none" p={0}>
      {nextExecution?.toLocaleString()}
    </Code>
  ) : (
    <Text>Unknown</Text>
  );
}
