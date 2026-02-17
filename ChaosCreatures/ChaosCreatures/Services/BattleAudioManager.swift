// BattleAudioManager.swift
// Chaos Creatures
// Battle audio: faction-specific music, SFX triggers, adaptive stems.
// Source: docs/design/08-audio-design.md

import AVFoundation
import SpriteKit

/// Manages all battle audio: background music, SFX triggers, and adaptive
/// stem mixing based on game state. Uses AVAudioEngine for music stems
/// and SKAction.playSoundFileNamed for SFX (via the SpriteKit scene).
///
/// Note: Audio files (.caf, .wav) must be added to the Resources/Audio
/// bundle group. Until those files exist, all playback calls are no-ops.
@MainActor
final class BattleAudioManager {

    // MARK: - Singleton

    static let shared = BattleAudioManager()

    // MARK: - Audio Engine (for music stems)

    private var audioEngine: AVAudioEngine?
    private var musicPlayers: [String: AVAudioPlayerNode] = [:]
    private var musicBuffers: [String: AVAudioPCMBuffer] = [:]

    // MARK: - State

    private var isMusicEnabled: Bool = true
    private var isSfxEnabled: Bool = true
    private var musicVolume: Float = 0.5
    private var sfxVolume: Float = 0.7
    private var currentFaction: FactionShortName = .ironwright

    // MARK: - Music Stems (per doc 08)
    // Each faction has 4 stems: base, tension, chaos, victory

    private let stemNames = ["base", "tension", "chaos", "victory"]

    // MARK: - Init

    private init() {
        configureAudioSession()
    }

    // MARK: - Configuration

