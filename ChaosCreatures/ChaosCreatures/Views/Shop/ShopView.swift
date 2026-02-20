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
        .themedNavigationTitle("Shop")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink(value: ShopDestination.settings) {
                    ThemedGlyph(symbol: "gearshape.fill", size: 14, color: .textSecondary)
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
            // Chaos Dust — embossed metal plate
            ChaosDustView(amount: appState.player?.chaosDust ?? 0)

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
            Image("UIIcons/ui-crystal-shard")
                .renderingMode(.template)
                .resizable()
                .aspectRatio(contentMode: .fit)
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
                    iconAsset: "UIIcons/ui-chest-basic",
                    color: .rarityUncommon,
                    canAfford: (appState.player?.chaosDust ?? 0) >= 100,
                    onPurchase: { selectedPackType = .starter }
                )
                PackRow(
                    name: "Rare Pack",
                    description: "3 cards, guaranteed 1 Rare or better",
                    price: "250",
                    iconAsset: "UIIcons/ui-chest-rare",
                    color: .rarityRare,
                    canAfford: (appState.player?.chaosDust ?? 0) >= 250,
                    onPurchase: { selectedPackType = .rare }
                )
                PackRow(
                    name: "Epic Pack",
                    description: "3 cards, guaranteed 1 Epic or better",
                    price: "500",
                    iconAsset: "UIIcons/ui-chest-epic",
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
                Image("UIIcons/ui-crystal-shard")
                    .renderingMode(.template)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
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
                    .foregroundColor(tierPrimaryTextColor)
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
                .foregroundColor(tierSecondaryTextColor)

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
                    .foregroundColor(isCurrent ? .textTertiary : .textPrimary)
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
            ThemedGlyph(symbol: "checkmark", size: 10, weight: .bold, color: tierBenefitColor)
            Text(text)
                .font(CardFont.body(size: 12))
                .foregroundColor(tierSecondaryTextColor)
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
                ZStack {
                    Color(hex: "#1D2024")
                    Image("CardTextures/metal-iron")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .opacity(0.34)
                    Image("CardTextures/tex-cardstock-grain")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .opacity(0.12)
                }
            case .high:
                ZStack {
                    Color(hex: "#2A2418")
                    Image("CardTextures/metal-bronze")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .opacity(0.40)
                    Image("CardTextures/tex-parchment")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .opacity(0.16)
                }
            }
        }
    }

    private var tierBorderColor: Color {
        switch tier {
        case .free: return .borderDefault
        case .mid: return Color(hex: "#65707D")
        case .high: return Color(hex: "#A9823B")
        }
    }

    private var tierAccentColor: Color {
        switch tier {
        case .free: return Color(hex: "#8C6A2A")
        case .mid: return Color(hex: "#556477")
        case .high: return Color(hex: "#9A6A2A")
        }
    }

    private var tierPrimaryTextColor: Color {
        switch tier {
        case .free: return .textPrimary
        case .mid: return Color(hex: "#E3E0D7")
        case .high: return Color(hex: "#F2E5CF")
        }
    }

    private var tierSecondaryTextColor: Color {
        switch tier {
        case .free: return .textSecondary
        case .mid: return Color(hex: "#CFC6B7")
        case .high: return Color(hex: "#DECCAD")
        }
    }

    private var tierBenefitColor: Color {
        switch tier {
        case .free: return .healGreen
        case .mid: return Color(hex: "#93A8BF")
        case .high: return Color(hex: "#E4B85A")
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
                .renderingMode(.template)
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
                .foregroundColor(canAfford ? .textPrimary : .textDisabled)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.bgTertiary)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(canAfford ? color.opacity(0.62) : Color.bgQuaternary)
                        )
                        .overlay(
                            Image("CardTextures/tex-cardstock-grain")
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                                .opacity(0.10)
                        )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(canAfford ? color.opacity(0.45) : Color.borderDefault.opacity(0.5), lineWidth: 0.8)
                )
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
