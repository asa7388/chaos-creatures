// PlayerAction.swift
// Chaos Creatures
// All client action types sent to the game server.
// Mirrors: packages/game-server/src/types/messages.ts ClientAction

import Foundation

// MARK: - Client -> Server Actions

enum PlayerAction: Codable {
    case playCard(cardId: String, targetSlot: Int?, targetId: String?)
    case useChaosSpark
    case endMainPhase
    case declareAttackers(attackerIds: [String])
    case assignBlockers(assignments: [BlockerAssignmentPayload])
    case chooseEventTarget(creatureId: String)
    case surrender
    case mulligan(keep: Bool)
    case reconnect
    case endTurn

    /// Encode to JSON matching the server's expected format
    var jsonPayload: [String: Any] {
        switch self {
        case .playCard(let cardId, let targetSlot, let targetId):
            var payload: [String: Any] = ["type": "PLAY_CARD", "card_id": cardId]
            if let slot = targetSlot { payload["target_slot"] = slot }
            if let tid = targetId { payload["target_id"] = tid }
            return payload
        case .useChaosSpark:
            return ["type": "USE_CHAOS_SPARK"]
        case .endMainPhase:
            return ["type": "END_MAIN_PHASE"]
        case .declareAttackers(let ids):
            return ["type": "DECLARE_ATTACKERS", "attacker_ids": ids]
        case .assignBlockers(let assignments):
            let mapped = assignments.map { ["blocker_id": $0.blockerId, "attacker_id": $0.attackerId] }
            return ["type": "ASSIGN_BLOCKERS", "assignments": mapped]
        case .chooseEventTarget(let creatureId):
            return ["type": "CHOOSE_EVENT_TARGET", "creature_id": creatureId]
        case .surrender:
            return ["type": "SURRENDER"]
        case .mulligan(let keep):
            return ["type": "MULLIGAN", "keep": keep]
        case .reconnect:
            return ["type": "RECONNECT"]
        case .endTurn:
            return ["type": "END_TURN"]
        }
    }

    /// Serialise to JSON Data for sending via WebSocket
    var jsonData: Data? {
        try? JSONSerialization.data(withJSONObject: jsonPayload)
    }
}

// MARK: - Blocker Assignment Payload

struct BlockerAssignmentPayload: Codable {
    let blockerId: String
    let attackerId: String

    enum CodingKeys: String, CodingKey {
        case blockerId = "blocker_id"
        case attackerId = "attacker_id"
    }
}
