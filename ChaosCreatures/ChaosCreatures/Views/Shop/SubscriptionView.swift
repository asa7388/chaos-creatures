// SubscriptionView.swift
// Chaos Creatures
// StoreKit 2 paywall for subscription tiers.
// Full-screen comparison of Free / Chaos Adept / Chaos Master plans.
// Source: docs/design/09-monetization-details.md, 07-ui-ux-specs.md Section 6

import SwiftUI
import StoreKit

struct SubscriptionView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var products: [Product] = []
    @State private var isLoading = true
    @State private var isPurchasing = false
    @State private var purchaseError: String?
    @State private var selectedTier: SubscriptionTier = .mid

    // StoreKit product identifiers
    private enum ProductID {
        static let mid = "com.chaoscreatures.sub.adept"
        static let high = "com.chaoscreatures.sub.master"
        static let allIDs: Set<String> = [mid, high]
    }

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
                    .font(.system(size: 14))
                    .foregroundColor(.orderBlue)
                }
            }
            .task {
                await loadProducts()
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
            Image(systemName: "sparkles")
                .font(.system(size: 44))
                .foregroundColor(.tauntGold)

            Text("Unlock Your Potential")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.textPrimary)

            Text("More cards, more decks, more modifier choices.\nLevel up your Chaos Creatures experience.")
                .font(.system(size: 14))
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
                Image(systemName: tierIcon(tier))
                    .font(.system(size: 24))
                    .foregroundColor(tierColor(tier))

                // Tier name
                Text(tier.displayName)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.textPrimary)

                // Price
                Text(tierPriceLabel(tier))
                    .font(.system(size: 11))
                    .foregroundColor(.textSecondary)

                // Current badge
                if isCurrent {
                    Text("CURRENT")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.black)
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
                .font(.system(size: 12, weight: .medium))
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
                    Image(systemName: "checkmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.healGreen)
                } else {
                    Text(value)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(selectedTier == tier ? tierColor(tier) : .textPrimary)
                }
            } else {
                Text("--")
                    .font(.system(size: 12))
                    .foregroundColor(.textDisabled)
            }
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - FAQ

    private var faqSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("FAQ")
                .font(.system(size: 16, weight: .bold))
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
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.textPrimary)
            Text(answer)
                .font(.system(size: 12))
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
            .font(.system(size: 10))
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
                            .font(.system(size: 16, weight: .semibold))
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
                                ProgressView()
                                    .tint(.black)
                            } else {
                                Text("Subscribe to \(selectedTier.displayName) - \(tierPriceLabel(selectedTier))")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.black)
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

    // MARK: - StoreKit 2

    private func loadProducts() async {
        isLoading = true
        defer { isLoading = false }

        do {
            products = try await Product.products(for: ProductID.allIDs)
                .sorted { $0.price < $1.price }
        } catch {
            purchaseError = "Failed to load products: \(error.localizedDescription)"
        }
    }

    private func purchase() async {
        let productId: String
        switch selectedTier {
        case .mid: productId = ProductID.mid
        case .high: productId = ProductID.high
        case .free: return
        }

        guard let product = products.first(where: { $0.id == productId }) else {
            purchaseError = "Product not found. Please try again."
            return
        }

        isPurchasing = true
        defer { isPurchasing = false }

        do {
            let result = try await product.purchase()

            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                await transaction.finish()

                // Update subscription on backend
                try await SupabaseService.shared.callFunction(
                    "player/update-subscription",
                    body: ["tier": selectedTier.rawValue, "transaction_id": transaction.id] as [String: Any]
                )

                // Refresh player data
                await appState.refreshPlayer()
                appState.showToast("Welcome to \(selectedTier.displayName)!", type: .success)
                dismiss()

            case .userCancelled:
                break

            case .pending:
                purchaseError = "Purchase is pending approval."

            @unknown default:
                purchaseError = "Unknown purchase result."
            }
        } catch {
            purchaseError = "Purchase failed: \(error.localizedDescription)"
        }
    }

    private func restorePurchases() async {
        isPurchasing = true
        defer { isPurchasing = false }

        do {
            try await AppStore.sync()
            await appState.refreshPlayer()
            appState.showToast("Purchases restored", type: .success)
        } catch {
            purchaseError = "Restore failed: \(error.localizedDescription)"
        }
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.failedVerification
        case .verified(let safe):
            return safe
        }
    }

    // MARK: - Helpers

    private func tierIcon(_ tier: SubscriptionTier) -> String {
        switch tier {
        case .free: return "person.fill"
        case .mid: return "bolt.fill"
        case .high: return "crown.fill"
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
            if let product = products.first(where: { $0.id == ProductID.mid }) {
                return product.displayPrice + "/mo"
            }
            return "$6.99/mo"
        case .high:
            if let product = products.first(where: { $0.id == ProductID.high }) {
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
