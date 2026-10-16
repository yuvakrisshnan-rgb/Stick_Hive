import type {
  Metadata,
  Viewport,
} from "next"

import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/caveat/600.css";
import "@fontsource/caveat/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";

import "./globals.css"

import { Toaster } from "sonner"

import {
  ShopProvider,
} from "@/components/shop/store-provider"

import {
  WishlistProvider,
} from "@/components/wishlist/wishlist-provider"

import IntroWrapper from "@/components/providers/intro-wrapper"

import AnnouncementBar from "@/components/layout/announcement-bar"

import Navbar from "@/components/layout/navbar"

import Footer from "@/components/layout/footer"

import CartDrawer from "@/components/cart/cart-drawer"
import { AuthProvider } from "@/components/auth/auth-provider"
import AuthDialogHost from "@/components/auth/auth-dialog-host"


// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {

  title:
    "Stick Hive — Make Ideas Stick",

  description:
    "Stick Hive is a creative sticker universe where ideas become stickers and creativity becomes physical. Premium stickers for brands and individuals.",

  generator:
    "v0.app",

  icons: {
    icon: [
      { url: "/brand/stickhive-icon.png", sizes: "1024x1024", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/brand/stickhive-icon.png",
  },

}


// ============================================================================
// VIEWPORT
// ============================================================================

export const viewport: Viewport = {

  themeColor:
    "#fff8ed",

}


// ============================================================================
// ROOT LAYOUT
// ============================================================================

export default function RootLayout({

  children,

}: Readonly<{

  children: React.ReactNode

}>) {

  return (

    <html
      lang="en"
    >

      <body
        className="antialiased"
      >

        {/* ================================================================
            SHOP PROVIDER
        ================================================================= */}

        <AuthProvider>

          <ShopProvider>

          {/* ==============================================================
              WISHLIST PROVIDER
          ============================================================== */}

          <WishlistProvider>

            {/* ============================================================
                GLOBAL APP WRAPPER
            ============================================================ */}

            <IntroWrapper>

              {/* ==========================================================
                  ANNOUNCEMENT BAR
              ========================================================== */}

              <AnnouncementBar />


              {/* ==========================================================
                  NAVBAR
              ========================================================== */}

              <Navbar />


              {/* ==========================================================
                  PAGE CONTENT
              ========================================================== */}

              {children}


              {/* ==========================================================
                  FOOTER
              ========================================================== */}

              <Footer />


              {/* ==========================================================
                  CART DRAWER
              ========================================================== */}

              <CartDrawer />

            </IntroWrapper>

          </WishlistProvider>

          </ShopProvider>

          <AuthDialogHost />

        </AuthProvider>


        {/* ================================================================
            TOASTS — sign-in / sign-out confirmations, and any future
            app-wide notifications. Sits outside every provider so it
            keeps rendering regardless of auth/shop state.
        ================================================================= */}

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#fff8ed",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: "9999px",
              padding: "12px 20px",
              fontWeight: 700,
              fontSize: "14px",
              color: "#111",
            },
          }}
        />

      </body>

    </html>

  )

}