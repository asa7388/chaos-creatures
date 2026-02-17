// EvolutionService.swift
// Chaos Creatures
// Evolution flow: initiate evolution, poll for AI generation, fetch result.
// Source: docs/design/06-technical-architecture.md Section 2.5, 02-card-data-model.md

import Foundation

@MainActor @Observable
final class EvolutionService {
    static let shared = EvolutionService()

    // MARK: - State

    var isEvolving = false
    var evolutionStatus: EvolutionStatus = .idle
    var modifierChoices: [ModifierDefinition] = []
    var evolutionResult: EvolutionResult?
    var error: String?

    // MARK: - Private

    private var pollTask: Task<Void, Never>?
    private let pollInterval: TimeInterval = 2.0  // seconds between status checks
    private let maxPollAttempts = 60  // 2 minutes max

    private init() {}

    // MARK: - Evolution Flow

    /// Step 1: Request modifier choices for an evolution
    func requestEvolutionChoices(
        cardId: UUID,
        channeledToward: EventType
    ) async throws {
        evolutionStatus = .loadingChoices
        error = nil

        struct ChoicesRequest: Encodable {
            let cardInstanceId: UUID
            let channeledToward: EventType

            enum CodingKeys: String, CodingKey {
                case cardInstanceId = "card_instance_id"
                case channeledToward = "channeled_toward"
            }
        }

        struct ChoicesResponse: Decodable {
            let modifiers: [ModifierDefinition]
        }

        do {
            let response: ChoicesResponse = try await SupabaseService.shared.callFunction(
                "evolution/get-choices",
                body: ChoicesRequest(
                    cardInstanceId: cardId,
                    channeledToward: channeledToward
                )
            )
            modifierChoices = response.modifiers
            evolutionStatus = .choosingModifier
        } catch {
            self.error = "Failed to load evolution choices: \(error.localizedDescription)"
            evolutionStatus = .failed
        }
    }

    /// Step 2: Start evolution with selected modifier and shard
    func startEvolution(
        cardId: UUID,
        channeledToward: EventType,
        selectedModifierId: UUID,
        shardTier: ShardTier
    ) async throws {
        isEvolving = true
        evolutionStatus = .generating
        error = nil

        struct EvolveRequest: Encodable {
            let cardInstanceId: UUID
            let channeledToward: EventType
            let modifierDefinitionId: UUID
            let shardTier: ShardTier

            enum CodingKeys: String, CodingKey {
                case cardInstanceId = "card_instance_id"
                case channeledToward = "channeled_toward"
                case modifierDefinitionId = "modifier_definition_id"
                case shardTier = "shard_tier"
            }
        }

        struct EvolveResponse: Decodable {
            let evolutionJobId: String

            enum CodingKeys: String, CodingKey {
                case evolutionJobId = "evolution_job_id"
            }
        }

        do {
            let response: EvolveResponse = try await SupabaseService.shared.callFunction(
                "evolution/start",
                body: EvolveRequest(
                    cardInstanceId: cardId,
                    channeledToward: channeledToward,
                    modifierDefinitionId: selectedModifierId,
                    shardTier: shardTier
                )
            )

            // Start polling for completion
            startPolling(jobId: response.evolutionJobId)
        } catch {
            self.error = "Failed to start evolution: \(error.localizedDescription)"
            evolutionStatus = .failed
            isEvolving = false
        }
    }

    /// Cancel ongoing evolution polling
    func cancelEvolution() {
        pollTask?.cancel()
        pollTask = nil
        isEvolving = false
        evolutionStatus = .idle
    }

    /// Reset state for a new evolution
    func reset() {
        cancelEvolution()
        modifierChoices = []
        evolutionResult = nil
        error = nil
    }

    // MARK: - Polling

