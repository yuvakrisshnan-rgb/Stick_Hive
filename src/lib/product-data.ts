// src/lib/product-data.ts


// ============================================
// STICKER TYPES
// ============================================

export type StickerSize =
  | "Small"
  | "Medium"
  | "Large"


export type ProductLabel =
  | "NEW"
  | "TRENDING"
  | "BEST SELLER"
  | "PREMIUM VINYL"
  | "LIMITED EDITION"
  | "ARTIST COLLECTION"
  | "COLLECTOR DROP"


export type Category =
  | "Anime"
  | "Marvel"
  | "DC"
  | "Gaming"
  | "Nature"
  | "Cute"
  | "Aesthetic"
  | "Memes"
  | "Movies"
  | "Series"
  | "Technology"
  | "Sports"
  | "Custom"


export type Collection =
  | "Hive Originals"
  | "Food Collection"
  | "Gaming Vault"
  | "Earth Series"
  | "Future Pack"
  | "Character Drop"


// ============================================
// PRODUCT TYPE
// ============================================

export type Product = {

  id: string

  name: string

  description: string

  category: Category

  collection?: Collection

  tags: string[]

  /**
   * Primary product image.
   *
   * Kept for backwards compatibility with
   * the existing catalogue and components.
   */
  image?: string

  /**
   * Optional product image gallery.
   *
   * This allows a product to have multiple
   * images in the future.
   *
   * Example:
   *
   * images: [
   *   "/stickers/cosmic-bee.png",
   *   "/stickers/cosmic-bee-2.png",
   *   "/stickers/cosmic-bee-3.png",
   * ]
   *
   * This structure is also ready to map
   * to Supabase Storage URLs later.
   */
  images?: string[]

  emoji?: string

  color: string

  sizes: StickerSize[]

  rating: number

  reviews: number

  salesCount: number

  createdAt: string

  labels: ProductLabel[]

  offer?: number

  isPremium: boolean

  inStock: boolean

}


// ============================================
// STICKER PRICING
// ============================================

export const SIZE_PRICES: Record<
  StickerSize,
  number
> = {

  Small: 20,

  Medium: 25,

  Large: 30,

}


// ============================================
// PRICE CALCULATION
// ============================================

export function priceFor(
  product: Product,
  size: StickerSize,
) {

  let price =
    SIZE_PRICES[size]


  // Premium vinyl surcharge

  if (
    product.isPremium
  ) {

    price += 10

  }


  let original:
    number | undefined


  // Discount handling

  if (
    product.offer
  ) {

    original = price


    price = Math.round(
      price -
        (
          price *
          product.offer
        ) /
          100,
    )

  }


  return {

    price,

    original,

  }

}


// ============================================
// PRODUCT CATALOGUE
// ============================================

