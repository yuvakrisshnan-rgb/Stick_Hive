export type Product = {
  id: number
  name: string
  category: string
  price: number
  rating: number
  emoji: string
  color: string
  tag: string
}


export const PRODUCTS: Product[] = [

  {
    id: 1,
    name: "Cosmic Bee",
    category: "Nature",
    price: 129,
    rating: 4.9,
    emoji: "🐝",
    color: "#FFD43B",
    tag: "Best Seller",
  },

  {
    id: 2,
    name: "Dream Cloud",
    category: "Aesthetic",
    price: 149,
    rating: 4.8,
    emoji: "☁️",
    color: "#B8F2D0",
    tag: "New",
  },

  {
    id: 3,
    name: "Pixel Heart",
    category: "Cute",
    price: 99,
    rating: 4.7,
    emoji: "💛",
    color: "#FFB3C6",
    tag: "Trending",
  },

  {
    id: 4,
    name: "Thunder Bolt",
    category: "Energy",
    price: 119,
    rating: 4.9,
    emoji: "⚡",
    color: "#FFE066",
    tag: "Popular",
  },

  {
    id: 5,
    name: "Coffee Mood",
    category: "Lifestyle",
    price: 139,
    rating: 4.8,
    emoji: "☕",
    color: "#DDB892",
    tag: "Limited",
  },

  {
    id: 6,
    name: "Mini Planet",
    category: "Space",
    price: 159,
    rating: 5,
    emoji: "🪐",
    color: "#CDB4DB",
    tag: "Premium",
  },

]