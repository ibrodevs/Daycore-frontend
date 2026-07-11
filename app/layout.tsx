import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import AuthGate from "./components/AuthGate";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DayCore — твой день в порядке",
  description: "Личный планировщик задач, привычек и фокус-сессий.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${nunito.variable} antialiased`}>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
