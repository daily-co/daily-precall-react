import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
	plugins: [
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		react(),
		dts({
			insertTypesEntry: true,
		}),
	],
	define: { global: 'window' },
	build: {
		lib: {
			entry: path.resolve(__dirname, 'src/index.ts'),
			name: '@daily-co/daily-precall-react',
			formats: ['es', 'umd'],
			fileName: (format) => `daily-precall-react.${format}.js`,
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
});
