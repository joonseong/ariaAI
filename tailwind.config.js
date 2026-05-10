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
        background: '#FFFFFF',
        surface: '#F8F8F8',
        elevated: '#F0F0F0',
        'accent-primary': '#F53356',
        'accent-hover': '#D42549',
        'accent-heart': '#F53356',
        'text-primary': '#0D0D0D',
        'text-secondary': '#525252',
        'text-tertiary': '#737373',
        'semantic-error': '#EF4444',
        'semantic-success': '#22C55E',
        'semantic-warning': '#F59E0B',
        border: '#E5E5E5',
      },
    },
  },
  plugins: [],
};