    private func startPolling(jobId: String) {
        pollTask?.cancel()

        pollTask = Task { @MainActor in
            var attempts = 0

            while !Task.isCancelled && attempts < maxPollAttempts {
                attempts += 1

                do {
                    let status = try await pollStatus(jobId: jobId)

                    switch status.state {
                    case "completed":
                        evolutionResult = status.result
                        evolutionStatus = .completed
                        isEvolving = false
                        return

                    case "failed":
                        error = status.errorMessage ?? "Evolution failed."
                        evolutionStatus = .failed
                        isEvolving = false
                        return

                    case "generating_art":
                        evolutionStatus = .generatingArt

                    case "generating_text":
                        evolutionStatus = .generatingText

                    case "applying_modifiers":
                        evolutionStatus = .applyingModifiers

                    default:
                        evolutionStatus = .generating
                    }
                } catch {
                    // Network error during poll - keep trying
                    if attempts >= maxPollAttempts {
                        self.error = "Evolution timed out. Check your collection."
                        evolutionStatus = .failed
                        isEvolving = false
                        return
                    }
                }

                try? await Task.sleep(nanoseconds: UInt64(pollInterval * 1_000_000_000))
            }

            if !Task.isCancelled {
                error = "Evolution timed out. Check your collection."
                evolutionStatus = .failed
                isEvolving = false
            }
        }
    }

    private func pollStatus(jobId: String) async throws -> EvolutionJobStatus {
        struct StatusRequest: Encodable {
            let jobId: String

            enum CodingKeys: String, CodingKey {
                case jobId = "job_id"
            }
        }

        return try await SupabaseService.shared.callFunction(
            "evolution/status",
            body: StatusRequest(jobId: jobId)
        )
    }
}

// MARK: - Evolution Status

enum EvolutionStatus: Equatable {
    case idle
    case loadingChoices
    case choosingModifier
    case generating
    case generatingArt
    case generatingText
    case applyingModifiers
    case completed
    case failed

    var displayMessage: String {
        switch self {
        case .idle: return ""
        case .loadingChoices: return "Loading modifier choices..."
        case .choosingModifier: return "Choose a modifier"
        case .generating: return "Evolving your creature..."
        case .generatingArt: return "Generating new art..."
        case .generatingText: return "Creating name and lore..."
        case .applyingModifiers: return "Applying modifier effects..."
        case .completed: return "Evolution complete!"
        case .failed: return "Evolution failed"
        }
    }

    var isInProgress: Bool {
        switch self {
        case .generating, .generatingArt, .generatingText, .applyingModifiers:
            return true
        default:
            return false
        }
    }
}

// MARK: - Evolution Job Status (from backend polling)

struct EvolutionJobStatus: Decodable {
    let state: String
    let progress: Double?
    let errorMessage: String?
    let result: EvolutionResult?

    enum CodingKeys: String, CodingKey {
        case state, progress
        case errorMessage = "error_message"
        case result
    }
}

// MARK: - Evolution Result

struct EvolutionResult: Decodable, Equatable {
    let cardInstanceId: UUID
    let fromTier: EvolutionTier
    let toTier: EvolutionTier
    let newName: String
    let newArtUrl: String
    let newFlavorText: String
    let attackChange: Int?
    let healthChange: Int?
    let instabilityChange: Int
    let modifierApplied: String
    let abilityGranted: String?
    let keywordGranted: String?

    enum CodingKeys: String, CodingKey {
        case cardInstanceId = "card_instance_id"
        case fromTier = "from_tier"
        case toTier = "to_tier"
        case newName = "new_name"
        case newArtUrl = "new_art_url"
        case newFlavorText = "new_flavor_text"
        case attackChange = "attack_change"
        case healthChange = "health_change"
        case instabilityChange = "instability_change"
        case modifierApplied = "modifier_applied"
        case abilityGranted = "ability_granted"
        case keywordGranted = "keyword_granted"
    }

    static func == (lhs: EvolutionResult, rhs: EvolutionResult) -> Bool {
        lhs.cardInstanceId == rhs.cardInstanceId && lhs.toTier == rhs.toTier
    }
}
