/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FBF9F5', // warm off-white
          subtle: '#F4EFEB',
          dark: '#EAE3DC',
        },
        charcoal: {
          DEFAULT: '#191919', // deep luxury charcoal
          muted: '#525252',
          light: '#767676',
        },
        accent: {
          DEFAULT: '#A85A32', // terracotta / warm rust
          hover: '#8F4723',
          subtle: '#F7EDE6',
        },
        brand: {
          50: '#FAF8F5',
          100: '#F4ECE4',
          200: '#E7D7C8',
          300: '#D5BAA2',
          400: '#C09A7A',
          500: '#A85A32',
          600: '#8E4A28',
          700: '#723B20',
          800: '#562C18',
          900: '#3A1E10',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

