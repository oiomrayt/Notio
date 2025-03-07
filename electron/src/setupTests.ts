import { beforeAll, afterAll, jest } from '@jest/globals';

// Мок для electron
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(),
    on: jest.fn(),
    quit: jest.fn(),
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadURL: jest.fn(),
    on: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    close: jest.fn(),
  })),
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
  },
}));

// Очистка всех моков после каждого теста
afterAll(() => {
  jest.clearAllMocks();
});
