import '@testing-library/jest-dom';
import { beforeAll, afterAll } from '@jest/globals';

// Подавление предупреждений React 18 в тестах
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning.*not wrapped in act/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
