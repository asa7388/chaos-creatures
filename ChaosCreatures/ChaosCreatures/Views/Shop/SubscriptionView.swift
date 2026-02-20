// SubscriptionView.swift
// Chaos Creatures
// StoreKit 2 paywall for subscription tiers.
// Full-screen comparison of Free / Chaos Adept / Chaos Master plans.
// Wired to StoreKitService.shared for product loading, purchasing, and restore.
// Source: docs/design/09-monetization-details.md, 07-ui-ux-specs.md Section 6

import SwiftUI
import StoreKit

struct SubscriptionView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var isPurchasing = false
    @State private var purchaseError: String?
    @State private var selectedTier: SubscriptionTier = .mid

    private let storeKit = StoreKitService.shared

    private var currentTier: SubscriptionTier {
        appState.player?.subscriptionTier ?? .free
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.bgPrimary.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Hero header
                        heroHeader

                        // Tier comparison cards
                        tierComparisonSection

                        // Feature comparison table
                        featureComparisonTable

                        // FAQ
                        faqSection

                        // Legal
                        legalText
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 120)
                }

                // Sticky purchase button
                VStack {
                    Spacer()
                    purchaseButton
                }
            }
            .navigationTitle("Choose Your Plan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") { dismiss() }
                        .foregroundColor(.textSecondary)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Restore") {
                        Task { await restorePurchases() }
                    }
                    .font(CardFont.body(size: 14))
                    .foregroundColor(.orderBlue)
                }
            }
            .task {
                await storeKit.loadProducts()
            }
            .alert("Purchase Error", isPresented: .constant(purchaseError != nil)) {
                Button("OK") { purchaseError = nil }
            } message: {
                if let error = purchaseError {
                    Text(error)
                }
            }
        }
    }

    // MARK: - Hero Header

    private var heroHeader: some View {
        VStack(spacing: 12) {
            Image("UIIcons/ui-evolution-sparkle")
                .renderingMode(.template)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 44, height: 44)
                .foregroundColor(.tauntGold)

            Text("Unlock Your Potential")
                .font(CardFont.displayTitle(size: 24))
                .foregroundColor(.textPrimary)

            Text("More cards, more decks, more modifier choices.\nLevel up your Chaos Creatures experience.")
                .font(CardFont.body(size: 14))
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 16)
    }

    // MARK: - Tier Comparison

    private var tierComparisonSection: some View {
        HStack(spacing: 8) {
            tierOption(tier: .free)
            tierOption(tier: .mid)
            tierOption(tier: .high)
        }
    }

    private func tierOption(tier: SubscriptionTier) -> some View {
        let isSelected = selectedTier == tier
        let isCurrent = currentTier == tier

        return Button(action: {
            withAnimation(.easeInOut(duration: 0.2)) {
                selectedTier = tier
            }
        }) {
            VStack(spacing: 8) {
                // Tier icon
                Image(tierIcon(tier))
                    .renderingMode(.template)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 24, height: 24)
                    .foregroundColor(tierColor(tier))

                // Tier name
                Text(tier.displayName)
                    .font(CardFont.bodyBold(size: 13))
                    .foregroundColor(.textPrimary)

                // Price
                Text(tierPriceLabel(tier))
                    .font(CardFont.body(size: 11))
                    .foregroundColor(.textSecondary)

                // Current badge
                if isCurrent {
                    Text("CURRENT")
                        .font(CardFont.bodyBold(size: 9))
                        .foregroundColor(.textDark)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.tauntGold)
                        .cornerRadius(4)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(isSelected ? tierColor(tier).opacity(0.12) : Color.bgTertiary)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? tierColor(tier) : Color.borderDefault, lineWidth: isSelected ? 2 : 1)
            )
        }
    }

    // MARK: - Feature Comparison Table

    private var featureComparisonTable: some View {
        VStack(spacing: 0) {
            featureRow(
                label: "Cards per Faction",
                free: "50",
                mid: "100",
                high: "200"
            )
            featureRow(
                label: "Deck Slots",
                free: "3",
                mid: "6",
                high: "10"
            )
            featureRow(
                label: "Modifier Choices",
                free: "2",
                mid: "3",
                high: "4"
            )
            featureRow(
                label: "Shard Quality",
                free: "Planar",
                mid: "Refined",
                high: "Prismatic"
            )
            featureRow(
                label: "Priority Matchmaking",
                free: nil,
                mid: nil,
                high: "check"
            )
            featureRow(
                label: "Exclusive Avatars",
                free: nil,
                mid: "check",
                high: "check"
            )
            featureRow(
                label: "Season Bonus XP",
                free: nil,
                mid: "+15%",
                high: "+30%"
            )
        }
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.borderDefault, lineWidth: 1)
        )
    }

    private func featureRow(label: String, free: String?, mid: String?, high: String?) -> some View {
        HStack(spacing: 0) {
            // Label column
            Text(label)
                .font(CardFont.body(size: 12))
                .foregroundColor(.textSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.leading, 12)

            // Free column
            featureCell(value: free, tier: .free)
                .frame(width: 60)

            // Mid column
            featureCell(value: mid, tier: .mid)
                .frame(width: 60)

            // High column
            featureCell(value: high, tier: .high)
                .frame(width: 60)
        }
        .frame(height: 40)
        .background(Color.bgSecondary)
    }

    private func featureCell(value: String?, tier: SubscriptionTier) -> some View {
        Group {
            if let value {
                if value == "check" {
                    ThemedGlyph(symbol: "checkmark", size: 12, weight: .bold, color: .healGreen)
                } else {
                    Text(value)
                        .font(CardFont.bodyBold(size: 12))
                        .foregroundColor(selectedTier == tier ? tierColor(tier) : .textPrimary)
                }
            } else {
                Text("--")
                    .font(CardFont.body(size: 12))
                    .foregroundColor(.textDisabled)
            }
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - FAQ

    private var faqSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("FAQ")
                .font(CardFont.cardName(size: 16))
                .foregroundColor(.textPrimary)

            faqItem(
                question: "Can I cancel anytime?",
                answer: "Yes. Cancel through your Apple ID subscriptions. You keep benefits until the billing period ends."
            )
            faqItem(
                question: "What happens to my extra cards if I downgrade?",
                answer: "You keep all cards you've collected. You just can't acquire new ones beyond the lower tier's limit."
            )
            faqItem(
                question: "Do I lose deck slots if I downgrade?",
                answer: "Your decks are preserved but you can only edit decks within your new slot limit."
            )
        }
    }

    private func faqItem(question: String, answer: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(question)
                .font(CardFont.bodyBold(size: 13))
                .foregroundColor(.textPrimary)
            Text(answer)
                .font(CardFont.body(size: 12))
                .foregroundColor(.textTertiary)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.bgTertiary)
        .cornerRadius(8)
    }

    // MARK: - Legal

    private var legalText: some View {
        Text("Payment is charged to your Apple ID account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in Settings > Apple ID > Subscriptions.")
            .font(CardFont.body(size: 10))
            .foregroundColor(.textDisabled)
            .multilineTextAlignment(.center)
            .padding(.top, 8)
    }

    // MARK: - Purchase Button

    private var purchaseButton: some View {
        VStack(spacing: 0) {
            Divider()
                .background(Color.borderDefault)

            VStack(spacing: 8) {
                if selectedTier == .free || selectedTier == currentTier {
                    Button(action: { dismiss() }) {
                        Text(selectedTier == currentTier ? "Current Plan" : "Continue with Free")
                            .font(CardFont.bodyBold(size: 16))
                            .foregroundColor(.textSecondary)
                            .frame(maxWidth: .infinity, minHeight: 50)
                            .background(Color.bgQuaternary)
                            .cornerRadius(12)
                    }
                } else {
                    Button(action: {
                        Task { await purchase() }
                    }) {
                        Group {
                            if isPurchasing {
                                ChaosMoteSpinner(size: 20, tint: .textDark)
                            } else {
                                Text("Subscribe to \(selectedTier.displayName) - \(tierPriceLabel(selectedTier))")
                                    .font(CardFont.bodyBold(size: 16))
                                    .foregroundColor(.textDark)
                            }
                        }
                        .frame(maxWidth: .infinity, minHeight: 50)
                        .background(tierColor(selectedTier))
                        .cornerRadius(12)
                    }
                    .disabled(isPurchasing)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.bgSecondary)
        }
    }

    // MARK: - StoreKit 2 (via StoreKitService)

    private func purchase() async {
        guard selectedTier != .free else { return }

        isPurchasing = true
        defer { isPurchasing = false }

        do {
            let transaction = try await storeKit.purchaseSubscription(tier: selectedTier)

            if transaction != nil {
                // Purchase succeeded - refresh player data from backend
                await appState.refreshPlayer()
                appState.showToast("Welcome to \(selectedTier.displayName)!", type: .success)
                dismiss()
            }
            // If nil, user cancelled - do nothing
        } catch StoreKitPurchaseError.pending {
            purchaseError = "Purchase is pending approval."
        } catch StoreKitPurchaseError.productNotFound {
            purchaseError = "Product not found. Please try again later."
        } catch StoreKitPurchaseError.failedVerification {
            purchaseError = "Transaction verification failed."
        } catch {
            purchaseError = "Purchase failed: \(error.localizedDescription)"
        }
    }

    private func restorePurchases() async {
        isPurchasing = true
        defer { isPurchasing = false }

        do {
            try await storeKit.restorePurchases()
            await appState.refreshPlayer()
            appState.showToast("Purchases restored", type: .success)
        } catch {
            purchaseError = "Restore failed: \(error.localizedDescription)"
        }
    }

    // MARK: - Helpers

    private func tierIcon(_ tier: SubscriptionTier) -> String {
        switch tier {
        case .free: return "UIIcons/ui-tier-free"
        case .mid: return "UIIcons/ui-tier-adept"
        case .high: return "UIIcons/ui-tier-master"
        }
    }

    private func tierColor(_ tier: SubscriptionTier) -> Color {
        switch tier {
        case .free: return .textSecondary
        case .mid: return .rarityRare
        case .high: return .tauntGold
        }
    }

    private func tierPriceLabel(_ tier: SubscriptionTier) -> String {
        switch tier {
        case .free:
            return "Free"
        case .mid:
            if let product = storeKit.subscriptionProduct(for: .mid) {
                return product.displayPrice + "/mo"
            }
            return "$6.99/mo"
        case .high:
            if let product = storeKit.subscriptionProduct(for: .high) {
                return product.displayPrice + "/mo"
            }
            return "$12.99/mo"
        }
    }
}

// MARK: - Store Error

enum StoreError: LocalizedError {
    case failedVerification

    var errorDescription: String? {
        switch self {
        case .failedVerification:
            return "Transaction verification failed."
        }
    }
}

#Preview {
    SubscriptionView()
        .environment(AppState())
}
