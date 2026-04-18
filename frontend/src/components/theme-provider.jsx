import { ThemeProvider as NextThemesProvider } from "next-themes";

function ThemeProvider({children, ...props}){
    return (
        <NextThemesProvider attribute="class"
                            enableSystem={true}
                            storageKey="vite-ui-theme" {...props}>
        {children}
        </NextThemesProvider>
    )
}
export default ThemeProvider;