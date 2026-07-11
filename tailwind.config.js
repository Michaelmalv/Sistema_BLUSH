/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blush: {
          // Paleta oficial de colores institucionales de Blush
          khaki: {
            DEFAULT: '#BAAB94', // Color arena/beige elegante
            light: '#CFC3B1',
            dark: '#A3937C',
          },
          olivine: {
            DEFAULT: '#9FAB7E', // Verde oliva suave
            light: '#B5C099',
            dark: '#879264',
          },
          palmLeaf: {
            DEFAULT: '#748843', // Verde palma corporativo principal
            light: '#8EAA52',
            dark: '#5B6B35',
          },
          darkKhaki: {
            DEFAULT: '#CABF74', // Tono dorado / khaki ocre
            light: '#DDD593',
            dark: '#B0A558',
          },
          seashell: {
            DEFAULT: '#F5EBE6', // Tono crema de fondo (Seashell corregido)
            light: '#FAF3EF',
            dark: '#E0D2CB',
          },
          // Colores de soporte para estados del sistema
          slate: {
            800: '#2E3532',
            900: '#1C201E',
          }
        }
      },
      fontFamily: {
        // Fuente sofisticada propuesta para combinar con la línea gráfica premium
        sans: ['Outfit', 'Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