    private func configureAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            // Audio session config failed — non-critical
        }
    }

    /// Set the faction for audio theming
    func setFaction(_ faction: FactionShortName) {
        self.currentFaction = faction
    }

    /// Enable/disable music
    func setMusicEnabled(_ enabled: Bool) {
        isMusicEnabled = enabled
        if !enabled {
            stopMusic()
        }
    }

    /// Enable/disable SFX
    func setSfxEnabled(_ enabled: Bool) {
        isSfxEnabled = enabled
    }

    /// Set music volume (0.0 - 1.0)
    func setMusicVolume(_ volume: Float) {
        musicVolume = max(0, min(1, volume))
        musicPlayers.values.forEach { $0.volume = musicVolume }
    }

    /// Set SFX volume (0.0 - 1.0)
    func setSfxVolume(_ volume: Float) {
        sfxVolume = max(0, min(1, volume))
    }

    // MARK: - Music Control

    /// Start battle music for the current faction.
    /// Loads and loops the base stem. Other stems are mixed in based on game state.
    func startBattleMusic() {
        guard isMusicEnabled else { return }

        // Set up audio engine
        let engine = AVAudioEngine()
        self.audioEngine = engine

        // Create player nodes for each stem
        for stem in stemNames {
            let player = AVAudioPlayerNode()
            engine.attach(player)
            engine.connect(player, to: engine.mainMixerNode, format: nil)
            musicPlayers[stem] = player

            // Try to load the audio file
            let fileName = "\(currentFaction.rawValue.lowercased())_\(stem)"
            if let url = Bundle.main.url(forResource: fileName, withExtension: "caf"),
               let file = try? AVAudioFile(forReading: url),
               let buffer = AVAudioPCMBuffer(pcmFormat: file.processingFormat,
                                              frameCapacity: AVAudioFrameCount(file.length)) {
                try? file.read(into: buffer)
                musicBuffers[stem] = buffer
            }
        }

        // Start engine
        do {
            try engine.start()
        } catch {
            return
        }

        // Play base stem (looping)
        if let baseStem = musicPlayers["base"], let buffer = musicBuffers["base"] {
            baseStem.volume = musicVolume
            baseStem.scheduleBuffer(buffer, at: nil, options: .loops)
            baseStem.play()
        }

        // Other stems start at volume 0 (mixed in later)
        for stem in ["tension", "chaos", "victory"] {
            if let player = musicPlayers[stem], let buffer = musicBuffers[stem] {
                player.volume = 0
                player.scheduleBuffer(buffer, at: nil, options: .loops)
                player.play()
            }
        }
    }

    /// Stop all music
    func stopMusic() {
        musicPlayers.values.forEach { $0.stop() }
        audioEngine?.stop()
        audioEngine = nil
        musicPlayers.removeAll()
        musicBuffers.removeAll()
    }

    /// Crossfade music stems based on game state (per doc 08 adaptive music system)
    func updateMusicState(
        playerHp: Int,
        opponentHp: Int,
        isMyTurn: Bool,
        phase: TurnPhase,
        lastRollResult: ChaosRollOutcome?
    ) {
        guard isMusicEnabled else { return }

        let fadeDuration: Float = 1.0

        // Tension: ramp up when either player is low HP
        let minHp = min(playerHp, opponentHp)
        let tensionLevel: Float = minHp < 10 ? Float(10 - minHp) / 10.0 : 0
        fadeVolume(stem: "tension", to: tensionLevel * musicVolume, duration: fadeDuration)

        // Chaos: active during chaos roll and event phases, or after a CHAOS result
        let chaosLevel: Float
        if phase == .chaosRoll || phase == .eventResolution {
            chaosLevel = 0.6
        } else if lastRollResult == .chaos {
            chaosLevel = 0.4
        } else {
            chaosLevel = 0
        }
        fadeVolume(stem: "chaos", to: chaosLevel * musicVolume, duration: fadeDuration)
    }

    /// Trigger victory/defeat music sting
    func playGameEndMusic(isVictory: Bool) {
        guard isMusicEnabled else { return }

        // Fade out all stems
        for stem in stemNames {
            fadeVolume(stem: stem, to: 0, duration: 0.5)
        }

        if isVictory {
            fadeVolume(stem: "victory", to: musicVolume, duration: 0.3)
        }
    }

    private func fadeVolume(stem: String, to target: Float, duration: Float) {
        guard let player = musicPlayers[stem] else { return }
        // Simple linear fade (SpriteKit scene frame-based fading not available here)
        // For MVP, snap to target. Full AVAudioEngine ramp would be a future enhancement.
        player.volume = target
    }

    // MARK: - SFX Triggers

    /// SFX names mapped to game events. Files must exist in Resources/Audio/.
    /// Format: .wav preferred for SFX (low latency).

    enum SFX: String {
        case cardPlay = "sfx_card_play"
        case attack = "sfx_attack"
        case damage = "sfx_damage"
        case death = "sfx_death"
        case heal = "sfx_heal"
        case shieldBreak = "sfx_shield_break"
        case chaosRollStart = "sfx_chaos_roll_start"
        case chaosRollOrder = "sfx_chaos_roll_order"
        case chaosRollChaos = "sfx_chaos_roll_chaos"
        case chaosRollNothing = "sfx_chaos_roll_nothing"
        case eventOrder = "sfx_event_order"
        case eventChaos = "sfx_event_chaos"
        case turnStart = "sfx_turn_start"
        case manaGain = "sfx_mana_gain"
        case buttonTap = "sfx_button_tap"
        case victory = "sfx_victory"
        case defeat = "sfx_defeat"
        case chaosSpark = "sfx_chaos_spark"
    }

    /// Play a SFX via SpriteKit (fire-and-forget).
    /// Audio file must exist in the bundle; if not, this is a silent no-op.
    func playSFX(_ sfx: SFX, in scene: SKScene? = nil) {
        guard isSfxEnabled else { return }

        let fileName = sfx.rawValue + ".wav"

        if let scene = scene {
            // Use SpriteKit's built-in audio (auto-manages playback)
            scene.run(SKAction.playSoundFileNamed(fileName, waitForCompletion: false))
        } else {
            // Fallback: play via AVAudioPlayer
            playViaAVAudio(fileName)
        }
    }

    /// Play SFX for a chaos roll result
    func playChaosRollSFX(_ result: ChaosRollOutcome, in scene: SKScene? = nil) {
        switch result {
        case .order: playSFX(.chaosRollOrder, in: scene)
        case .chaos: playSFX(.chaosRollChaos, in: scene)
        case .nothing: playSFX(.chaosRollNothing, in: scene)
        }
    }

    // MARK: - AVAudioPlayer Fallback

    private var audioPlayers: [AVAudioPlayer] = []

    private func playViaAVAudio(_ fileName: String) {
        let name = (fileName as NSString).deletingPathExtension
        let ext = (fileName as NSString).pathExtension

        guard let url = Bundle.main.url(forResource: name, withExtension: ext) else { return }

        do {
            let player = try AVAudioPlayer(contentsOf: url)
            player.volume = sfxVolume
            player.play()

            // Keep reference to prevent deallocation
            audioPlayers.append(player)

            // Clean up finished players
            audioPlayers.removeAll { !$0.isPlaying }
        } catch {
            // Failed to play — non-critical
        }
    }

    // MARK: - Cleanup

    func cleanup() {
        stopMusic()
        audioPlayers.forEach { $0.stop() }
        audioPlayers.removeAll()
    }
}