export const PRODUCTS: Product[] = [

  // ==========================================
  // 01 — MINI ANIME PACK
  // ==========================================

  {

    id: "mini-anime-pack",

    name: "Mini Anime Pack",

    description:
      "A collection of cute anime characters designed to bring a little extra personality to your everyday essentials.",

    category: "Anime",

    collection: "Character Drop",

    tags: [
      "anime",
      "cute",
      "pack",
      "characters",
    ],

    image:
      "/stickers/mini-anime-pack.svg",

    emoji: "🎴",

    color: "#FFC8DD",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.6,

    reviews: 140,

    salesCount: 800,

    createdAt:
      "2026-04-28",

    labels: [
      "NEW",
    ],

    isPremium: false,

    inStock: true,

  },


  // ==========================================
  // 02 — COSMIC BEE
  // ==========================================

  {

    id: "cosmic-bee",

    name: "Cosmic Bee",

    description:
      "A playful cosmic bee floating through the universe, made for anyone who likes their stickers cute with a little bit of space magic.",

    category: "Nature",

    collection: "Hive Originals",

    tags: [
      "bee",
      "nature",
      "cute",
      "space",
      "animal",
    ],

    image:
      "/stickers/cosmic-bee.png",

    emoji: "🐝",

    color: "#FFD43B",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.9,

    reviews: 124,

    salesCount: 980,

    createdAt:
      "2026-01-10",

    labels: [
      "BEST SELLER",
      "PREMIUM VINYL",
    ],

    offer: 10,

    isPremium: true,

    inStock: true,

  },


  // ==========================================
  // 03 — RAMEN RUSH
  // ==========================================

  {

    id: "ramen-rush",

    name: "Ramen Rush",

    description:
      "A cheerful bowl of ramen for food lovers, anime fans and anyone who believes every great idea starts with good noodles.",

    category: "Cute",

    collection: "Food Collection",

    tags: [
      "ramen",
      "food",
      "anime",
      "kawaii",
      "noodles",
    ],

    image:
      "/stickers/ramen-rush.png",

    emoji: "🍜",

    color: "#FFD6A5",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.8,

    reviews: 86,

    salesCount: 650,

    createdAt:
      "2026-02-01",

    labels: [
      "NEW",
    ],

    isPremium: false,

    inStock: true,

  },


  // ==========================================
  // 04 — LEVEL UP
  // ==========================================

  {

    id: "level-up",

    name: "Level Up",

    description:
      "A gaming-inspired sticker for players, creators and anyone constantly working toward their next level.",

    category: "Gaming",

    collection: "Gaming Vault",

    tags: [
      "gaming",
      "pixel",
      "console",
      "player",
      "game",
    ],

    image:
      "/stickers/level-up.svg",

    emoji: "🎮",

    color: "#CDB4DB",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.9,

    reviews: 210,

    salesCount: 1200,

    createdAt:
      "2026-03-15",

    labels: [
      "TRENDING",
    ],

    isPremium: false,

    inStock: true,

  },


  // ==========================================
  // 05 — GROW WILD
  // ==========================================

  {

    id: "grow-wild",

    name: "Grow Wild",

    description:
      "A simple reminder to keep growing, stay curious and let your ideas take root wherever you go.",

    category: "Nature",

    collection: "Earth Series",

    tags: [
      "plant",
      "green",
      "environment",
      "growth",
      "earth",
    ],

    image:
      "/stickers/grow-wild.png",

    emoji: "🌱",

    color: "#B8F2D0",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.7,

    reviews: 65,

    salesCount: 420,

    createdAt:
      "2026-03-20",

    labels: [
      "ARTIST COLLECTION",
    ],

    isPremium: true,

    inStock: true,

  },


  // ==========================================
  // 06 — TINY BOT
  // ==========================================

  {

    id: "tiny-bot",

    name: "Tiny Bot",

    description:
      "A tiny friendly robot made for tech lovers, builders and curious minds who are always experimenting with something new.",

    category: "Technology",

    collection: "Future Pack",

    tags: [
      "robot",
      "ai",
      "tech",
      "future",
      "coding",
    ],

    image:
      "/stickers/tiny-bot.svg",

    emoji: "🤖",

    color: "#BDE0FE",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.8,

    reviews: 90,

    salesCount: 530,

    createdAt:
      "2026-04-01",

    labels: [
      "NEW",
    ],

    isPremium: false,

    inStock: true,

  },


  // ==========================================
  // 07 — WEB HERO
  // ==========================================

  {

    id: "web-hero",

    name: "Web Hero",

    description:
      "A bold comic-inspired hero sticker designed for fans of superheroes, action and larger-than-life characters.",

    category: "Anime",

    collection: "Character Drop",

    tags: [
      "hero",
      "anime",
      "character",
      "action",
      "comic",
    ],

    image:
      "/stickers/web-hero.png",

    emoji: "🕷️",

    color: "#FFC8DD",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 5,

    reviews: 300,

    salesCount: 1500,

    createdAt:
      "2026-04-10",

    labels: [
      "COLLECTOR DROP",
      "LIMITED EDITION",
    ],

    offer: 15,

    isPremium: true,

    inStock: true,

  },


  // ==========================================
  // 08 — COSMIC SWORDSMAN
  // ==========================================

  {

    id: "cosmic-swordsman",

    name: "Cosmic Swordsman",

    description:
      "A powerful anime-inspired swordsman surrounded by cosmic energy, created for fans of action and fantasy.",

    category: "Anime",

    collection: "Character Drop",

    tags: [
      "anime",
      "swordsman",
      "action",
      "fantasy",
      "warrior",
    ],

    image:
      "/stickers/cosmic-swordsman.png",

    emoji: "⚔️",

    color: "#4215B5",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.9,

    reviews: 620,

    salesCount: 2100,

    createdAt:
      "2026-04-15",

    labels: [
      "BEST SELLER",
      "PREMIUM VINYL",
    ],

    offer: 10,

    isPremium: true,

    inStock: true,

  },


  // ==========================================
  // 09 — ANIME MECHA
  // ==========================================

  {

    id: "anime-mecha",

    name: "Anime Mecha",

    description:
      "A futuristic mecha design for anime fans who love giant robots, technology and bold mechanical aesthetics.",

    category: "Anime",

    collection: "Future Pack",

    tags: [
      "anime",
      "mecha",
      "robot",
      "future",
      "scifi",
    ],

    image:
      "/stickers/anime-mecha.png",

    emoji: "🤖",

    color: "#8ED8E8",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.8,

    reviews: 410,

    salesCount: 1300,

    createdAt:
      "2026-04-18",

    labels: [
      "TRENDING",
      "PREMIUM VINYL",
    ],

    isPremium: true,

    inStock: true,

  },


  // ==========================================
  // 10 — ULTIMATE GAMER
  // ==========================================

  {

    id: "ultimate-gamer",

    name: "Ultimate Gamer",

    description:
      "A bold gaming sticker for controllers, laptops and setups that deserve a little more personality.",

    category: "Gaming",

    collection: "Gaming Vault",

    tags: [
      "gaming",
      "gamer",
      "console",
      "controller",
      "setup",
    ],

    image:
      "/stickers/ultimate-gamer.png",

    emoji: "🎮",

    color: "#FF8500",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.9,

    reviews: 620,

    salesCount: 1900,

    createdAt:
      "2026-04-20",

    labels: [
      "TRENDING",
      "BEST SELLER",
    ],

    offer: 10,

    isPremium: true,

    inStock: true,

  },


  // ==========================================
  // 11 — BATMAN SHADOW
  // ==========================================

  {

    id: "batman-shadow",

    name: "Batman Shadow",

    description:
      "A dark and powerful superhero sticker inspired by mystery, justice and Gotham vibes.",

    category: "DC",

    collection: "Character Drop",

    tags: [
      "batman",
      "dc",
      "hero",
      "comic",
    ],

    image:
      "/stickers/batman-shadow.png",

    emoji: "🦇",

    color: "#222222",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.8,

    reviews: 320,

    salesCount: 1500,

    createdAt:
      "2026-04-21",

    labels: [
      "BEST SELLER",
    ],

    isPremium: true,

    inStock: true,

  },


  // ==========================================
  // 12 — SPIDER LEGEND
  // ==========================================

  {

    id: "spider-legend",

    name: "Spider Legend",

    description:
      "A dynamic superhero sticker for fans of action, comics and legendary characters.",

    category: "Marvel",

    collection: "Character Drop",

    tags: [
      "spider",
      "marvel",
      "hero",
      "comic",
    ],

    image:
      "/stickers/spider-legend.png",

    emoji: "🕷️",

    color: "#E63946",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.9,

    reviews: 540,

    salesCount: 2400,

    createdAt:
      "2026-04-22",

    labels: [
      "TRENDING",
      "COLLECTOR DROP",
    ],

    offer: 10,

    isPremium: true,

    inStock: true,

  },


  // ==========================================
  // 13 — IRON MACHINE
  // ==========================================

  {

    id: "iron-machine",

    name: "Iron Machine",

    description:
      "A futuristic armored design built for technology lovers and superhero collectors.",

    category: "Marvel",

    collection: "Future Pack",

    tags: [
      "iron",
      "robot",
      "armor",
      "marvel",
    ],

    image:
      "/stickers/iron-machine.png",

    emoji: "🤖",

    color: "#FFD166",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.7,

    reviews: 230,

    salesCount: 900,

    createdAt:
      "2026-04-23",

    labels: [
      "NEW",
    ],

    isPremium: true,

    inStock: true,

  },


  // ==========================================
  // 14 — WONDER POWER
  // ==========================================

  {

    id: "wonder-power",

    name: "Wonder Power",

    description:
      "A bold superhero inspired sticker celebrating strength, courage and confidence.",

    category: "DC",

    collection: "Character Drop",

    tags: [
      "wonder",
      "hero",
      "dc",
      "power",
    ],

    image:
      "/stickers/wonder-power.png",

    emoji: "⭐",

    color: "#FF4D6D",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.8,

    reviews: 180,

    salesCount: 700,

    createdAt:
      "2026-04-24",

    labels: [
      "ARTIST COLLECTION",
    ],

    isPremium: false,

    inStock: true,

  },


  // ==========================================
  // 15 — SPACE RIDER
  // ==========================================

  {

    id: "space-rider",

    name: "Space Rider",

    description:
      "A futuristic space explorer sticker for dreamers, gamers and sci-fi fans.",

    category: "Technology",

    collection: "Future Pack",

    tags: [
      "space",
      "rocket",
      "future",
      "scifi",
    ],

    image:
      "/stickers/space-rider.png",

    emoji: "🚀",

    color: "#023E8A",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.8,

    reviews: 410,

    salesCount: 1100,

    createdAt:
      "2026-04-25",

    labels: [
      "TRENDING",
    ],

    isPremium: false,

    inStock: true,

  },


  // ==========================================
  // 16 — SCARLET MYSTIC
  // ==========================================

  {

    id: "scarlet-mystic",

    name: "Scarlet Mystic",

    description:
      "A magical fantasy sticker with a mysterious cosmic aesthetic.",

    category: "Aesthetic",

    collection: "Hive Originals",

    tags: [
      "magic",
      "mystic",
      "fantasy",
      "aesthetic",
    ],

    image:
      "/stickers/scarlet-mystic.png",

    emoji: "🔮",

    color: "#D90429",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.7,

    reviews: 150,

    salesCount: 500,

    createdAt:
      "2026-04-26",

    labels: [
      "NEW",
    ],

    isPremium: false,

    inStock: true,

  },


  // ==========================================
  // 17 — COFFEE CLUB
  // ==========================================

  {

    id: "coffee-club",

    name: "Coffee Club",

    description:
      "A cozy coffee sticker made for caffeine lovers and creative minds.",

    category: "Cute",

    collection: "Food Collection",

    tags: [
      "coffee",
      "drink",
      "cute",
      "cafe",
    ],

    image:
      "/stickers/coffee-club.png",

    emoji: "☕",

    color: "#CDB4DB",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.8,

    reviews: 200,

    salesCount: 800,

    createdAt:
      "2026-04-27",

    labels: [
      "BEST SELLER",
    ],

    isPremium: false,

    inStock: true,

  },


  // ==========================================
  // 18 — OCEAN WAVE
  // ==========================================

  {

    id: "ocean-wave",

    name: "Ocean Wave",

    description:
      "A calming ocean themed sticker inspired by waves, travel and adventure.",

    category: "Nature",

    collection: "Earth Series",

    tags: [
      "ocean",
      "wave",
      "travel",
      "blue",
    ],

    image:
      "/stickers/ocean-wave.png",

    emoji: "🌊",

    color: "#90E0EF",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.6,

    reviews: 90,

    salesCount: 350,

    createdAt:
      "2026-04-28",

    labels: [
      "ARTIST COLLECTION",
    ],

    isPremium: false,

    inStock: true,

  },


  // ==========================================
  // 19 — PIXEL WORLD
  // ==========================================

  {

    id: "pixel-world",

    name: "Pixel World",

    description:
      "A retro gaming sticker inspired by classic pixel art.",

    category: "Gaming",

    collection: "Gaming Vault",

    tags: [
      "pixel",
      "retro",
      "gaming",
    ],

    image:
      "/stickers/pixel-world.png",

    emoji: "👾",

    color: "#8338EC",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.7,

    reviews: 270,

    salesCount: 950,

    createdAt:
      "2026-04-29",

    labels: [
      "TRENDING",
    ],

    isPremium: false,

    inStock: true,

  },


  // ==========================================
  // 20 — TIGER SPIRIT
  // ==========================================

  {

    id: "tiger-spirit",

    name: "Tiger Spirit",

    description:
      "A powerful animal inspired sticker representing confidence and strength.",

    category: "Nature",

    collection: "Earth Series",

    tags: [
      "tiger",
      "animal",
      "wild",
    ],

    image:
      "/stickers/tiger-spirit.png",

    emoji: "🐯",

    color: "#FFB703",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.9,

    reviews: 300,

    salesCount: 1200,

    createdAt:
      "2026-04-30",

    labels: [
      "PREMIUM VINYL",
    ],

    isPremium: true,

    inStock: true,

  },


  // ==========================================
  // 21 — MYSTIC CAT
  // ==========================================

  {

    id: "mystic-cat",

    name: "Mystic Cat",

    description:
      "A cute magical cat sticker with a dreamy aesthetic for animal lovers.",

    category: "Cute",

    collection: "Hive Originals",

    tags: [
      "cat",
      "cute",
      "magic",
      "animal",
    ],

    image:
      "/stickers/mystic-cat.png",

    emoji: "🐱",

    color: "#FFCAD4",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.8,

    reviews: 260,

    salesCount: 1050,

    createdAt:
      "2026-05-01",

    labels: [
      "BEST SELLER",
    ],

    isPremium: false,

    inStock: true,

  },


  // ==========================================
  // 22 — DRAGON FIRE
  // ==========================================

  {

    id: "dragon-fire",

    name: "Dragon Fire",

    description:
      "A legendary dragon sticker inspired by fantasy worlds and mythical creatures.",

    category: "Movies",

    collection: "Character Drop",

    tags: [
      "dragon",
      "fantasy",
      "fire",
      "myth",
    ],

    image:
      "/stickers/dragon-fire.png",

    emoji: "🐉",

    color: "#FF6B35",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.9,

    reviews: 350,

    salesCount: 1400,

    createdAt:
      "2026-05-02",

    labels: [
      "LIMITED EDITION",
      "PREMIUM VINYL",
    ],

    offer: 15,

    isPremium: true,

    inStock: true,

  },


  // ==========================================
  // 23 — CYBER HACKER
  // ==========================================

  {

    id: "cyber-hacker",

    name: "Cyber Hacker",

    description:
      "A futuristic cyber themed sticker for developers, hackers and technology enthusiasts.",

    category: "Technology",

    collection: "Future Pack",

    tags: [
      "cyber",
      "coding",
      "hacker",
      "technology",
    ],

    image:
      "/stickers/cyber-hacker.png",

    emoji: "💻",

    color: "#00B4D8",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.7,

    reviews: 180,

    salesCount: 600,

    createdAt:
      "2026-05-03",

    labels: [
      "NEW",
    ],

    isPremium: false,

    inStock: true,

  },


  // ==========================================
  // 24 — SPACE CAT
  // ==========================================

  {

    id: "space-cat",

    name: "Space Cat",

    description:
      "A cute astronaut cat exploring the universe with a playful style.",

    category: "Aesthetic",

    collection: "Future Pack",

    tags: [
      "cat",
      "space",
      "cute",
      "astronaut",
    ],

    image:
      "/stickers/space-cat.png",

    emoji: "🚀",

    color: "#CAF0F8",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.9,

    reviews: 430,

    salesCount: 1600,

    createdAt:
      "2026-05-04",

    labels: [
      "COLLECTOR DROP",
    ],

    isPremium: true,

    inStock: true,

  },


  // ==========================================
  // 25 — FOOTBALL KING
  // ==========================================

  {

    id: "football-king",

    name: "Football King",

    description:
      "A sports inspired sticker for football fans and champions.",

    category: "Sports",

    collection: "Hive Originals",

    tags: [
      "football",
      "sports",
      "player",
      "game",
    ],

    image:
      "/stickers/football-king.png",

    emoji: "⚽",

    color: "#90BE6D",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.6,

    reviews: 120,

    salesCount: 450,

    createdAt:
      "2026-05-05",

    labels: [
      "NEW",
    ],

    isPremium: false,

    inStock: true,

  },


  // ==========================================
  // 26 — BASKETBALL MODE
  // ==========================================

  {

    id: "basketball-mode",

    name: "Basketball Mode",

    description:
      "A basketball inspired sticker built for sports lovers and competitive spirits.",

    category: "Sports",

    collection: "Hive Originals",

    tags: [
      "basketball",
      "sports",
      "ball",
      "game",
    ],

    image:
      "/stickers/basketball-mode.png",

    emoji: "🏀",

    color: "#F9844A",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.7,

    reviews: 150,

    salesCount: 520,

    createdAt:
      "2026-05-06",

    labels: [
      "TRENDING",
    ],

    isPremium: false,

    inStock: true,

  },


  // ==========================================
  // 27 — GALAXY DREAM
  // ==========================================

  {

    id: "galaxy-dream",

    name: "Galaxy Dream",

    description:
      "A colourful galaxy sticker inspired by stars, planets and imagination.",

    category: "Aesthetic",

    collection: "Future Pack",

    tags: [
      "galaxy",
      "space",
      "stars",
      "dream",
    ],

    image:
      "/stickers/galaxy-dream.png",

    emoji: "🌌",

    color: "#3A0CA3",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.8,

    reviews: 240,

    salesCount: 900,

    createdAt:
      "2026-05-07",

    labels: [
      "ARTIST COLLECTION",
    ],

    isPremium: true,

    inStock: true,

  },


  // ==========================================
  // 28 — SUSHI MASTER
  // ==========================================

  {

    id: "sushi-master",

    name: "Sushi Master",

    description:
      "A fun food sticker inspired by Japanese cuisine and kawaii culture.",

    category: "Cute",

    collection: "Food Collection",

    tags: [
      "sushi",
      "food",
      "japan",
      "cute",
    ],

    image:
      "/stickers/sushi-master.png",

    emoji: "🍣",

    color: "#FFDDD2",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.6,

    reviews: 110,

    salesCount: 390,

    createdAt:
      "2026-05-08",

    labels: [
      "NEW",
    ],

    isPremium: false,

    inStock: true,

  },


  // ==========================================
  // 29 — NEON CITY
  // ==========================================

  {

    id: "neon-city",

    name: "Neon City",

    description:
      "A cyberpunk city inspired sticker for futuristic aesthetics and night vibes.",

    category: "Technology",

    collection: "Future Pack",

    tags: [
      "city",
      "cyberpunk",
      "neon",
      "future",
    ],

    image:
      "/stickers/neon-city.png",

    emoji: "🌃",

    color: "#7209B7",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 4.8,

    reviews: 210,

    salesCount: 750,

    createdAt:
      "2026-05-09",

    labels: [
      "LIMITED EDITION",
    ],

    isPremium: true,

    inStock: true,

  },


  // ==========================================
  // 30 — HIVE ORIGINAL
  // ==========================================

  {

    id: "hive-original",

    name: "Hive Original",

    description:
      "The signature StickHive sticker representing creativity, community and ideas that stick.",

    category: "Custom",

    collection: "Hive Originals",

    tags: [
      "stickhive",
      "original",
      "brand",
      "logo",
    ],

    image:
      "/stickers/hive-original.png",

    emoji: "🐝",

    color: "#FFD60A",

    sizes: [
      "Small",
      "Medium",
      "Large",
    ],

    rating: 5,

    reviews: 500,

    salesCount: 3000,

    createdAt:
      "2026-05-10",

    labels: [
      "BEST SELLER",
      "COLLECTOR DROP",
    ],

    isPremium: true,

    inStock: true,

  },

]