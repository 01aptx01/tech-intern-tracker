import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const noto = Noto_Sans_Thai({ subsets: ["thai", "latin"], variable: "--font-sans", display: "swap" });
export const metadata: Metadata = { title: "Tech Internship Tracker", description: "ตัวติดตามการสมัครฝึกงานสายเทคที่ซิงก์กับ Excel ในเครื่อง" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="th" suppressHydrationWarning><body className={noto.variable}><QueryProvider><ThemeProvider>{children}</ThemeProvider></QueryProvider></body></html>;
}
