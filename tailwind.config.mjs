const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx}", "./pages/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#1C1C1C',
        panel: 'rgba(255,255,255,0.05)',
        panelBorder: 'rgba(255,255,255,0.10)',
        text: '#FFFFFF',
        textDim: '#C8C8C8',
        placeholder: '#9CA3AF',
        blue: '#3B82F6',
        purple: '#8B5CF6',
        pink: '#EC4899',
        green: '#10B981',
        red: '#EF4444',
        orange: '#F97316',
      },
      backgroundImage: {
        'bg-gradient': 'linear-gradient(90deg,#3B82F6,#8B5CF6)',
        'tri-gradient': 'linear-gradient(90deg,#3B82F6,#8B5CF6,#EC4899)'
      }
    }
  },
  plugins: [],
}

export default config
