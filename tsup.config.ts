import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	platform: 'node',
	format: ['esm', 'cjs'],
	target: 'es2016',
	skipNodeModulesBundle: true,
	clean: true,
	shims: true,
	cjsInterop: true,
	minify: false,
	terserOptions: {
		mangle: false,
		keep_classnames: true,
		keep_fnames: true,
	},
	splitting: false,
	keepNames: true,
	dts: true,
	sourcemap: "inline",
	esbuildPlugins: [],
	treeshake: false,
	outDir: 'dist',
});
