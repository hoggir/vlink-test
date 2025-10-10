import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Navbar from "@/components/Navbar";
import SessionExpiredModal from "@/components/SessionExpiredModal";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Book Service",
  description: "Your one-stop destination for discovering and managing books",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          id="session-expired-trigger"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.triggerSessionExpired = null;
            `,
          }}
        />
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <SessionExpiredModal />
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
