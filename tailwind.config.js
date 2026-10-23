import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Hiragino Sans GB"',
          '"Microsoft YaHei"', '"Source Han Sans SC"', '"Noto Sans CJK SC"', 'sans-serif',
        ],
        mono: ['"SF Mono"', 'ui-monospace', '"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dde8fd', 200: '#c2d5fb', 300: '#9ab9f7',
          400: '#6b95f1', 500: '#4873e8', 600: '#3255db', 700: '#2a43cf',
          800: '#2838a8', 900: '#273585', 950: '#182050',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
