// ShopView.swift
// Chaos Creatures
// Shop with subscription tiers, card packs, and shard purchases.
// Source: docs/design/07-ui-ux-specs.md Section 6

import SwiftUI

struct ShopView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router

    @State private var showSubscription = false
    @State private var selectedPackType: PackType?

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
        .background(
            ZStack {
                Color.bgPrimary
                Image("UIBackgrounds/bg-polished-stone")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
                    .opacity(0.30)
            }
        )
        .navigationTitle("Shop")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink(value: ShopDestination.settings) {
                    Image(systemName: "gearshape.fill")
                        .foregroundColor(.textSecondary)
                }
            }
        }
        .sheet(isPresented: $showSubscription) {
            SubscriptionView()
                .environment(appState)
        }
        .sheet(item: $selectedPackType) { packType in
            CardPackOpeningView(packType: packType)
                .environment(appState)
        }
    }

    // MARK: - Currency Header

    private var currencyHeader: some View {
        HStack {
            // Chaos Dust
            HStack(spacing: 6) {
                Image("StatIcons/chaos-mote-ironwright")
                    .resizable()
                    .frame(width: 22, height: 22)
                Text("\(appState.player?.chaosDust ?? 0)")
                    .font(CardFont.statNumber(size: 20))
                    .foregroundColor(.tauntGold)
            }

            Spacer()

            // Shard counts
            HStack(spacing: 10) {
                shardCounter(tier: .uncommon, count: appState.player?.shardsUncommon ?? 0)
                shardCounter(tier: .rare, count: appState.player?.shardsRare ?? 0)
                shardCounter(tier: .epic, count: appState.player?.shardsEpic ?? 0)
                shardCounter(tier: .legendary, count: appState.player?.shardsLegendary ?? 0)
            }
        }
        .padding(.horizontal, 16)
        .frame(height: 52)
        .background(
            ZStack {
                Color.bgSecondary
                Image("CardTextures/tex-cardstock-grain")
                    .resizable()
                    .opacity(0.2)
            }
        )
    }

    private func shardCounter(tier: ShardTier, count: Int) -> some View {
        HStack(spacing: 3) {
            Image("StatIcons/instability-indicator")
                .resizable()
                .frame(width: 14, height: 14)
                .foregroundStyle(shardColor(tier))
            Text("\(count)")
                .font(CardFont.statNumber(size: 14))
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
            HStack {
                Text("Subscription")
                    .font(CardFont.cardName(size: 16))
                    .foregroundColor(.textPrimary)

                Spacer()

                // Current tier badge
                let tier = appState.player?.subscriptionTier ?? .free
                Text(tier.displayName)
                    .font(CardFont.bodyBold(size: 11))
                    .foregroundColor(tier == .free ? .textTertiary : .black)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(tier == .free ? Color.bgQuaternary : Color.tauntGold)
                    .cornerRadius(4)
            }
            .padding(.horizontal, 16)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    SubscriptionCardItem(
                        tier: .free,
                        currentTier: appState.player?.subscriptionTier ?? .free,
                        onUpgrade: { showSubscription = true }
                    )
                    SubscriptionCardItem(
                        tier: .mid,
                        currentTier: appState.player?.subscriptionTier ?? .free,
                        onUpgrade: { showSubscription = true }
                    )
                    SubscriptionCardItem(
                        tier: .high,
                        currentTier: appState.player?.subscriptionTier ?? .free,
                        onUpgrade: { showSubscription = true }
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
                .font(CardFont.cardName(size: 16))
                .foregroundColor(.textPrimary)
                .padding(.horizontal, 16)

            VStack(spacing: 8) {
                PackRow(
                    name: "Starter Pack",
                    description: "5 random cards from your faction",
                    price: "100",
                    iconAsset: "StatIcons/rarity-common",
                    color: .rarityUncommon,
                    canAfford: (appState.player?.chaosDust ?? 0) >= 100,
                    onPurchase: { selectedPackType = .starter }
                )
                PackRow(
                    name: "Rare Pack",
                    description: "3 cards, guaranteed 1 Rare or better",
                    price: "250",
                    iconAsset: "StatIcons/rarity-rare",
                    color: .rarityRare,
                    canAfford: (appState.player?.chaosDust ?? 0) >= 250,
                    onPurchase: { selectedPackType = .rare }
                )
                PackRow(
                    name: "Epic Pack",
                    description: "3 cards, guaranteed 1 Epic or better",
                    price: "500",
                    iconAsset: "StatIcons/rarity-epic",
                    color: .rarityEpic,
                    canAfford: (appState.player?.chaosDust ?? 0) >= 500,
                    onPurchase: { selectedPackType = .epic }
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
                .font(CardFont.cardName(size: 16))
                .foregroundColor(.textPrimary)
                .padding(.horizontal, 16)

            HStack(spacing: 12) {
                Image("StatIcons/instability-indicator")
                    .resizable()
                    .frame(width: 28, height: 28)
                    .foregroundColor(.appAccent)

                Text("Shards are earned through gameplay. Use them to evolve your creatures.")
                    .font(CardFont.body(size: 13))
                    .foregroundColor(.textTertiary)
            }
            .padding(16)
            .parchmentPanel()
            .padding(.horizontal, 16)
        }
        .padding(.vertical, 16)
    }
}

// MARK: - Subscription Card Item

struct SubscriptionCardItem: View {
    let tier: SubscriptionTier
    let currentTier: SubscriptionTier
    var onUpgrade: () -> Void = {}

    private var isCurrent: Bool { tier == currentTier }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Tier name
            HStack {
                Text(tier.displayName)
                    .font(CardFont.cardName(size: 18))
                    .foregroundColor(.textPrimary)
                Spacer()
                if isCurrent {
                    Text("CURRENT")
                        .font(CardFont.bodyBold(size: 10))
                        .foregroundColor(.textDark)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color.tauntGold)
                        .cornerRadius(4)
                }
            }

            // Price
            Text(tierPrice)
                .font(CardFont.body(size: 15))
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
            Button(action: onUpgrade) {
                Text(isCurrent ? "Current Tier" : "Upgrade")
                    .font(CardFont.bodyBold(size: 14))
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
                .font(.system(size: 10, weight: .bold))  // SF Symbol icon size - keep as-is
                .foregroundColor(.healGreen)
            Text(text)
                .font(CardFont.body(size: 12))
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
                ZStack {
                    Color.bgTertiary
                    Image("UIComponents/ui-panel-leather")
                        .resizable()
                        .opacity(0.3)
                }
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
    let iconAsset: String
    let color: Color
    var canAfford: Bool = true
    var onPurchase: () -> Void = {}

    var body: some View {
        HStack(spacing: 12) {
            Image(iconAsset)
                .resizable()
                .scaledToFit()
                .frame(width: 28, height: 28)
                .foregroundColor(color)
                .frame(width: 40, height: 40)
                .background(color.opacity(0.15))
                .cornerRadius(10)

            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(CardFont.bodyBold(size: 15))
                    .foregroundColor(.textPrimary)
                Text(description)
                    .font(CardFont.body(size: 12))
                    .foregroundColor(.textTertiary)
                    .lineLimit(1)
            }

            Spacer()

            Button(action: onPurchase) {
                HStack(spacing: 4) {
                    Image("StatIcons/chaos-mote-ironwright")
                        .resizable()
                        .frame(width: 14, height: 14)
                    Text(price)
                        .font(CardFont.bodyBold(size: 13))
                }
                .foregroundColor(canAfford ? .white : .textDisabled)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(canAfford ? color : Color.bgQuaternary)
                .cornerRadius(8)
            }
            .disabled(!canAfford)
        }
        .padding(12)
        .leatherPanel()
    }
}

#Preview {
    NavigationStack {
        ShopView()
    }
    .environment(AppState())
    .environment(AppRouter())
}
