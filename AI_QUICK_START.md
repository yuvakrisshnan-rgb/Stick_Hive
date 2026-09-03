StickHive --- AI Quick Start

Read PROJECT_CONTEXT.md for the complete project context. Then inspect
the actual repository before changing code.

Project

StickHive is a student-built creative sticker e-commerce brand.

Tagline: Make your ideas stick.

The concept started as a classroom business idea and became a real brand
concept.

Stack

Next.js

React

TypeScript

Tailwind CSS

Motion / motion/react

lucide-react

react-icons

Inter

Space Grotesk

Colors

Cream: #fff8ed
Black: #111111
Hive Yellow: #ffd43b
Honey Orange: #ff8a00
Honey Dark: #e66f00
Mint: #b8f2d0
Footer Green: #123F3A

Important routes

/
/shop
/custom-sticker
/about
/contact
/faq
/shipping
/returns
/privacy
/terms

Trending

8 cards

automatic infinite horizontal marquee

subtle card floating/pop motion

reduced-motion support

category indicator dots intentionally removed

Do not break the working marquee.

About

Route: /about

Anchors:

/about#story
/about#journey
/about#why-stickhive

The About page tells the student/classroom-to-brand story and contains
the scroll-linked bee animation.

Bee

Current bee: 🐝

Behavior: - follows page scroll - down = faces right - up = faces left -
subtle float - no continuous rotation - smooth, rounded, simple buzzing
SVG path - enough space for movement - no independent racing

Recommended types:

type ScrollDirection = "up" | "down";
type BeeDirection = "left" | "right";

Footer

Global footer includes Shop, Help, About, newsletter, social and legal
links.

Newsletter:

Subscribe
→ You're in!
→ Welcome to the Hive! 🐝
→ clear email
→ ~2.5 seconds
→ Subscribe

Newsletter is frontend-only.

Instagram and LinkedIn use react-icons, not lucide-react.

Working style

The user wants incremental changes. Preserve working features and modify
only the requested area.

When asked for full code: - give the exact file path - provide the
complete replacement file - briefly explain the change

Do not generate images unless explicitly requested.

Critical rule

The actual repository code is the final source of truth. If this file
and the code disagree, inspect the code and do not blindly overwrite
working implementation.