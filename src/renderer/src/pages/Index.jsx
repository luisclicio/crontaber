import { CodeHighlight } from '@mantine/code-highlight';
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Code,
  Group,
  Menu,
  Modal,
  NumberInput,
  Popover,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure, useInterval } from '@mantine/hooks';
import {
  IconPlayerStop,
  IconEdit,
  IconFolder,
  IconTrash,
  IconPlayerPlay,
  IconDots,
  IconPlus,
  IconSearch,
  IconListDetails,
  IconPlayerPause,
  IconHelp,
} from '@tabler/icons-react';
import { isNotEmpty, useForm } from '@mantine/form';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cron } from 'croner';
import Fuse from 'fuse.js';

import { useCronHelpMessage } from '../hooks/cron';
import {
  JobFrequency,
  JobLastExecutionStatusBadge,
  JobNextExecution,
  JobStatusBadge,
  JobTimezone,
  JobWorkDirectory,
} from '../components/JobDataView';
import { timezones } from '../utils/timezones';

export function IndexPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [createDialogOpened, createDialogHandler] = useDisclosure(false);
  const filteredJobs = useMemo(() => {
    if (search.trim() === '') {
      return jobs;
    }

    const fuse = new Fuse(jobs, {
      keys: ['name', 'command'],
      threshold: 0.3,
    });

    return fuse.search(search.trim()).map((result) => result.item);
  }, [jobs, search]);

  async function fetchJobs() {
    const result = await window.api.jobs.list();

    if (result.failed) {
      console.error(result.error);
    } else {
      setJobs(result.data);
    }
  }

  const updateInterval = useInterval(fetchJobs, 1000);

  useEffect(() => {
    fetchJobs();
    updateInterval.start();

    return () => {
      updateInterval.stop();
    };
  }, []);

  return (
    <Box>
      <Title>Cron Jobs</Title>

      <Group justify="space-between" mt="md">
        <TextInput
          placeholder="Search jobs by name or command..."
          leftSection={<IconSearch />}
          miw={400}
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        <Button leftSection={<IconPlus />} onClick={createDialogHandler.open}>
          New Job
        </Button>
      </Group>

      <Table.ScrollContainer mt="md" minWidth={1600} mah="80vh">
        <Box mah="75vh">
          <Table highlightOnHover>
            <Table.Thead pos="sticky" top={0} style={{ zIndex: 1 }} bg="var(--mantine-color-body)">
              <Table.Tr>
                <Table.Th>Job name</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Last execution status</Table.Th>
                <Table.Th>Command</Table.Th>
                <Table.Th>Work directory</Table.Th>
                <Table.Th>Frequency</Table.Th>
                <Table.Th>Timezone</Table.Th>
                <Table.Th>Auto start</Table.Th>
                <Table.Th>Next execution date</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {filteredJobs.map((job) => (
                <Table.Tr key={job.id}>
                  <Table.Td>{job.name}</Table.Td>

                  <Table.Td>
                    <JobStatusBadge status={job.status} />
                  </Table.Td>

                  <Table.Td>
                    <JobLastExecutionStatusBadge lastExecutionStatus={job.lastExecutionStatus} />
                  </Table.Td>

                  <Table.Td>
                    <Popover withArrow>
                      <Popover.Target>
                        <Box maw={300}>
                          <Text truncate="end" inherit>
                            <Code fz="sm">{job.command}</Code>
                          </Text>
                        </Box>
                      </Popover.Target>
                      <Popover.Dropdown maw={600}>
                        <CodeHighlight
                          code={job.command}
                          language="bash"
                          copyLabel="Copy job command"
                        />
                      </Popover.Dropdown>
                    </Popover>
                  </Table.Td>

                  <Table.Td>
                    <JobWorkDirectory workDirectory={job.workDirectory} />
                  </Table.Td>

                  <Table.Td>
                    <JobFrequency frequency={job.frequency} />
                  </Table.Td>

                  <Table.Td>
                    <JobTimezone timezone={job.timezone} />
                  </Table.Td>

                  <Table.Td>
                    <Checkbox checked={job.autoStart} readOnly />
                  </Table.Td>

                  <Table.Td>
                    <JobNextExecution nextExecution={job.nextExecution} />
                  </Table.Td>

                  <Table.Td>
                    <Menu width={200} withArrow shadow="md" position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="light">
                          <IconDots />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          disabled={job.status === 'running' || job.status === 'active'}
                          leftSection={<IconPlayerPlay size={18} />}
                          onClick={async () => await window.api.jobs.run(job.id)}
                        >
                          Start
                        </Menu.Item>
                        <Menu.Item
                          disabled={job.status === 'stopped' || job.status === 'paused'}
                          leftSection={<IconPlayerPause size={18} />}
                          onClick={async () => await window.api.jobs.pause(job.id)}
                        >
                          Pause
                        </Menu.Item>
                        <Menu.Item
                          disabled={job.status === 'stopped'}
                          leftSection={<IconPlayerStop size={18} />}
                          onClick={async () => await window.api.jobs.stop(job.id)}
                        >
                          Stop
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconListDetails size={18} />}
                          onClick={() => navigate(`/job/${job.id}`)}
                        >
                          View details
                        </Menu.Item>
                        <Menu.Item leftSection={<IconEdit size={18} />}>Edit</Menu.Item>
                        <Menu.Item
                          leftSection={<IconTrash size={18} />}
                          color="red"
                          onClick={async () => await window.api.jobs.delete(job.id)}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      </Table.ScrollContainer>

      <CreateJobDialog opened={createDialogOpened} modalHandler={createDialogHandler} />
    </Box>
  );
}

function CreateJobDialog({ opened = false, modalHandler = { close: () => {} } } = {}) {
  const [sending, setSending] = useState(false);
  const form = useForm({
    initialValues: {
      name: '',
      command: '',
      workDirectory: null,
      frequency: '',
      maxExecutions: Infinity,
      timezone: null,
      autoStart: false,
    },

    validate: {
      name: isNotEmpty('Job name is required'),
      command: isNotEmpty('Command is required'),
      frequency: (value) => {
        try {
          Cron(value);
          return null;
        } catch (error) {
          return error.message;
        }
      },
    },

    transformValues: (values) => ({
      ...values,
      maxExecutions: Number(values.maxExecutions) || Infinity,
    }),
  });
  const frequencyHelpMessage = useCronHelpMessage(form.values.frequency);

  async function handleSubmit(event) {
    setSending(true);
    console.log(form.getTransformedValues());

    form.onSubmit(async (values) => {
      const result = await window.api.jobs.create(values);

      if (result.failed) {
        console.error(result.error);
      } else {
        modalHandler.close();
        form.reset();
      }
    })(event);

    setSending(false);
  }

  return (
    <Modal
      title="Create Cron Job"
      size="lg"
      styles={(theme) => ({
        title: {
          fontSize: theme.fontSizes.lg,
          fontWeight: 'bold',
        },
      })}
      opened={opened}
      onClose={modalHandler.close}
    >
      <Stack component="form" gap="sm" onSubmit={handleSubmit}>
        <TextInput
          label="Job name"
          placeholder="Ex.: Backup database"
          withAsterisk
          {...form.getInputProps('name')}
        />

        <Textarea
          label="Command"
          placeholder="Ex.: backup.sh"
          withAsterisk
          minRows={1}
          autosize
          {...form.getInputProps('command')}
        />

        <TextInput
          label="Frequency"
          placeholder="Ex.: * * * * * *; @hourly; @daily; @weekly; @monthly; @yearly"
          withAsterisk
          rightSection={
            <Tooltip label={frequencyHelpMessage} multiline maw={400} position="top-end" withArrow>
              <IconHelp />
            </Tooltip>
          }
          {...form.getInputProps('frequency')}
        />

        <NumberInput
          label="Max executions after start"
          placeholder="Ex.: 10"
          min={1}
          {...form.getInputProps('maxExecutions')}
        />

        <TextInput
          label="Work directory"
          placeholder="Ex.: /home/user/backups"
          rightSection={
            <ActionIcon
              variant="transparent"
              onClick={async () => {
                const folderPath = await window.api.dialog.getFolderPath();

                if (folderPath) {
                  form.setFieldValue('workDirectory', folderPath);
                }
              }}
            >
              <IconFolder />
            </ActionIcon>
          }
          {...form.getInputProps('workDirectory')}
        />

        <Select
          label="Timezone"
          placeholder="Ex.: America/New_York"
          searchable
          clearable
          data={timezones}
          {...form.getInputProps('timezone')}
        />

        <Checkbox label="Auto start" {...form.getInputProps('autoStart')} />

        <Button type="submit" fullWidth disabled={sending}>
          Create job
        </Button>
      </Stack>
    </Modal>
  );
}
