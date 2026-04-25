/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontSize: {
        xs: ['14px', '18px'],
        sm: ['16px', '22px'],
        base: ['18px', '26px'],
        lg: ['20px', '28px'],
        xl: ['22px', '30px'],
        '2xl': ['26px', '32px'],
        '3xl': ['32px', '38px'],
        '4xl': ['38px', '44px'],
        '5xl': ['50px', '1'],
        '6xl': ['62px', '1'],
      },
      colors: {
        background: '#0D0D0D',
        surface: '#1A1A1A',
        elevated: '#262626',
        'accent-primary': '#8B5CF6',
        'accent-hover': '#7C3AED',
        'accent-heart': '#EF4444',
        'text-primary': '#F5F5F5',
        'text-secondary': '#A3A3A3',
        'text-tertiary': '#808080',
        'semantic-error': '#EF4444',
        'semantic-success': '#22C55E',
        'semantic-warning': '#F59E0B',
        border: '#2A2A2A',
      },
    },
  },
  plugins: [],
};
