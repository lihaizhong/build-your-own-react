import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
	plugins: [react()],

	// 开发服务器配置
	server: {
		port: 3000,
		open: true,
	},

	// 构建配置
	build: {
		outDir: 'dist',
		sourcemap: true,
		lib: {
			entry: resolve(__dirname, 'packages/react/index.ts'),
			name: 'React',
			fileName: (format) => `react.${format}.js`,
		},
		rollupOptions: {
			external: ['react', 'react-dom'],
			output: {
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM',
				},
			},
		},
	},

	// 路径别名
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

	// TypeScript 配置
	esbuild: {
		jsx: 'automatic',
	},
});
