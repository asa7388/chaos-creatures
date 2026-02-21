# Stabilizer Docs Checkpoint
## Status: complete
## Files Updated
- 01-battle-mechanics.md — complete
- 02-card-data-model.md — complete
- 00-game-design-master.md — complete
- GAME_MECHANICS_GUIDE.md — complete
## Notes
All four files updated successfully.

### 01-battle-mechanics.md changes:
- Appended revision log entry (2026-02-20)
- Phase 1 Start of Turn: removed "stabilizer auras" from the effects list
- Phase 5 Main Phase: replaced old stabilizer play rule with new free/stability-zone/one-per-turn rule; added ACTIVATE_STABILIZER action; updated board slot limit text
- Section 11 (Stabilizer & Manipulation Cards): completely rewritten — new Stability Zone Rules, new Launch Stabilizer Cards table with activated effects and cooldowns, updated Strategic Role paragraph, updated Stabilizer count sentence
- Section 12 (Stabilizer/Manipulation Card Ranges): table rewritten to show activated effects and stability zone column instead of old HP/passive-effect columns
- Section 13 (How Ruins Differ from Stabilizers): table updated with new properties (free, 0 motes, stability zone, activated vs passive, no field limit on stability zone, energy earning row added)
- Section 10 (Spell Framework): deck size 20→30 in the "Decks are X cards" line
- Section 15 (Starter Decks): updated "20-card starter deck" headers to "30-card"; updated stabilizer table rows to show 0 mote cost and new effect format; updated deck statistics notes
- Ruin Start-of-Turn: removed "stabilizer auras" from that Phase 1 reference

### 02-card-data-model.md changes:
- Appended revision log entry (2026-02-20)
- Deck.card_entries comment: added stabilizer
- Deck total: 20→30 (inline comment and validation rule)
- CardTemplate: added activated_effect? field; updated spell_effect comment; added note that mana_cost is always 0 for stabilizers; rewrote the stabilizer note at the bottom of Section 1
- Added BattleStabilizer type with instance_id, template_id, name, art_url, stabilizer_type, activated_effect, is_on_cooldown, zone_index
- Added StabilizerEffect discriminated union documentation (4 types: ADJUST_INSTABILITY, DOUBLE_AVATAR_MODIFIER, CHOOSE_EVENT_TYPE, ON_CHAOS_BUFF_HIGHEST_ATK)
- BattlePlayer: added stability_zone: BattleStabilizer[] and stabilizers_played_this_turn: number
- Implementation notes: added stabilizer rules note and energy earning note (CREATURE/PLANAR_RUIN earn energy; STABILIZER/SPELL do not)
- Section 22 (Starter Deck Card Templates): updated from 20-card to 30-card

### 00-game-design-master.md changes:
- Appended revision log entry (2026-02-20)
- Onboarding: 20-card → 30-card trial decks; 20 Commons → 30 cards owned
- Chaos Energy: updated to say creatures and ruins earn energy (not all 20 cards)
- Evolution note: updated from "All 20 cards" to "All creatures and Planar Ruins"
- Board section: split stabilizer/ruins note — ruins occupy slots, stabilizers go to stability zone
- Turn Structure Step 1: removed stabilizer auras; added cooldown reset note
- Turn Structure Step 5: updated main phase description for free stabilizers and activation
- Deck Construction Rules: 20→30
- Section 11 header rewritten (stability zone, free, activated ability, cooldown)
- Section 11 table: 4 columns (Name/CM Cost/Effect/HP) → 3 columns (Name/CM Cost/Activated Effect); all CM costs 0, all effects updated to activated form
- Section 11 Strategic Role paragraph: rewritten for slot-free design
- Deck builder "14/20 cards" → "22/30 cards"
- Validation: "Fewer than 20" → "Fewer than 30"
- Starter Deck Composition: 20→30, updated card counts (13→22 creatures, 2→3 stabilizers)
- No land/resource cards line: minor cleanup
- Confirmed decisions table: Deck size, Stabilizers, Evolution energy, Onboarding trial decks all updated

### GAME_MECHANICS_GUIDE.md changes:
- Part 2 Deck Rules: 20→30 cards
- Stabilizers card type description: updated to describe stability zone and activated ability
- Resources: "20-card deck" → "30-card deck"
- Main Phase step 5: updated for free stabilizers and activation
- Part 11 (Stabilizers and Manipulation): completely rewritten with new table (Name/Cost FREE/Activated Effect/Cooldown) and updated strategic notes
- How Cards Earn Evolution Energy: "All 20 cards" → "All creatures and Planar Ruins"
- Part 12 Four Progression Tracks: updated Card Veterancy note
- Onboarding: 20-card → 30-card trial decks
- Quick Reference Evolution table note: updated
- Deck Construction Limits: 20→30; added stabilizer note
