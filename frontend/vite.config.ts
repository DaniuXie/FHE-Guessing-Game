import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      // 根据需要添加 polyfills
    },
  },
  optimizeDeps: {
    // 预构建需要转换为 ESM 的包
    // 注意：使用 /web 子路径，不是根路径
    include: [
      "@zama-fhe/relayer-sdk/web",
      "keccak",
      "sha3",
      "bigint-buffer",
    ],
    esbuildOptions: {
      // node globals polyfills
      define: {
        global: "globalThis",
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  build: {
    target: "es2020",
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
  },
  define: {
    'global': 'globalThis',
    'process.env': {}
  },
  server: {
    // 根据需要启用 COOP/COEP
    headers: {
      // 'Cross-Origin-Opener-Policy': 'same-origin',
      // 'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
