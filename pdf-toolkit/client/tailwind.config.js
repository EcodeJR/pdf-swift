/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4D4DFF',
          50: '#F8F8FF',
          100: '#F0F0FF',
          200: '#E8E8FF',
          300: '#C5C5FF',
          400: '#9999FF',
          500: '#4D4DFF',
          600: '#3B3BCC',
          700: '#2D2D99',
          800: '#1F1F66',
          900: '#111133',
        },
        accent: {
          blue: '#4169E1',
          green: '#00E676',
          purple: '#5856FF',
        },
        dark: {
          DEFAULT: '#0A0A0A',
          100: '#1A1A1A',
          200: '#2A2A2A',
          300: '#3A3A3A',
        },
        light: {
          DEFAULT: '#F8F9FA',
          100: '#F8F8FF',
          200: '#E5E5E5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'display': ['72px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-sm': ['64px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'hero': ['48px', { lineHeight: '1.2', fontWeight: '700' }],
        'hero-sm': ['40px', { lineHeight: '1.2', fontWeight: '700' }],
        'heading': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-sm': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      spacing: {
        'xs': '8px',
        'sm': '16px',
        'md': '24px',
        'lg': '32px',
        'xl': '48px',
        '2xl': '64px',
        '3xl': '96px',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'lg': '0 8px 32px rgba(0, 0, 0, 0.16)',
        'primary': '0 4px 20px rgba(77, 77, 255, 0.3)',
        'primary-lg': '0 6px 20px rgba(77, 77, 255, 0.4)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
