import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { SocketProvider } from "@/context/socket-context";
import { QueryProvider } from "@/context/query-provider";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SalonDirect — Book Salon Appointments & Walk-in Live Queue",
  description: "Your next salon visit, made simple. Discover popular salons, check real-time availability, join walk-in queues, and book treatments online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
              <CustomerLayout>{children}</CustomerLayout>
              <Toaster position="top-right" richColors />
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}