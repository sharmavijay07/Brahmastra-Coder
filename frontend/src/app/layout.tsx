import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Brahmastra Coder - AI Project Generator",
    description: "Generate complete projects with AI in real-time",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
