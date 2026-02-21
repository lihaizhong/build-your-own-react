import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
	plugins: [react()],

	test: {
		// 测试环境
		environment: 'jsdom',
		globals: true,

		// 覆盖率配置
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			exclude: [
				'node_modules/',
				'dist/',
				'**/*.d.ts',
				'**/*.config.*',
				'**/types/**',
			],
		},

		// 测试文件匹配模式
		include: ['packages/**/*.{test,spec}.{ts,tsx}'],
		exclude: ['node_modules', 'dist'],

		// 测试设置文件
		setupFiles: ['./vitest.setup.ts'],
	},

	// 路径别名（与 vite.config.ts 保持一致）
	resolve: {
		alias: {
			'@': resolve(__dirname, 'packages'),
			'lihzsky-react': resolve(__dirname, 'packages/react/index.ts'),
			'lihzsky-react-dom': resolve(
				__dirname,
				'packages/react-dom/index.ts',
			),
			'lihzsky-react-reconciler': resolve(
				__dirname,
				'packages/react-reconciler/index.ts',
			),
			'lihzsky-shared': resolve(__dirname, 'packages/shared/index.ts'),
			hostConfig: resolve(__dirname, 'packages/react-dom/src/hostConfig.ts'),
		},
	},
});
