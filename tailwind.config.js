import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  /** V2 앱 구조 — 스캔 경로 유지 */
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  prefix: '',
  theme: {
    /** V1(shadcn) 컨테이너 토큰 */
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: ['Outfit', 'Pretendard', 'sans-serif'],
        body: ['Pretendard', 'Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        coral: {
          DEFAULT: 'hsl(var(--coral))',
          light: 'hsl(var(--coral-light))',
        },
        orange: {
          DEFAULT: 'hsl(var(--orange))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        'nail-bg': '#FDFBF7',
        'nail-coral': '#FF7F50',
        'nail-dark': '#1A1A1A',
        'nail-gray': '#717171',
        /** V2 일부 화면에서 사용 — V1 토큰과 충돌 없는 보조 팔레트 */
        gelia: {
          canvas: '#fdf8fb',
          canvasDark: '#1a1216',
          line: '#f3e4ea',
          lineDark: '#2d2428',
          muted: '#8b7a82',
          mutedDark: '#a898a0',
        },
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        gelia: '0 8px 30px rgba(255, 71, 126, 0.08)',
        'gelia-dark': '0 8px 32px rgba(0, 0, 0, 0.35)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        /** V1 Detail — 메인 이미지 더블탭 좋아요 플로팅 하트 */
        'detail-double-tap-heart': {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '18%': { opacity: '1', transform: 'scale(1.12)' },
          '32%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(1.42)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'detail-double-tap-heart':
          'detail-double-tap-heart 0.9s ease-out forwards',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
