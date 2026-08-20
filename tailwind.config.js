/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#ff4d4d',
                'primary-light': '#ff6b6b',
                'primary-dark': '#e63946',
                accent: '#ff6b35',
                background: '#060608',
                'background-secondary': '#0c0c12',
                'background-card': '#12121a',
                'background-elevated': '#1a1a24',
                'foreground-muted': '#94a3b8',
                'foreground-subtle': '#64748b',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
