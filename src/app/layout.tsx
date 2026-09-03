import type {
  Metadata,
  Viewport,
} from "next"

import "@fontsource-variable/inter";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";

import "./globals.css"

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


// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {

  title:
    "StickHive — Make Ideas Stick",

  description:
    "StickHive is a creative sticker universe where ideas become stickers and creativity becomes physical. Premium stickers for brands and individuals.",

  generator:
    "v0.app",

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

      </body>

    </html>

  )

}