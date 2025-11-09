import "./globals.css";
import { Inter } from "next/font/google";

import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import { SocketProvider } from "@/contexts/socketContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ChatFlow - Modern Messaging App",
  description: "A beautiful and modern chat application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SocketProvider>
            {children}
            <Toaster />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
