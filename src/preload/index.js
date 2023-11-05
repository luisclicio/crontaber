import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
  jobs: {
    async create({ name, command, workDirectory, frequency, timezone, autoStart }) {
      return await ipcRenderer.invoke('job:create', {
        name,
        command,
        workDirectory,
        frequency,
        timezone,
        autoStart,
      });
    },

    async list() {
      return await ipcRenderer.invoke('job:list');
    },

    async get(jobId) {
      return await ipcRenderer.invoke('job:get', { jobId });
    },

    async delete(jobId) {
      return await ipcRenderer.invoke('job:delete', { jobId });
    },

    async update(jobId, { name, command, workDirectory, frequency, timezone, autoStart }) {
      return await ipcRenderer.invoke('job:update', {
        jobId,
        name,
        command,
        workDirectory,
        frequency,
        timezone,
        autoStart,
      });
    },

    async run(jobId) {
      return await ipcRenderer.invoke('job:run', { jobId });
    },

    async pause(jobId) {
      return await ipcRenderer.invoke('job:pause', { jobId });
    },

    async stop(jobId) {
      return await ipcRenderer.invoke('job:stop', { jobId });
    },
  },

  dialog: {
    async getFolderPath() {
      return await ipcRenderer.invoke('dialog:get-folder-path');
    },
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
}
