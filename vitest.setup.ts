import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// 扩展 Vitest 的断言
expect.extend(matchers);

// 每个测试后清理 DOM
afterEach(() => {
	cleanup();
});

// 模拟 console.warn 用于测试
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
