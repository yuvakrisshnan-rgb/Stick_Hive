"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import FlyoutPopover from "./flyout-popover";

// ============================================================================
// EMOJI PICKER (Task 4 — right-rail flyout)
// ============================================================================
// package.json has no emoji-picker dependency (emoji-mart, emoji-picker-
// react, etc. all absent — checked before writing this). Rather than pull in
// an emoji database library purely to get search, this keeps the prior
// sprint's zero-bundle-cost approach (real Unicode characters, rendered by
// the OS's own emoji font — no asset to ship) and makes it genuinely
// searchable by attaching keyword tags to a much larger curated set and
// filtering client-side. That satisfies "real, searchable" without adding a
// dependency; a real library remains the fallback if this set ever proves
// too small.

type EmojiEntry = { char: string; tags: string[] };

const EMOJI_CATEGORIES: { label: string; items: EmojiEntry[] }[] = [
  {
    label: "Smileys",
    items: [
      { char: "😀", tags: ["happy", "smile", "grin"] },
      { char: "😂", tags: ["laugh", "lol", "crying laughing", "funny"] },
      { char: "🥹", tags: ["touched", "holding back tears"] },
      { char: "😍", tags: ["love", "heart eyes", "crush"] },
      { char: "😎", tags: ["cool", "sunglasses"] },
      { char: "🥳", tags: ["party", "celebrate", "birthday"] },
      { char: "😭", tags: ["cry", "sad", "sob"] },
      { char: "😡", tags: ["angry", "mad", "rage"] },
      { char: "🤔", tags: ["think", "hmm", "wonder"] },
      { char: "🙄", tags: ["eyeroll", "annoyed"] },
      { char: "😴", tags: ["sleep", "tired", "zzz"] },
      { char: "🤯", tags: ["mind blown", "shocked"] },
      { char: "🥺", tags: ["pleading", "puppy eyes", "cute"] },
      { char: "😇", tags: ["angel", "innocent", "halo"] },
      { char: "🤩", tags: ["star struck", "excited", "wow"] },
      { char: "😱", tags: ["scream", "shocked", "scared"] },
      { char: "😏", tags: ["smirk", "sly"] },
      { char: "😜", tags: ["wink", "tongue", "silly"] },
      { char: "🤪", tags: ["crazy", "zany", "goofy"] },
      { char: "🥶", tags: ["cold", "freezing"] },
      { char: "🥵", tags: ["hot", "sweating"] },
      { char: "😤", tags: ["frustrated", "huff"] },
      { char: "😬", tags: ["grimace", "awkward", "yikes"] },
      { char: "🤗", tags: ["hug", "welcome"] },
    ],
  },
  {
    label: "Hearts",
    items: [
      { char: "❤️", tags: ["heart", "love", "red"] },
      { char: "💛", tags: ["heart", "yellow"] },
      { char: "💚", tags: ["heart", "green"] },
      { char: "💙", tags: ["heart", "blue"] },
      { char: "💜", tags: ["heart", "purple"] },
      { char: "🖤", tags: ["heart", "black"] },
      { char: "🤍", tags: ["heart", "white"] },
      { char: "🧡", tags: ["heart", "orange"] },
      { char: "💯", tags: ["100", "perfect", "score"] },
      { char: "💕", tags: ["hearts", "love", "cute"] },
      { char: "💖", tags: ["sparkle heart", "love"] },
      { char: "💔", tags: ["broken heart", "sad"] },
    ],
  },
  {
    label: "Nature",
    items: [
      { char: "🔥", tags: ["fire", "hot", "lit"] },
      { char: "✨", tags: ["sparkles", "shine", "magic"] },
      { char: "⭐", tags: ["star"] },
      { char: "🌈", tags: ["rainbow", "pride"] },
      { char: "☀️", tags: ["sun", "sunny"] },
      { char: "🌙", tags: ["moon", "night"] },
      { char: "⚡", tags: ["lightning", "bolt", "zap"] },
      { char: "💧", tags: ["water", "drop", "tear"] },
      { char: "🐝", tags: ["bee", "insect"] },
      { char: "🐶", tags: ["dog", "puppy"] },
      { char: "🐱", tags: ["cat", "kitten"] },
      { char: "🦄", tags: ["unicorn", "magic"] },
      { char: "🐼", tags: ["panda"] },
      { char: "🦋", tags: ["butterfly"] },
      { char: "🌸", tags: ["flower", "blossom", "cherry"] },
      { char: "🍀", tags: ["clover", "lucky"] },
      { char: "🌵", tags: ["cactus"] },
      { char: "🐸", tags: ["frog"] },
    ],
  },
  {
    label: "Food",
    items: [
      { char: "🍕", tags: ["pizza"] },
      { char: "🍔", tags: ["burger"] },
      { char: "🍩", tags: ["donut"] },
      { char: "🍦", tags: ["ice cream"] },
      { char: "☕", tags: ["coffee"] },
      { char: "🎂", tags: ["cake", "birthday"] },
      { char: "🍓", tags: ["strawberry"] },
      { char: "🥑", tags: ["avocado"] },
      { char: "🍉", tags: ["watermelon"] },
      { char: "🧋", tags: ["boba", "bubble tea"] },
    ],
  },
  {
    label: "Objects",
    items: [
      { char: "👍", tags: ["thumbs up", "like", "yes"] },
      { char: "👎", tags: ["thumbs down", "no"] },
      { char: "👏", tags: ["clap", "applause"] },
      { char: "🙌", tags: ["hands up", "celebrate"] },
      { char: "🤝", tags: ["handshake", "deal"] },
      { char: "✌️", tags: ["peace", "victory"] },
      { char: "🤞", tags: ["fingers crossed", "luck"] },
      { char: "👀", tags: ["eyes", "look"] },
      { char: "🎉", tags: ["party", "confetti", "celebrate"] },
      { char: "🎈", tags: ["balloon"] },
      { char: "🎁", tags: ["gift", "present"] },
      { char: "🏆", tags: ["trophy", "win"] },
      { char: "💰", tags: ["money", "cash"] },
      { char: "📌", tags: ["pin"] },
      { char: "💡", tags: ["idea", "lightbulb"] },
      { char: "🚀", tags: ["rocket", "launch"] },
      { char: "🎧", tags: ["headphones", "music"] },
      { char: "📷", tags: ["camera", "photo"] },
      { char: "👑", tags: ["crown", "king", "queen"] },
      { char: "💎", tags: ["diamond", "gem"] },
    ],
  },
];

