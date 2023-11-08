import { CodeHighlight } from '@mantine/code-highlight';
import {
  Accordion,
  Anchor,
  Badge,
  Box,
  Group,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconX, IconCheck, IconChevronLeft } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useInterval } from '@mantine/hooks';
import { useParams, Link } from 'react-router-dom';
import ms from 'ms';

import {
  JobFrequency,
  JobLastExecutionStatusBadge,
  JobNextExecution,
  JobStatusBadge,
  JobTimezone,
  JobWorkDirectory,
} from '../components/JobDataView';

export function JobPage() {
  const { id } = useParams();
  const [jobData, setJobData] = useState(null);

  async function fetchJobData() {
    const data = await window.api.jobs.get(id);

    if (data) {
      setJobData(data);
    }
  }

  const updateInterval = useInterval(fetchJobData, 1000);

  useEffect(() => {
    fetchJobData();
    updateInterval.start();

    return () => {
      updateInterval.stop();
    };
  }, [id]);

  const backLink = (
    <Anchor component={Link} to="/">
      <Group gap="sm">
        <IconChevronLeft />
        Back to jobs list
      </Group>
    </Anchor>
  );

  if (!jobData) {
    return (
      <>
        {backLink}

        <Skeleton height={32} maw="40%" mt="lg" />

        <Skeleton height={240} mt="md" />

        <Skeleton height={400} mt="md" />
      </>
    );
  }

  return (
    <Box>
      {backLink}

      <Title mt="lg">{jobData?.name}</Title>

      <Paper withBorder p="md" mt="md">
        <Stack>
          <DataDisplay label="Command">
            <CodeHighlight code={jobData?.command} language="bash" copyLabel="Copy job command" />
          </DataDisplay>

          <DataDisplay label="Status">
            <JobStatusBadge status={jobData?.status} />
          </DataDisplay>

          <DataDisplay label="Last execution status">
            <JobLastExecutionStatusBadge lastExecutionStatus={jobData?.lastExecutionStatus} />
          </DataDisplay>

          <DataDisplay label="Frequency">
            <JobFrequency frequency={jobData?.frequency} />
          </DataDisplay>

          <DataDisplay label="Work directory">
            <JobWorkDirectory workDirectory={jobData?.workDirectory} />
          </DataDisplay>

          <DataDisplay label="Timezone">
            <JobTimezone timezone={jobData?.timezone} />
          </DataDisplay>

          <DataDisplay label="Auto start">
            <Text>{jobData?.autoStart ? 'Yes' : 'No'}</Text>
          </DataDisplay>

          <DataDisplay label="Max executions after start">
            <Text>{jobData?.maxExecutions ? jobData?.maxExecutions : 'Not set'}</Text>
          </DataDisplay>

          <DataDisplay label="Next execution">
            <JobNextExecution nextExecution={jobData?.nextExecution} />
          </DataDisplay>
        </Stack>
      </Paper>

      <Paper withBorder p="md" mt="md">
        <Group>
          <Title order={3}>Executions</Title>
          <Badge size="lg">{jobData?.executions?.length}</Badge>
        </Group>

        {jobData?.executions?.length > 0 ? (
          <Paper withBorder mt="sm">
            <ScrollArea.Autosize mah="60vh">
              <Accordion>
                {jobData?.executions?.map((execution) => (
                  <Accordion.Item key={execution.startedAt} value={String(execution.startedAt)}>
                    <Accordion.Control
                      icon={execution.failed ? <IconX color="red" /> : <IconCheck color="green" />}
                    >
                      {new Date(execution.startedAt).toLocaleString()}
                    </Accordion.Control>

                    <Accordion.Panel>
                      <Stack>
                        <Text fw="bold">
                          Started at: {new Date(execution.startedAt).toLocaleString()}
                        </Text>

                        <Text fw="bold">
                          Finished at: {new Date(execution.finishedAt).toLocaleString()}
                        </Text>

                        <Text fw="bold">
                          Duration: {ms(execution.finishedAt - execution.startedAt)}
                        </Text>

                        <CodeHighlight
                          code={JSON.stringify(execution, null, 2)}
                          copyLabel="Copy execution metadata"
                        />
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </ScrollArea.Autosize>
          </Paper>
        ) : (
          <Text mt="sm">No executions yet</Text>
        )}
      </Paper>
    </Box>
  );
}

function DataDisplay({ label, children }) {
  return (
    <Stack gap={4}>
      <Text fw="bold">{label}</Text>
      {children}
    </Stack>
  );
}
