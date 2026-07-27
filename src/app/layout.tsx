import type { Metadata } from "next";
import { Inter, Prompt } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const prompt = Prompt({
  variable: "--font-prompt",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "ระบบรายงานค่าสาธารณูปโภค - กรมประมง",
  description: "ระบบจัดการและรายงานค่าใช้จ่ายสาธารณูปโภค กรมประมง (Department of Fisheries)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${inter.variable} ${prompt.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-prompt" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
