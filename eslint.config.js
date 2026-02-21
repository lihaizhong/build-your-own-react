import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
	// 忽略文件
	{
		ignores: [
			'dist/',
			'node_modules/',
			'coverage/',
			'*.config.js',
			'*.config.ts',
		],
	},

	// 基础配置
	js.configs.recommended,

	// TypeScript 配置
	...tseslint.configs.recommended,

	// Prettier 配置
	eslintPluginPrettierRecommended,

	// 自定义规则
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021,
			},
		},
		rules: {
			// TypeScript 相关
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_' },
			],
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/no-var-requires': 'off',

			// JavaScript 相关
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			'no-debugger': 'warn',
			'no-case-declarations': 'off',
			'no-constant-condition': 'off',
			'prefer-const': 'warn',

			// Prettier
			'prettier/prettier': [
				'error',
				{
					printWidth: 80,
					tabWidth: 2,
					useTabs: true,
					singleQuote: true,
					semi: true,
					trailingComma: 'none',
					bracketSpacing: true,
				},
			],
		},
	},

	// TypeScript 文件特殊配置
	{
		files: ['**/*.ts', '**/*.tsx'],
		rules: {
			'no-undef': 'off', // TypeScript 已处理
		},
	},
);
