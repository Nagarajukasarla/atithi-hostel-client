/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: "var(--color-primary-rgb)",
                brand: {
                    primary: "hsl(var(--color-primary) / <alpha-value>)",
                    secondary: "hsl(var(--color-secondary) / <alpha-value>)",
                    accent: "hsl(var(--color-accent) / <alpha-value>)",
                    success: "hsl(var(--color-success) / <alpha-value>)",
                    warning: "hsl(var(--color-warning) / <alpha-value>)",
                    danger: "hsl(var(--color-danger) / <alpha-value>)",
                    border: "hsl(var(--color-border) / <alpha-value>)",
                    bg: "hsl(var(--color-bg) / <alpha-value>)",
                    card: "hsl(var(--color-card) / <alpha-value>)",
                    tableHeader: "hsl(var(--color-table-header) / <alpha-value>)",
                    inputBorder: "hsl(var(--color-input-border) / <alpha-value>)",
                    sidebarBg: "hsl(var(--color-sidebar-bg) / <alpha-value>)",
                    sidebarActive: "hsl(var(--color-sidebar-active) / <alpha-value>)",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            boxShadow: {
                soft: "0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
                medium: "0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 8px -1px rgba(0, 0, 0, 0.03)",
                premium: "0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.03)",
            },
        },
    },
    plugins: [],
};
