// EconomyConfig.swift
// Chaos Creatures
// Economy configuration and transaction models.
// Source of truth: docs/design/04-progression-economy.md, 00004_economy_tables.sql

import Foundation

// MARK: - Economy Config (from economy_config table)

struct EconomyConfig: Codable {
    let key: String
    let value: EconomyValue
    let description: String
    let updatedAt: Date
    let updatedBy: String

    enum CodingKeys: String, CodingKey {
        case key, value, description
        case updatedAt = "updated_at"
        case updatedBy = "updated_by"
    }
}

// MARK: - Economy Value (flexible JSONB)

enum EconomyValue: Codable {
    case int(Int)
    case double(Double)
    case string(String)
    case bool(Bool)
    case array([EconomyValue])
    case object([String: EconomyValue])

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let intVal = try? container.decode(Int.self) {
            self = .int(intVal)
        } else if let doubleVal = try? container.decode(Double.self) {
            self = .double(doubleVal)
        } else if let boolVal = try? container.decode(Bool.self) {
            self = .bool(boolVal)
        } else if let stringVal = try? container.decode(String.self) {
            self = .string(stringVal)
        } else if let arrayVal = try? container.decode([EconomyValue].self) {
            self = .array(arrayVal)
        } else if let objectVal = try? container.decode([String: EconomyValue].self) {
            self = .object(objectVal)
        } else {
            throw DecodingError.dataCorrupted(
                DecodingError.Context(codingPath: decoder.codingPath,
                                      debugDescription: "Cannot decode EconomyValue")
            )
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .int(let val): try container.encode(val)
        case .double(let val): try container.encode(val)
        case .string(let val): try container.encode(val)
        case .bool(let val): try container.encode(val)
        case .array(let val): try container.encode(val)
        case .object(let val): try container.encode(val)
        }
    }

    var intValue: Int? {
        if case .int(let val) = self { return val }
        return nil
    }

    var doubleValue: Double? {
        if case .double(let val) = self { return val }
        if case .int(let val) = self { return Double(val) }
        return nil
    }
}

// MARK: - Shard Transaction (from shard_transactions table)

struct ShardTransaction: Codable, Identifiable {
    let id: UUID
    let playerId: UUID
    let shardTier: ShardTier
    let amount: Int
    let source: ShardSource
    let referenceId: String?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case playerId = "player_id"
        case shardTier = "shard_tier"
        case amount, source
        case referenceId = "reference_id"
        case createdAt = "created_at"
    }
}

// MARK: - Dust Transaction (from dust_transactions table)

struct DustTransaction: Codable, Identifiable {
    let id: UUID
    let playerId: UUID
    let amount: Int
    let source: String
    let referenceId: String?
    let balanceAfter: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case playerId = "player_id"
        case amount, source
        case referenceId = "reference_id"
        case balanceAfter = "balance_after"
        case createdAt = "created_at"
    }
}

// MARK: - Evolution Energy Constants

enum EnergyConstants {
    static let thresholdUncommon = 15
    static let thresholdRare = 30
    static let thresholdEpic = 50
    static let thresholdLegendary = 75
    static let totalForLegendary = 170

    static let energyPerWin = 2
    static let energyPerLoss = 1

    static func threshold(for tier: EvolutionTier) -> Int? {
        tier.nextTier?.energyThreshold
    }
}
