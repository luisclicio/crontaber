import { app, shell, BrowserWindow, Menu, Tray, nativeImage, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';

import { jobsService } from './services/jobs';

import icon from '../../resources/icon.png?asset';

function createWindow() {
  // Create the browser window.
  const window = new BrowserWindow({
    minWidth: 900,
    minHeight: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  window.on('ready-to-show', () => {
    window.show();
    window.maximize();
  });

  window.on('close', (event) => {
    if (!app?.isQuiting) {
      event.preventDefault();
      window.hide();
    }
  });

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}

function createTray(mainWindow) {
  const trayIcon = nativeImage.createFromPath(icon);
  const tray = new Tray(trayIcon);
  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'Crontaber',
      icon: trayIcon,
      click: () => {
        console.log('Crontaber');
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Show',
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Crontaber');
  tray.setContextMenu(trayMenu);

  tray.on('click', () => {
    mainWindow.show();
  });

  return tray;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window, { zoom: true });
  });

  const mainWindow = createWindow();
  const tray = createTray(mainWindow);

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  app.isQuiting = true;
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

jobsService.startJobs();

ipcMain.handle('dialog:get-folder-path', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'showHiddenFiles'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle(
  'job:create',
  async (event, { name, command, workDirectory, frequency, timezone, autoStart }) => {
    try {
      await jobsService.createJob({
        name,
        command,
        workDirectory,
        frequency,
        timezone,
        autoStart,
      });

      return {
        failed: false,
        message: 'Job created successfully',
      };
    } catch (error) {
      console.error(error);

      return {
        failed: true,
        message: error.message,
      };
    }
  }
);

ipcMain.handle('job:list', async () => {
  try {
    const jobsWithStatus = await jobsService.listJobs();

    return {
      failed: false,
      message: 'Jobs fetched successfully',
      data: jobsWithStatus,
    };
  } catch (error) {
    console.error(error);

    return {
      failed: true,
      message: error.message,
      data: null,
    };
  }
});

ipcMain.handle('job:get', async (event, { jobId }) => {
  try {
    return await jobsService.getJob(jobId);
  } catch (error) {
    console.error(error);
    return null;
  }
});

ipcMain.handle('job:delete', async (event, { jobId }) => {
  try {
    await jobsService.deleteJob(jobId);

    return {
      failed: false,
      message: 'Job deleted successfully',
    };
  } catch (error) {
    console.error(error);

    return {
      failed: true,
      message: error.message,
    };
  }
});

ipcMain.handle(
  'job:update',
  async (event, { jobId, name, command, workDirectory, frequency, timezone, autoStart }) => {
    try {
      await jobsService.updateJob(jobId, {
        name,
        command,
        workDirectory,
        frequency,
        timezone,
        autoStart,
      });

      return {
        failed: false,
        message: 'Job updated successfully',
      };
    } catch (error) {
      console.error(error);

      return {
        failed: true,
        message: error.message,
      };
    }
  }
);

ipcMain.handle('job:run', async (event, { jobId }) => {
  try {
    await jobsService.runJob(jobId);

    return {
      failed: false,
      message: 'Job started successfully',
    };
  } catch (error) {
    console.error(error);

    return {
      failed: true,
      message: error.message,
    };
  }
});

ipcMain.handle('job:pause', async (event, { jobId }) => {
  try {
    jobsService.pauseJob(jobId);

    return {
      failed: false,
      message: 'Job paused successfully',
    };
  } catch (error) {
    console.error(error);

    return {
      failed: true,
      message: error.message,
    };
  }
});

ipcMain.handle('job:stop', async (event, { jobId }) => {
  try {
    await jobsService.stopJob(jobId);

    return {
      failed: false,
      message: 'Job stopped successfully',
    };
  } catch (error) {
    console.error(error);

    return {
      failed: true,
      message: error.message,
    };
  }
});
