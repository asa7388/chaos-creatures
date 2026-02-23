// SmokeTestCardView.swift
// Chaos Creatures
//
// Phase 2 Smoke Test Gate — renders one card per rarity (5) and one per card type (4)
// in a scrollable grid to visually confirm:
//   - Zone-stack layout renders correctly for all 4 card type variants
//   - All font accessors (CardFont.*) are reachable
//   - Rarity color bar visible at bottom of each card
//   - Planar Ruin passive/destruction panel renders
//   - No compilation errors on SmokeTestCardView
//
// This is a DEBUG-only file. It is excluded from Release builds via #if DEBUG.
// Add to Xcode project under ChaosCreatures/Views/Debug/SmokeTestCardView.swift

import SwiftUI

#if DEBUG

struct SmokeTestCardView: View {

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {

                    Text("Smoke Test — Phase 2 Card Layout")
                        .font(.headline)
                        .padding(.horizontal)

                    // MARK: Rarity Variants
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Rarity Variants (Common → Legendary)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding(.horizontal)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 16) {
                                ForEach(rarityTestCards, id: \.name) { data in
                                    VStack(spacing: 4) {
                                        CardFrameView(data: data, cardWidth: 112, cardHeight: 157)
                                            .frame(width: 90, height: 126)
                                        Text(data.tier.displayName)
                                            .font(.caption2)
                                            .foregroundColor(.secondary)
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }
                    }

                    Divider()
                        .padding(.horizontal)

                    // MARK: Card Type Variants
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Card Type Variants")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding(.horizontal)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 16) {
                                ForEach(typeTestCards, id: \.name) { data in
                                    VStack(spacing: 4) {
                                        CardFrameView(data: data, cardWidth: 112, cardHeight: 157)
                                            .frame(width: 90, height: 126)
                                        Text(data.cardType.displayName)
                                            .font(.caption2)
                                            .foregroundColor(.secondary)
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }
                    }

                    Divider()
                        .padding(.horizontal)

                    // MARK: Detail-size cards (two columns)
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Detail Size Variants")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding(.horizontal)

                        LazyVGrid(
                            columns: [
                                GridItem(.flexible(), spacing: 16),
                                GridItem(.flexible(), spacing: 16)
                            ],
                            spacing: 16
                        ) {
                            ForEach(detailTestCards, id: \.name) { data in
                                CardFrameView(data: data, cardWidth: 280, cardHeight: 392)
                                    .frame(width: 200)
                            }
                        }
                        .padding(.horizontal)
                    }

