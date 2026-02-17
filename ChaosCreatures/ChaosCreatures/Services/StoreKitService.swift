// StoreKitService.swift
// Chaos Creatures
// StoreKit 2 subscription management. No RevenueCat.
// Handles product fetching, purchase, restore, and transaction observation.
// Source: docs/design/09-monetization-details.md, 06-technical-architecture.md

import Foundation
import StoreKit

@MainActor @Observable
final class StoreKitService {
    static let shared = StoreKitService()

    // MARK: - Product IDs

    // Product IDs must match App Store Connect configuration.
    // Source: docs/design/09-monetization-details.md Section 2.
    enum ProductID {
        static let midMonthly = "com.chaoscreatures.app.sub_mid_monthly_699"
        static let midAnnual = "com.chaoscreatures.app.sub_mid_annual_5599"
        static let highMonthly = "com.chaoscreatures.app.sub_high_monthly_1299"
        static let highAnnual = "com.chaoscreatures.app.sub_high_annual_9999"
        static let allSubscriptions: Set<String> = [
            midMonthly, midAnnual,
            highMonthly, highAnnual
        ]
    }

    // MARK: - State

    var products: [Product] = []
    var purchasedSubscriptions: [Product] = []
    var isLoading = false
    var error: String?

    /// The player's current active subscription product, if any
    var activeSubscription: Product? {
        purchasedSubscriptions.first
    }

    /// Current subscription tier based on active subscription
    var currentTier: SubscriptionTier {
        guard let product = activeSubscription else { return .free }
        switch product.id {
        case ProductID.midMonthly, ProductID.midAnnual: return .mid
        case ProductID.highMonthly, ProductID.highAnnual: return .high
        default: return .free
        }
    }

    // MARK: - Private

    private var transactionListener: Task<Void, Error>?

    private init() {
        // Start listening for transactions on init
        transactionListener = listenForTransactions()
    }

    deinit {
        MainActor.assumeIsolated {
            transactionListener?.cancel()
        }
    }

    // MARK: - Product Loading

    /// Fetch available products from App Store Connect
    func loadProducts() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            products = try await Product.products(for: ProductID.allSubscriptions)
                .sorted { $0.price < $1.price }
        } catch {
            self.error = "Failed to load products: \(error.localizedDescription)"
        }
    }

    // MARK: - Purchase

    /// Purchase a subscription product
    @discardableResult
    func purchase(_ product: Product) async throws -> StoreKit.Transaction? {
        let result = try await product.purchase()

        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            await updateSubscriptionStatus()
            await transaction.finish()
            return transaction

        case .userCancelled:
            return nil

        case .pending:
            throw StoreKitPurchaseError.pending

        @unknown default:
            throw StoreKitPurchaseError.unknown
        }
    }

    /// Purchase subscription by tier (defaults to monthly)
    func purchaseSubscription(tier: SubscriptionTier) async throws -> StoreKit.Transaction? {
        let productId: String
        switch tier {
        case .mid: productId = ProductID.midMonthly
        case .high: productId = ProductID.highMonthly
        case .free: return nil
        }

        guard let product = products.first(where: { $0.id == productId }) else {
            throw StoreKitPurchaseError.productNotFound
        }

        return try await purchase(product)
    }

    // MARK: - Restore

    /// Restore previous purchases
    func restorePurchases() async throws {
        try await AppStore.sync()
        await updateSubscriptionStatus()
    }

    // MARK: - Subscription Status

    /// Check current subscription entitlements
    func updateSubscriptionStatus() async {
        var purchased: [Product] = []

        for await result in StoreKit.Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                if transaction.productType == .autoRenewable {
                    if let product = products.first(where: { $0.id == transaction.productID }) {
                        purchased.append(product)
                    }
                }
            }
        }

        purchasedSubscriptions = purchased
    }

    /// Check if user has an active subscription
    func hasActiveSubscription() async -> Bool {
        await updateSubscriptionStatus()
        return !purchasedSubscriptions.isEmpty
    }

    // MARK: - Transaction Listener

    /// Listen for transaction updates (renewals, revocations, etc.)
    private func listenForTransactions() -> Task<Void, Error> {
        Task.detached { [weak self] in
            for await result in StoreKit.Transaction.updates {
                if case .verified(let transaction) = result {
                    await self?.updateSubscriptionStatus()
                    await transaction.finish()

                    // Sync with backend
                    await self?.syncSubscriptionWithBackend(transaction)
                }
            }
        }
    }

    // MARK: - Backend Sync

    /// Sync subscription status with Supabase backend via sync-entitlements Edge Function.
    ///
    /// NOTE (C-10): The sync-entitlements response contains `{ subscription_tier, max_deck_slots,
    /// max_cards_per_faction }`, but we intentionally discard it. The client derives its tier from
    /// the StoreKit `currentEntitlements` via `updateSubscriptionStatus()`, which is called before
    /// this sync. The product-to-tier mapping in `currentTier` (ProductID -> SubscriptionTier)
    /// mirrors the server-side mapping, so they are guaranteed to agree. If the mappings ever
    /// diverge, this function should be updated to decode the response and reconcile.
    private func syncSubscriptionWithBackend(_ transaction: StoreKit.Transaction) async {
        struct EntitlementSync: Encodable {
            let transactionId: String
            let productId: String
            let originalTransactionId: String

            enum CodingKeys: String, CodingKey {
                case transactionId = "transaction_id"
                case productId = "product_id"
                case originalTransactionId = "original_transaction_id"
            }
        }

        do {
            try await SupabaseService.shared.callFunction(
                "sync-entitlements",
                body: EntitlementSync(
                    transactionId: String(transaction.id),
                    productId: transaction.productID,
                    originalTransactionId: String(transaction.originalID)
                )
            )
        } catch {
            // Non-critical: sync will retry on next app launch
            print("[StoreKit] Failed to sync entitlements: \(error)")
        }
    }

    // MARK: - Verification

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreKitPurchaseError.failedVerification
        case .verified(let safe):
            return safe
        }
    }

    // MARK: - Helpers

    /// Get a product by its ID
    func product(for id: String) -> Product? {
        products.first { $0.id == id }
    }

    /// Get the subscription product for a tier (returns monthly variant)
    func subscriptionProduct(for tier: SubscriptionTier) -> Product? {
        switch tier {
        case .mid: return product(for: ProductID.midMonthly)
        case .high: return product(for: ProductID.highMonthly)
        case .free: return nil
        }
    }
}

// MARK: - Purchase Errors

enum StoreKitPurchaseError: LocalizedError {
    case pending
    case unknown
    case failedVerification
    case productNotFound

    var errorDescription: String? {
        switch self {
        case .pending: return "Purchase is pending approval."
        case .unknown: return "An unknown error occurred."
        case .failedVerification: return "Transaction verification failed."
        case .productNotFound: return "Product not found. Please try again later."
        }
    }
}
