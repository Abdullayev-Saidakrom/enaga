/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F1F4EE',
        surface: '#FFFFFF',
        ink: '#1B241F',
        inkSoft: '#5C6B62',
        primary: '#1F4B3F',
        primaryDark: '#0F2921',
        primarySoft: '#DCEAE3',
        accent: '#E0A452',
        accentSoft: '#F7E7C9',
        border: '#E1E7DE',
      },
      borderRadius: {
        lg: '24px',
        md: '16px',
        sm: '10px',
      },
    },
  },
  plugins: [],
};