                    Spacer(minLength: 40)
                }
                .padding(.top)
            }
            .navigationTitle("Smoke Test")
            .navigationBarTitleDisplayMode(.inline)
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - Rarity Test Cards (5 — one per rarity, all creatures, fey faction)

    var rarityTestCards: [CardDisplayData] {
        [
            CardDisplayData(
                name: "Rust Golem",
                artUrl: nil,
                manaCost: 2,
                attack: 2,
                health: 3,
                instability: 4,
                tier: .common,
                cardType: .creature,
                faction: .fey,
                keywords: [.shield],
                flavorText: "Forged in forgotten workshops.",
                abilityText: "Shield: Prevents 1 damage."
            ),
            CardDisplayData(
                name: "Fey Wisp",
                artUrl: nil,
                manaCost: 3,
                attack: 1,
                health: 2,
                instability: 6,
                tier: .uncommon,
                cardType: .creature,
                faction: .fey,
                keywords: [.flying],
                flavorText: "Drifts on unseen currents.",
                abilityText: "Flying: Can only be blocked by creatures with Flying or Reach."
            ),
            CardDisplayData(
                name: "Demonic Harbinger",
                artUrl: nil,
                manaCost: 4,
                attack: 5,
                health: 4,
                instability: 8,
                tier: .rare,
                cardType: .creature,
                faction: .demonic,
                keywords: [.deathtouch],
                flavorText: "Its touch is the final judgment.",
                abilityText: "Deathtouch: Any damage this deals destroys the target."
            ),
            CardDisplayData(
                name: "Celestial Arbiter",
                artUrl: nil,
                manaCost: 5,
                attack: 6,
                health: 5,
                instability: 10,
                tier: .epic,
                cardType: .creature,
                faction: .celestial,
                keywords: [.ward, .flying],
                flavorText: "It sees all debts and all transgressions.",
                abilityText: "Ward: Cannot be targeted by opponent modifiers for 1 turn. Flying."
            ),
            CardDisplayData(
                name: "The Endless One",
                artUrl: nil,
                manaCost: 7,
                attack: 8,
                health: 7,
                instability: 15,
                tier: .legendary,
                cardType: .creature,
                faction: .endless,
                keywords: [.lifesteal, .piercing],
                flavorText: "Death cannot hold what never truly lived.",
                abilityText: "Lifesteal. Piercing: Excess damage dealt to the defending player."
            )
        ]
    }

    // MARK: - Card Type Test Cards (4 — one per CardType)

    var typeTestCards: [CardDisplayData] {
        [
            // Creature
            CardDisplayData(
                name: "Rust Golem",
                artUrl: nil,
                manaCost: 2,
                attack: 2,
                health: 3,
                instability: 4,
                tier: .common,
                cardType: .creature,
                faction: .fey,
                keywords: [.shield],
                flavorText: "Forged in forgotten workshops.",
                abilityText: "Shield: Prevents 1 damage."
            ),
            // Spell
            CardDisplayData(
                name: "Chaos Surge",
                artUrl: nil,
                manaCost: 2,
                attack: nil,
                health: nil,
                instability: nil,
                tier: .common,
                cardType: .spell,
                faction: .demonic,
                keywords: [],
                flavorText: "The air tears itself apart.",
                abilityText: "Deal 3 damage to any target."
            ),
            // Stabilizer
            CardDisplayData(
                name: "Arcane Anchor",
                artUrl: nil,
                manaCost: 0,
                attack: nil,
                health: nil,
                instability: nil,
                tier: .uncommon,
                cardType: .stabilizer,
                faction: .ironwright,
                keywords: [],
                flavorText: "Holds the weave in place.",
                abilityText: "Your cards cost 1 less."
            ),
            // Planar Ruin
            CardDisplayData(
                name: "Ruined Sanctum",
                artUrl: nil,
                manaCost: 4,
                attack: nil,
                health: 12,
                instability: nil,
                tier: .rare,
                cardType: .planarRuin,
                faction: .celestial,
                keywords: [],
                flavorText: "Once a place of worship, now a monument to ruin.",
                ruinPassiveText: "Each turn, gain 1 Chaos Dust.",
                ruinDestructionPenaltyText: "Opponent gains 3 Chaos Dust."
            )
        ]
    }

    // MARK: - Detail-size cards (Legend + Ruin at larger size for visual audit)

    var detailTestCards: [CardDisplayData] {
        [
            CardDisplayData(
                name: "The Endless One",
                artUrl: nil,
                manaCost: 7,
                attack: 8,
                health: 7,
                instability: 15,
                tier: .legendary,
                cardType: .creature,
                faction: .endless,
                keywords: [.lifesteal, .piercing],
                flavorText: "Death cannot hold what never truly lived.",
                abilityText: "Lifesteal. Piercing: Excess damage dealt to the defending player.",
                collectorNumber: "001",
                setCode: "CHA"
            ),
            CardDisplayData(
                name: "Ruined Sanctum",
                artUrl: nil,
                manaCost: 4,
                attack: nil,
                health: 12,
                instability: nil,
                tier: .rare,
                cardType: .planarRuin,
                faction: .celestial,
                keywords: [],
                flavorText: "Once a place of worship.",
                ruinPassiveText: "Each turn, gain 1 Chaos Dust.",
                ruinDestructionPenaltyText: "Opponent gains 3 Chaos Dust.",
                collectorNumber: "002",
                setCode: "CHA"
            )
        ]
    }
}

// MARK: - Previews

struct SmokeTestCardView_Previews: PreviewProvider {
    static var previews: some View {
        SmokeTestCardView()
            .previewDevice("iPhone 16 Pro")
            .previewDisplayName("iPhone 16 Pro")

        SmokeTestCardView()
            .previewDevice("iPad Pro 13-inch (M4)")
            .previewDisplayName("iPad Pro 13-inch (M4)")
    }
}

#endif
