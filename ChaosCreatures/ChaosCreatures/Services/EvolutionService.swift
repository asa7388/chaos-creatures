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

    /// Data returned from start-evolution, needed for confirm step
    var currentEvolutionId: String?
    var currentCardInstanceId: UUID?
    var statChanges: EvolutionStatChanges?

    // MARK: - Private

    private var pollTask: Task<Void, Never>?
    private let pollInterval: TimeInterval = 2.0  // seconds between status checks
    private let maxPollAttempts = 60  // 2 minutes max
    private let supabase = SupabaseService.shared

    private var imageJobId: String?
    private var textJobId: String?

    private init() {}

    // MARK: - Evolution Flow

    /// Step 1: Start evolution — validates eligibility, deducts shard, creates generation jobs,
    /// and returns modifier options for the player to choose from.
    func startEvolution(
        cardId: UUID,
        channelDirection: String? = nil
    ) async throws {
        isEvolving = true
        evolutionStatus = .generating
        error = nil
        modifierChoices = []
        currentEvolutionId = nil
        currentCardInstanceId = cardId

        struct StartRequest: Encodable {
            let cardInstanceId: UUID
            let channelDirection: String?

            enum CodingKeys: String, CodingKey {
                case cardInstanceId = "card_instance_id"
                case channelDirection = "channel_direction"
            }
        }

        struct StartEnvelope: Decodable {
            let data: StartResponse
        }

        struct StartResponse: Decodable {
            let evolutionId: String
            let targetTier: String
            let cardInstanceId: UUID
            let modifierOptions: [ModifierDefinition]
            let statChanges: EvolutionStatChanges
            let imageJobId: String?
            let textJobId: String?

            enum CodingKeys: String, CodingKey {
                case evolutionId = "evolution_id"
                case targetTier = "target_tier"
                case cardInstanceId = "card_instance_id"
                case modifierOptions = "modifier_options"
                case statChanges = "stat_changes"
                case imageJobId = "image_job_id"
                case textJobId = "text_job_id"
            }
        }

        do {
            let envelope: StartEnvelope = try await supabase.callFunction(
                "start-evolution",
                body: StartRequest(
                    cardInstanceId: cardId,
                    channelDirection: channelDirection
                )
            )

            let response = envelope.data
            currentEvolutionId = response.evolutionId
            modifierChoices = response.modifierOptions
            statChanges = response.statChanges
            imageJobId = response.imageJobId
            textJobId = response.textJobId

            // Start polling generation jobs for art + text completion
            if let imgId = response.imageJobId, let txtId = response.textJobId {
                startPollingGenerationJobs(imageJobId: imgId, textJobId: txtId)
            }

            evolutionStatus = .choosingModifier
        } catch {
            self.error = "Failed to start evolution: \(error.localizedDescription)"
            evolutionStatus = .failed
            isEvolving = false
        }
    }

    /// Step 2: Confirm evolution after player chooses modifier and name.
    func confirmEvolution(
        modifierChosenId: UUID? = nil,
        nameChosen: String
    ) async throws {
        guard let evolutionId = currentEvolutionId,
              let cardInstanceId = currentCardInstanceId else {
            self.error = "No active evolution to confirm."
            evolutionStatus = .failed
            return
        }

        evolutionStatus = .applyingModifiers

        struct ConfirmRequest: Encodable {
            let evolutionId: String
            let cardInstanceId: UUID
            let modifierChosenId: UUID?
            let nameChosen: String

            enum CodingKeys: String, CodingKey {
                case evolutionId = "evolution_id"
                case cardInstanceId = "card_instance_id"
                case modifierChosenId = "modifier_chosen_id"
                case nameChosen = "name_chosen"
            }
        }

        struct ConfirmEnvelope: Decodable {
            let data: ConfirmResponse
        }

        struct ConfirmResponse: Decodable {
            let card: CardInstance
        }

        do {
            let envelope: ConfirmEnvelope = try await supabase.callFunction(
                "complete-evolution",
                body: ConfirmRequest(
                    evolutionId: evolutionId,
                    cardInstanceId: cardInstanceId,
                    modifierChosenId: modifierChosenId,
                    nameChosen: nameChosen
                )
            )

            // Build evolution result from the updated card
            let updatedCard = envelope.data.card
            evolutionResult = EvolutionResult(
                cardInstanceId: updatedCard.id,
                newName: updatedCard.currentName,
                newArtUrl: updatedCard.artUrl,
                newFlavorText: updatedCard.flavorText,
                tier: updatedCard.tier
            )
            evolutionStatus = .completed
            isEvolving = false
        } catch {
            self.error = "Failed to confirm evolution: \(error.localizedDescription)"
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
        currentEvolutionId = nil
        currentCardInstanceId = nil
        statChanges = nil
        imageJobId = nil
        textJobId = nil
        error = nil
    }

    // MARK: - Polling Generation Jobs

    /// Poll the generation_jobs table directly for image and text job completion
    private func startPollingGenerationJobs(imageJobId: String, textJobId: String) {
        pollTask?.cancel()

        pollTask = Task { @MainActor in
            var attempts = 0

            while !Task.isCancelled && attempts < maxPollAttempts {
                attempts += 1

                do {
                    let jobs: [GenerationJobRow] = try await supabase.client
                        .from("generation_jobs")
                        .select("id, job_type, status, error_message")
                        .in("id", values: [imageJobId, textJobId])
                        .execute()
                        .value

                    let imageJob = jobs.first { $0.id == imageJobId }
                    let textJob = jobs.first { $0.id == textJobId }

                    // Check for failures
                    if let failedJob = jobs.first(where: { $0.status == "FAILED" }) {
                        error = failedJob.errorMessage ?? "Generation failed."
                        evolutionStatus = .failed
                        isEvolving = false
                        return
                    }

                    // Update status based on which jobs are still running
                    let imageComplete = imageJob?.status == "COMPLETED"
                    let textComplete = textJob?.status == "COMPLETED"

                    if imageComplete && textComplete {
                        // Both done -- stay in choosingModifier or move to ready
                        evolutionStatus = .choosingModifier
                        return
                    } else if !imageComplete {
                        evolutionStatus = .generatingArt
                    } else if !textComplete {
                        evolutionStatus = .generatingText
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

// MARK: - Generation Job Row (for polling generation_jobs table)

struct GenerationJobRow: Decodable {
    let id: String
    let jobType: String
    let status: String
    let errorMessage: String?

    enum CodingKeys: String, CodingKey {
        case id
        case jobType = "job_type"
        case status
        case errorMessage = "error_message"
    }
}

// MARK: - Evolution Stat Changes (from start-evolution response)

struct EvolutionStatChanges: Decodable {
    let attackBonus: Int
    let healthBonus: Int
    let instabilityChange: Int

    enum CodingKeys: String, CodingKey {
        case attackBonus = "attack_bonus"
        case healthBonus = "health_bonus"
        case instabilityChange = "instability_change"
    }
}

// MARK: - Evolution Result (built from complete-evolution response)

struct EvolutionResult: Equatable {
    let cardInstanceId: UUID
    let newName: String
    let newArtUrl: String
    let newFlavorText: String
    let tier: Rarity

    static func == (lhs: EvolutionResult, rhs: EvolutionResult) -> Bool {
        lhs.cardInstanceId == rhs.cardInstanceId && lhs.tier == rhs.tier
    }
}
