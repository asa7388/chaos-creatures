// ShopView.swift
// Chaos Creatures
// Shop with subscription tiers, card packs, and shard purchases.
// Source: docs/design/07-ui-ux-specs.md Section 6

import SwiftUI

struct ShopView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Currency header
                currencyHeader

                // Subscription section
                subscriptionSection

                // Card packs section
                cardPacksSection

                // Shards section
                shardsSection
            }
        }
        .background(Color.bgPrimary)
        .navigationTitle("Shop")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink(value: ShopDestination.settings) {
                    Image(systemName: "gearshape")
                        .foregroundColor(.textSecondary)
                }
            }
        }
    }

    // MARK: - Currency Header

    private var currencyHeader: some View {
        HStack {
            // Chaos Dust
            HStack(spacing: 4) {
                Image(systemName: "sparkle")
                    .resizable()
                    .frame(width: 18, height: 18)
                    .foregroundColor(.tauntGold)
                Text("\(appState.player?.chaosDust ?? 0)")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.tauntGold)
            }

            Spacer()

            // Shard counts
            HStack(spacing: 10) {
                shardCounter(tier: .uncommon, count: 0)
                shardCounter(tier: .rare, count: 0)
                shardCounter(tier: .epic, count: 0)
                shardCounter(tier: .legendary, count: 0)
            }
        }
        .padding(.horizontal, 16)
        .frame(height: 52)
        .background(Color.bgSecondary)
    }

    private func shardCounter(tier: ShardTier, count: Int) -> some View {
        HStack(spacing: 3) {
            Image(systemName: "diamond.fill")
                .resizable()
                .frame(width: 14, height: 14)
                .foregroundColor(shardColor(tier))
            Text("\(count)")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.textSecondary)
        }
    }

    private func shardColor(_ tier: ShardTier) -> Color {
        switch tier {
        case .uncommon: return .rarityUncommon
        case .rare: return .rarityRare
        case .epic: return .rarityEpic
        case .legendary: return .rarityLegendary
        }
    }

    // MARK: - Subscription Section

    private var subscriptionSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Subscription")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.textPrimary)
                .padding(.horizontal, 16)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    SubscriptionCardItem(
                        tier: .free,
                        currentTier: appState.player?.subscriptionTier ?? .free
                    )
                    SubscriptionCardItem(
                        tier: .mid,
                        currentTier: appState.player?.subscriptionTier ?? .free
                    )
                    SubscriptionCardItem(
                        tier: .high,
                        currentTier: appState.player?.subscriptionTier ?? .free
                    )
                }
                .padding(.horizontal, 16)
            }
        }
        .padding(.vertical, 16)
    }

    // MARK: - Card Packs Section

    private var cardPacksSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Card Packs")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.textPrimary)
                .padding(.horizontal, 16)

            VStack(spacing: 8) {
                PackRow(
                    name: "Starter Pack",
                    description: "5 random cards from your faction",
                    price: "100 Dust",
                    icon: "gift.fill",
                    color: .rarityUncommon
                )
                PackRow(
                    name: "Rare Pack",
                    description: "3 cards, guaranteed 1 Rare or better",
                    price: "250 Dust",
                    icon: "star.fill",
                    color: .rarityRare
                )
                PackRow(
                    name: "Epic Pack",
                    description: "3 cards, guaranteed 1 Epic or better",
                    price: "500 Dust",
                    icon: "sparkles",
                    color: .rarityEpic
                )
            }
            .padding(.horizontal, 16)
        }
        .padding(.vertical, 16)
    }

    // MARK: - Shards Section

    private var shardsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Planar Shards")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.textPrimary)
                .padding(.horizontal, 16)

            Text("Shards are earned through gameplay. Use them to evolve your creatures.")
                .font(.system(size: 13))
                .foregroundColor(.textTertiary)
                .padding(.horizontal, 16)
        }
        .padding(.vertical, 16)
    }
}

// MARK: - Subscription Card Item

struct SubscriptionCardItem: View {
    let tier: SubscriptionTier
    let currentTier: SubscriptionTier

    private var isCurrent: Bool { tier == currentTier }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Tier name
            HStack {
                Text(tier.displayName)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.textPrimary)
                Spacer()
                if isCurrent {
                    Text("CURRENT")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.black)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color.tauntGold)
                        .cornerRadius(4)
                }
            }

            // Price
            Text(tierPrice)
                .font(.system(size: 15))
                .foregroundColor(.textSecondary)

            Divider()

            // Benefits
            VStack(alignment: .leading, spacing: 6) {
                benefitRow("Max \(tier.maxCardsPerFaction) cards per faction")
                benefitRow("\(tier.maxDeckSlots) deck slots")
                benefitRow("\(tier.modifierChoices) modifier choices")
                benefitRow("\(tier.shardQuality.rawValue.capitalized) shard quality")
            }

            Spacer()

            // Action button
            Button(action: {
                // StoreKit purchase
            }) {
                Text(isCurrent ? "Current Tier" : "Upgrade")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(isCurrent ? .textTertiary : .white)
                    .frame(maxWidth: .infinity, minHeight: 40)
                    .background(isCurrent ? Color.bgQuaternary : tierAccentColor)
                    .cornerRadius(8)
            }
            .disabled(isCurrent)
        }
        .padding(16)
        .frame(width: 220, height: 300)
        .background(tierBackground)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(tierBorderColor, lineWidth: 1)
        )
    }

    private func benefitRow(_ text: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: "checkmark")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(.healGreen)
            Text(text)
                .font(.system(size: 12))
                .foregroundColor(.textSecondary)
        }
    }

    private var tierPrice: String {
        switch tier {
        case .free: return "Free"
        case .mid: return "$6.99/month"
        case .high: return "$12.99/month"
        }
    }

    private var tierBackground: some View {
        Group {
            switch tier {
            case .free:
                Color.bgTertiary
            case .mid:
                LinearGradient(
                    colors: [Color(hex: "#0D47A1"), Color(hex: "#1565C0")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            case .high:
                LinearGradient(
                    colors: [Color(hex: "#E65100"), Color(hex: "#F57F17")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
        }
    }

    private var tierBorderColor: Color {
        switch tier {
        case .free: return .borderDefault
        case .mid: return .rarityRare
        case .high: return .tauntGold
        }
    }

    private var tierAccentColor: Color {
        switch tier {
        case .free: return .borderActive
        case .mid: return .rarityRare
        case .high: return .tauntGold
        }
    }
}

// MARK: - Pack Row

struct PackRow: View {
    let name: String
    let description: String
    let price: String
    let icon: String
    let color: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 22))
                .foregroundColor(color)
                .frame(width: 40, height: 40)
                .background(color.opacity(0.15))
                .cornerRadius(10)

            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.textPrimary)
                Text(description)
                    .font(.system(size: 12))
                    .foregroundColor(.textTertiary)
                    .lineLimit(1)
            }

            Spacer()

            Button(action: {
                // Purchase action
            }) {
                Text(price)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(color)
                    .cornerRadius(8)
            }
        }
        .padding(12)
        .cardBackground()
    }
}

#Preview {
    NavigationStack {
        ShopView()
    }
    .environment(AppState())
    .environment(AppRouter())
}
