import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        if (id.includes("lucide-react")) {
                            return "lucide";
                        }
                        if (id.includes("recharts") || id.includes("d3")) {
                            return "recharts";
                        }
                        if (
                            id.includes("react-dom") ||
                            id.includes("react-router-dom") ||
                            id.includes("react-router")
                        ) {
                            return "react-core";
                        }
                        return "vendor";
                    }
                },
            },
        },
    },
});
