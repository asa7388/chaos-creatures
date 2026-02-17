// ImageCacheService.swift
// Chaos Creatures
// URLCache + disk cache for card art from R2 CDN.
// Two-tier caching: in-memory LRU + disk-based URLCache.
// Source: docs/design/06-technical-architecture.md Section 2.6

import UIKit

actor ImageCacheService {
    static let shared = ImageCacheService()

    // MARK: - Configuration

    private let memoryCapacity = 50 * 1024 * 1024  // 50 MB in-memory
    private let diskCapacity = 200 * 1024 * 1024    // 200 MB on disk
    private let maxConcurrentLoads = 6

    // MARK: - Private Storage

    private var memoryCache = NSCache<NSString, UIImage>()
    private let urlCache: URLCache
    private let session: URLSession
    private var activeTasks: [String: Task<UIImage, Error>] = [:]

    private init() {
        // Configure URL cache for disk persistence
        urlCache = URLCache(
            memoryCapacity: memoryCapacity,
            diskCapacity: diskCapacity,
            diskPath: "CardArtCache"
        )

        // Configure session with cache
        let config = URLSessionConfiguration.default
        config.urlCache = urlCache
        config.requestCachePolicy = .returnCacheDataElseLoad
        config.timeoutIntervalForRequest = 15
        config.httpMaximumConnectionsPerHost = maxConcurrentLoads
        session = URLSession(configuration: config)

        // Configure memory cache
        memoryCache.countLimit = 200  // Max 200 images in memory
        memoryCache.totalCostLimit = memoryCapacity
    }

    // MARK: - Image Loading

    /// Load an image from cache or network
    func loadImage(url: URL) async throws -> UIImage {
        let cacheKey = url.absoluteString as NSString

        // Check memory cache first
        if let cached = memoryCache.object(forKey: cacheKey) {
            return cached
        }

        // Deduplicate concurrent requests for the same URL
        if let existingTask = activeTasks[url.absoluteString] {
            return try await existingTask.value
        }

        let task = Task<UIImage, Error> {
            let (data, response) = try await session.data(from: url)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw ImageCacheError.invalidResponse
            }

            guard let image = UIImage(data: data) else {
                throw ImageCacheError.invalidImageData
            }

            // Store in memory cache
            let cost = data.count
            memoryCache.setObject(image, forKey: cacheKey, cost: cost)

            return image
        }

        activeTasks[url.absoluteString] = task

        do {
            let image = try await task.value
            activeTasks.removeValue(forKey: url.absoluteString)
            return image
        } catch {
            activeTasks.removeValue(forKey: url.absoluteString)
            throw error
        }
    }

    /// Load an image from a URL string
    func loadImage(urlString: String) async throws -> UIImage {
        guard let url = URL(string: urlString) else {
            throw ImageCacheError.invalidURL
        }
        return try await loadImage(url: url)
    }

    // MARK: - Preloading

    /// Preload a batch of images (e.g., for deck cards before a match)
    func preloadBatch(urls: [URL]) async {
        await withTaskGroup(of: Void.self) { group in
            for url in urls {
                group.addTask {
                    _ = try? await self.loadImage(url: url)
                }
            }
        }
    }

    /// Preload images for a collection of cards
    func preloadCardArt(cards: [CardInstance]) async {
        let urls = cards.compactMap { URL(string: $0.artUrl) }
        await preloadBatch(urls: urls)
    }

    // MARK: - Cache Management

    /// Clear the in-memory cache (disk cache preserved)
    func clearMemoryCache() {
        memoryCache.removeAllObjects()
    }

    /// Clear all caches (memory + disk)
    func clearAllCaches() {
        memoryCache.removeAllObjects()
        urlCache.removeAllCachedResponses()
    }

    /// Get current disk cache size in bytes
    var diskCacheSize: Int {
        urlCache.currentDiskUsage
    }

    /// Get formatted disk cache size string
    var diskCacheSizeFormatted: String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useMB, .useKB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: Int64(diskCacheSize))
    }

    /// Remove cached data for a specific URL
    func removeFromCache(url: URL) {
        let cacheKey = url.absoluteString as NSString
        memoryCache.removeObject(forKey: cacheKey)

        let request = URLRequest(url: url)
        urlCache.removeCachedResponse(for: request)
    }

    /// Check if an image is cached (memory or disk)
    func isCached(url: URL) -> Bool {
        let cacheKey = url.absoluteString as NSString

        // Check memory
        if memoryCache.object(forKey: cacheKey) != nil {
            return true
        }

        // Check disk
        let request = URLRequest(url: url)
        return urlCache.cachedResponse(for: request) != nil
    }
}

// MARK: - Errors

enum ImageCacheError: LocalizedError {
    case invalidURL
    case invalidResponse
    case invalidImageData

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid image URL."
        case .invalidResponse: return "Image server returned an error."
        case .invalidImageData: return "Image data is corrupted."
        }
    }
}

// MARK: - SwiftUI Integration

import SwiftUI

/// A SwiftUI view that loads and caches card art
struct CachedCardArt: View {
    let urlString: String
    let placeholder: AnyView

    @State private var image: UIImage?
    @State private var isLoading = true

    init(
        urlString: String,
        placeholder: some View = Rectangle().fill(Color.bgTertiary)
    ) {
        self.urlString = urlString
        self.placeholder = AnyView(placeholder)
    }

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } else {
                placeholder
                    .overlay {
                        if isLoading {
                            ProgressView()
                                .tint(.textTertiary)
                        }
                    }
            }
        }
        .task {
            await loadImage()
        }
    }

    private func loadImage() async {
        isLoading = true
        defer { isLoading = false }

        do {
            image = try await ImageCacheService.shared.loadImage(urlString: urlString)
        } catch {
            // Show placeholder on failure
            image = nil
        }
    }
}