const ALL_EMOJI = EMOJI_CATEGORIES.flatMap((category) => category.items);

export default function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return null;

    return ALL_EMOJI.filter(
      (entry) =>
        entry.tags.some((tag) => tag.includes(normalized)) ||
        entry.char === normalized,
    );
  }, [query]);

  return (
    <FlyoutPopover label="Add emoji" onClose={onClose} widthClassName="w-72">
      <div className="p-3">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search emoji…"
            autoFocus
            className="
              h-9
              w-full
              rounded-xl
              border
              border-black/10
              bg-cream/60
              pl-9
              pr-3
              text-sm
              outline-none
              transition
              focus:border-black/30
            "
          />
        </div>

        <div className="mt-3 max-h-64 overflow-y-auto">
          {results ? (
            results.length === 0 ? (
              <p className="px-1 py-6 text-center text-xs font-semibold text-black/40">
                No emoji found for &ldquo;{query}&rdquo;
              </p>
            ) : (
              <div className="grid grid-cols-8 gap-1">
                {results.map((entry) => (
                  <EmojiCell key={entry.char} entry={entry} onSelect={onSelect} />
                ))}
              </div>
            )
          ) : (
            <div className="space-y-3">
              {EMOJI_CATEGORIES.map((category) => (
                <div key={category.label}>
                  <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
                    {category.label}
                  </p>
                  <div className="grid grid-cols-8 gap-1">
                    {category.items.map((entry) => (
                      <EmojiCell key={entry.char} entry={entry} onSelect={onSelect} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FlyoutPopover>
  );
}

function EmojiCell({
  entry,
  onSelect,
}: {
  entry: EmojiEntry;
  onSelect: (emoji: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entry.char)}
      title={entry.tags[0]}
      className="
        flex
        size-7
        items-center
        justify-center
        rounded-lg
        text-lg
        leading-none
        transition
        hover:scale-110
        hover:bg-cream
      "
    >
      {entry.char}
    </button>
  );
}
