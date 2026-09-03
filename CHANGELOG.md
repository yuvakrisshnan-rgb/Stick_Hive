StickHive --- AI Change Log

2026-08-31

Home / Trending

Expanded Trending to 8 sticker cards.

Fixed automatic horizontal marquee.

Added/retained subtle card floating/pop animation.

Removed small black category indicator dots.

Navigation

Fixed Custom Stickers navigation after a Next.js 404 issue.

Fixed About navigation.

Added About section anchors:

/about#story

/about#journey

/about#why-stickhive

About

Built the About page around the classroom/student origin story.

Added Our Story.

Added Our Journey.

Added Why StickHive.

Added journey photo placeholders.

Added scroll-linked bee animation using 🐝.

Bee follows an SVG path.

Bee faces right while scrolling down and left while scrolling up.

Bee has subtle floating motion.

Simplified the path after it became visually messy.

Reduced excessive empty space.

Increased photo areas.

Footer

Built a global dark-green footer.

Added Shop, Help and About navigation.

Added newsletter UI.

Added frontend newsletter success state.

Newsletter flow:

Subscribe

You're in!

Welcome to the Hive! 🐝

clear email

return to Subscribe after ~2.5 seconds

Added Instagram and LinkedIn through react-icons.

Added legal links.

Pages

Worked on: - Contact - FAQ - Shipping - Returns - Privacy - Terms

Known limitations

Newsletter has no production backend.

Real Instagram/LinkedIn URLs may need to be configured.

Real journey/team photos are pending.

Actual StickHive logo asset is pending; About uses 🐝.

Important implementation lessons

Bee typing

Keep scroll direction and bee facing direction separate:

type ScrollDirection = "up" | "down";
type BeeDirection = "left" | "right";

Social icons

Use react-icons for Instagram and LinkedIn. Do not import them from
lucide-react.

Newsletter

The newsletter currently uses frontend state only. Do not describe it as
a real mailing-list subscription.

Marquee

The working Trending marquee relies on duplicated content/track behavior
for a seamless loop. Preserve the existing implementation unless the
user specifically requests a redesign.

Update protocol

After a major confirmed change: 1. Add the change to this log. 2. Update
PROJECT_CONTEXT.md if project behavior/design changed. 3. Keep actual
source code as the final authority.