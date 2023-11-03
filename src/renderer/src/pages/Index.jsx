import { InlineCodeHighlight } from '@mantine/code-highlight';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Menu,
  Modal,
  Select,
  Stack,
  Table,
  TextInput,
  Textarea,
  Title,
  Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
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
  IconHelp
} from '@tabler/icons-react';
import { isNotEmpty, useForm } from '@mantine/form';
import { Cron } from 'croner';

import { timezones } from '../utils/timezones';
import { useCronHelpMessage } from '../hooks/cron';

export function IndexPage() {
  const [createDialogOpened, createDialogHandler] = useDisclosure(false);

  return (
    <Box>
      <Title>Cron Jobs</Title>

      <Group justify="space-between" mt="md">
        <TextInput placeholder="Search jobs by name..." leftSection={<IconSearch />} />
        <Button leftSection={<IconPlus />} onClick={createDialogHandler.open}>
          New Job
        </Button>
      </Group>

      <Table.ScrollContainer mt="md" minWidth={1600} mah="80vh">
        <Box mah="75vh">
          <Table highlightOnHover>
            <Table.Thead pos="sticky" top={0} bg="dark" style={{ zIndex: 1 }}>
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
              {[
                {
                  name: 'Backup database',
                  status: 'Running', // Paused, Active
                  command: 'backup.sh',
                  workDirectory: '/home/user/backups',
                  frequency: '* 10 * * * *',
                  timezone: 'America/New_York',
                  autoStart: true,
                  lastExecutionStatus: 'Success',
                  nextRun: new Date().toLocaleString()
                },
                {
                  name: 'Send email',
                  status: 'Paused', // Paused, Active
                  command: 'send-email.sh',
                  workDirectory: '/home/user/emails',
                  frequency: '* * * * * *',
                  timezone: 'America/New_York',
                  autoStart: false,
                  lastExecutionStatus: 'Failed',
                  nextRun: new Date().toLocaleString()
                },
                {
                  name: 'Generate report',
                  status: 'Active', // Paused, Active
                  command: 'generate-report.sh',
                  workDirectory: null,
                  frequency: '* * * * * *',
                  timezone: 'America/New_York',
                  autoStart: true,
                  lastExecutionStatus: 'Unknown',
                  nextRun: new Date().toLocaleString()
                }
              ].map((job) => (
                <Table.Tr key={job.name}>
                  <Table.Td>{job.name}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        job.status === 'Paused'
                          ? 'gray'
                          : job.status === 'Active'
                          ? 'blue'
                          : 'green'
                      }
                    >
                      {job.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        job.lastExecutionStatus === 'Success'
                          ? 'blue'
                          : job.lastExecutionStatus === 'Failed'
                          ? 'red'
                          : 'gray'
                      }
                    >
                      {job.lastExecutionStatus}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <InlineCodeHighlight language="bash" code={job.command} />
                  </Table.Td>
                  <Table.Td>
                    <InlineCodeHighlight language="txt" code={job?.workDirectory || 'Not set'} />
                  </Table.Td>
                  <Table.Td>
                    <InlineCodeHighlight language="txt" title="Every second" code={job.frequency} />
                  </Table.Td>
                  <Table.Td>
                    <InlineCodeHighlight language="txt" code={job.timezone} />
                  </Table.Td>
                  <Table.Td>
                    <Checkbox checked={job.autoStart} readOnly />
                  </Table.Td>
                  <Table.Td>{job.nextRun}</Table.Td>
                  <Table.Td>
                    <Menu width={200} withArrow shadow="md" position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="light">
                          <IconDots />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconPlayerPlay size={18} />}>Run</Menu.Item>
                        <Menu.Item leftSection={<IconPlayerPause size={18} />}>Pause</Menu.Item>
                        <Menu.Item leftSection={<IconPlayerStop size={18} />}>Stop</Menu.Item>
                        <Menu.Item leftSection={<IconListDetails size={18} />}>
                          View details
                        </Menu.Item>
                        <Menu.Item leftSection={<IconEdit size={18} />}>Edit</Menu.Item>
                        <Menu.Item leftSection={<IconTrash size={18} />} color="red">
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
  const form = useForm({
    initialValues: {
      name: '',
      command: '',
      workDirectory: null,
      frequency: '',
      timezone: null,
      autoStart: false
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
      }
    }
  });
  const frequencyHelpMessage = useCronHelpMessage(form.values.frequency);

  async function handleSubmit(event) {
    form.onSubmit(async (values) => {
      const result = await window.api.jobs.create(values);

      if (result.failed) {
        console.error(result.error);
      } else {
        modalHandler.close();
        form.reset();
      }
    })(event);
  }

  return (
    <Modal
      title="Create Cron Job"
      size="lg"
      styles={(theme) => ({
        title: {
          fontSize: theme.fontSizes.lg,
          fontWeight: 'bold'
        }
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

        <Select
          label="Timezone"
          placeholder="Ex.: America/New_York"
          searchable
          clearable
          data={timezones}
          {...form.getInputProps('timezone')}
        />

        <Checkbox label="Auto start" {...form.getInputProps('autoStart')} />

        <Button type="submit" fullWidth>
          Create job
        </Button>
      </Stack>
    </Modal>
  );
}
