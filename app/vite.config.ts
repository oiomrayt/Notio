/// <reference types="vite/client" />
/// <reference types="node" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: [
                    ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
                ],
            },
        }),
        svgr(),
        tsconfigPaths(),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@components': resolve(__dirname, './src/components'),
            '@pages': resolve(__dirname, './src/pages'),
            '@hooks': resolve(__dirname, './src/hooks'),
            '@store': resolve(__dirname, './src/store'),
            '@utils': resolve(__dirname, './src/utils'),
            '@types': resolve(__dirname, './src/types'),
            '@assets': resolve(__dirname, './src/assets'),
            '@styles': resolve(__dirname, './src/styles'),
        },
    },
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        outDir: 'build',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ['react', 'react-dom'],
                    redux: ['@reduxjs/toolkit', 'react-redux'],
                    router: ['react-router-dom'],
                    editor: ['slate', 'slate-react', 'slate-history'],
                    charts: ['chart.js'],
                },
            },
        },
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@reduxjs/toolkit',
            'react-redux',
            'react-router-dom',
            'slate',
            'slate-react',
            'slate-history',
            'chart.js',
        ],
    },
}); 