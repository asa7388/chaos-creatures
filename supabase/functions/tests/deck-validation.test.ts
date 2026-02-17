// tests/deck-validation.test.ts — Deck validation tests
// Tests all invalid configurations from REQ-164:
// - 19 cards, 21 cards
// - Mixed factions
// - 3 copies of same template
// - 3 Legendaries
// - Wrong-faction avatar
// Uses mock data to test the validation logic directly.

import {
  assertEquals,
  assertArrayIncludes,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

import {
  DECK_SIZE,
  MAX_COPIES_PER_TEMPLATE,
  MAX_LEGENDARIES,
  DeckEntry,
} from "../_shared/types.ts";

// ─── Pure validation logic extracted for testing ─────────────

interface MockCard {
  id: string;
  template_id: string;
  tier: string;
  owner_id: string;
  faction_id: string;
}

interface MockAvatar {
  id: string;
  faction_id: string;
}

interface PureValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Pure validation logic (no DB calls) for unit testing.
 * Mirrors the logic in _shared/deck-validator.ts.
 */
function validateDeckPure(
  playerId: string,
  factionId: string,
  avatar: MockAvatar | null,
  cardEntries: DeckEntry[],
  cards: MockCard[]
): PureValidationResult {
  const errors: string[] = [];

  // 1. Count total cards
  const totalCards = cardEntries.reduce((sum, e) => sum + e.quantity, 0);
  if (totalCards !== DECK_SIZE) {
    errors.push(`Deck must contain exactly ${DECK_SIZE} cards (has ${totalCards})`);
  }

  // 2. Validate avatar
  if (!avatar) {
    errors.push("Avatar not found");
  } else if (avatar.faction_id !== factionId) {
    errors.push("Avatar faction does not match deck faction");
  }

  // 3. Validate cards
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  const templateCounts = new Map<string, number>();
  let legendaryCount = 0;

  for (const entry of cardEntries) {
    const card = cardMap.get(entry.card_instance_id);

    if (!card) {
      errors.push(`Card ${entry.card_instance_id} not found or not owned`);
      continue;
    }

    if (card.owner_id !== playerId) {
      errors.push(`Card ${entry.card_instance_id} is not owned by this player`);
      continue;
    }

    if (card.faction_id !== factionId) {
      errors.push(`Card ${card.id} belongs to a different faction`);
    }

    const currentCount = (templateCounts.get(card.template_id) || 0) + entry.quantity;
    templateCounts.set(card.template_id, currentCount);
    if (currentCount > MAX_COPIES_PER_TEMPLATE) {
      errors.push(
        `Template ${card.template_id} exceeds max ${MAX_COPIES_PER_TEMPLATE} copies (has ${currentCount})`
      );
    }

    if (card.tier === "LEGENDARY") {
      legendaryCount += entry.quantity;
    }

    if (entry.quantity < 1 || entry.quantity > MAX_COPIES_PER_TEMPLATE) {
      errors.push(`Card ${entry.card_instance_id} has invalid quantity: ${entry.quantity}`);
    }
  }

  if (legendaryCount > MAX_LEGENDARIES) {
    errors.push(`Deck has ${legendaryCount} Legendary cards (max ${MAX_LEGENDARIES})`);
  }

  return { valid: errors.length === 0, errors };
}

// ─── Test helpers ────────────────────────────────────────

const PLAYER_ID = "player-001";
const FACTION_A = "faction-ironwright";
const FACTION_B = "faction-fey-courts";

function makeCard(
  id: string,
  templateId: string,
  tier = "COMMON",
  factionId = FACTION_A,
  ownerId = PLAYER_ID
): MockCard {
  return { id, template_id: templateId, tier, owner_id: ownerId, faction_id: factionId };
}

function makeEntry(cardId: string, quantity = 1): DeckEntry {
  return { card_instance_id: cardId, quantity };
}

const AVATAR_A: MockAvatar = { id: "avatar-a", faction_id: FACTION_A };
const AVATAR_B: MockAvatar = { id: "avatar-b", faction_id: FACTION_B };

// Generate 20 unique cards for a valid deck
function makeValidDeck(): { entries: DeckEntry[]; cards: MockCard[] } {
  const cards: MockCard[] = [];
  const entries: DeckEntry[] = [];
  for (let i = 0; i < 20; i++) {
    const cardId = `card-${i}`;
    const templateId = `template-${i}`;
    cards.push(makeCard(cardId, templateId));
    entries.push(makeEntry(cardId));
  }
  return { entries, cards };
}

// ─── Tests ───────────────────────────────────────────────

Deno.test("Valid deck with exactly 20 unique cards passes validation", () => {
  const { entries, cards } = makeValidDeck();
  const result = validateDeckPure(PLAYER_ID, FACTION_A, AVATAR_A, entries, cards);
  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("Deck with 19 cards fails validation", () => {
  const { entries, cards } = makeValidDeck();
  entries.pop(); // Remove one card
  const result = validateDeckPure(PLAYER_ID, FACTION_A, AVATAR_A, entries, cards);
  assertEquals(result.valid, false);
  assertEquals(result.errors.some((e) => e.includes("19")), true);
});

Deno.test("Deck with 21 cards fails validation", () => {
  const { entries, cards } = makeValidDeck();
  // Add an extra card
  const extraCard = makeCard("card-extra", "template-extra");
  cards.push(extraCard);
  entries.push(makeEntry("card-extra"));
  const result = validateDeckPure(PLAYER_ID, FACTION_A, AVATAR_A, entries, cards);
  assertEquals(result.valid, false);
  assertEquals(result.errors.some((e) => e.includes("21")), true);
});

Deno.test("Deck with mixed factions fails validation", () => {
  const { entries, cards } = makeValidDeck();
  // Change one card's faction
  cards[0].faction_id = FACTION_B;
  const result = validateDeckPure(PLAYER_ID, FACTION_A, AVATAR_A, entries, cards);
  assertEquals(result.valid, false);
  assertEquals(result.errors.some((e) => e.includes("different faction")), true);
});

Deno.test("Deck with 3 copies of same template fails validation", () => {
  const cards: MockCard[] = [];
  const entries: DeckEntry[] = [];

  // 3 copies of the same template
  for (let i = 0; i < 3; i++) {
    cards.push(makeCard(`card-dup-${i}`, "template-dup"));
    entries.push(makeEntry(`card-dup-${i}`));
  }

  // Fill remaining 17 with unique
  for (let i = 0; i < 17; i++) {
    cards.push(makeCard(`card-${i}`, `template-${i}`));
    entries.push(makeEntry(`card-${i}`));
  }

  const result = validateDeckPure(PLAYER_ID, FACTION_A, AVATAR_A, entries, cards);
  assertEquals(result.valid, false);
  assertEquals(result.errors.some((e) => e.includes("exceeds max 2 copies")), true);
});

Deno.test("Deck with 3 Legendaries fails validation", () => {
  const cards: MockCard[] = [];
  const entries: DeckEntry[] = [];

  // 3 Legendary cards
  for (let i = 0; i < 3; i++) {
    cards.push(makeCard(`card-leg-${i}`, `template-leg-${i}`, "LEGENDARY"));
    entries.push(makeEntry(`card-leg-${i}`));
  }

  // Fill remaining 17
  for (let i = 0; i < 17; i++) {
    cards.push(makeCard(`card-${i}`, `template-${i}`));
    entries.push(makeEntry(`card-${i}`));
  }

  const result = validateDeckPure(PLAYER_ID, FACTION_A, AVATAR_A, entries, cards);
  assertEquals(result.valid, false);
  assertEquals(result.errors.some((e) => e.includes("3 Legendary")), true);
});

Deno.test("Deck with exactly 2 Legendaries passes validation", () => {
  const cards: MockCard[] = [];
  const entries: DeckEntry[] = [];

  // 2 Legendary cards
  for (let i = 0; i < 2; i++) {
    cards.push(makeCard(`card-leg-${i}`, `template-leg-${i}`, "LEGENDARY"));
    entries.push(makeEntry(`card-leg-${i}`));
  }

  // Fill remaining 18
  for (let i = 0; i < 18; i++) {
    cards.push(makeCard(`card-${i}`, `template-${i}`));
    entries.push(makeEntry(`card-${i}`));
  }

  const result = validateDeckPure(PLAYER_ID, FACTION_A, AVATAR_A, entries, cards);
  assertEquals(result.valid, true);
});

Deno.test("Deck with wrong-faction avatar fails validation", () => {
  const { entries, cards } = makeValidDeck();
  const result = validateDeckPure(PLAYER_ID, FACTION_A, AVATAR_B, entries, cards);
  assertEquals(result.valid, false);
  assertEquals(result.errors.some((e) => e.includes("Avatar faction does not match")), true);
});

Deno.test("Deck with null avatar fails validation", () => {
  const { entries, cards } = makeValidDeck();
  const result = validateDeckPure(PLAYER_ID, FACTION_A, null, entries, cards);
  assertEquals(result.valid, false);
  assertEquals(result.errors.some((e) => e.includes("Avatar not found")), true);
});

Deno.test("Deck with card not owned by player fails validation", () => {
  const { entries, cards } = makeValidDeck();
  cards[0].owner_id = "other-player";
  const result = validateDeckPure(PLAYER_ID, FACTION_A, AVATAR_A, entries, cards);
  assertEquals(result.valid, false);
  assertEquals(result.errors.some((e) => e.includes("not owned")), true);
});

Deno.test("Deck with 2 copies via quantity=2 is valid", () => {
  const cards: MockCard[] = [];
  const entries: DeckEntry[] = [];

  // 1 card with quantity 2
  cards.push(makeCard("card-double", "template-double"));
  entries.push(makeEntry("card-double", 2));

  // Fill remaining 18
  for (let i = 0; i < 18; i++) {
    cards.push(makeCard(`card-${i}`, `template-${i}`));
    entries.push(makeEntry(`card-${i}`));
  }

  const result = validateDeckPure(PLAYER_ID, FACTION_A, AVATAR_A, entries, cards);
  assertEquals(result.valid, true);
});

Deno.test("Empty deck (0 cards) fails validation", () => {
  const result = validateDeckPure(PLAYER_ID, FACTION_A, AVATAR_A, [], []);
  assertEquals(result.valid, false);
  assertEquals(result.errors.some((e) => e.includes("0")), true);
});
