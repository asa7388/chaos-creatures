// CardFont.swift
// Chaos Creatures
//
// Phase 0 rewrite — Section 1.5 typography spec (CARD_DESIGN_GUIDE.md).
// Font set per Decision 2 (DEPENDENCY_DECISIONS.md):
//   Cinzel-Regular / Cinzel-Bold     — card name, type line, collector number, headers
//   EBGaramond-Regular               — ability text
//   EBGaramond-Italic                — flavor text
//   EBGaramond-SemiBold              — keyword ability names
//   Oswald-Bold                      — ATK/HP stats, numbers, mana cost
//
// Previous font set (Alegreya, Bebas Neue, Fira Sans) retired from card rendering
// per Decision 2. Their UIFont/SpriteKit helpers are preserved below for non-card
// UI screens until those screens are audited in Phase 2.
//
// IMPORTANT — Variable font note:
// The downloaded files are variable-weight TTFs (single file covers all weights).
// UIFont(name: "Cinzel-Bold", size:) may return nil if the OS did not register
// separate PostScript names. Use the family-descriptor path (cinzelUIFont) which
// resolves weight via UIFontDescriptor.TraitKey.weight. The debugPrintRegisteredFonts()
// call at app launch will confirm which names the OS registered.
//
// Fallback strategy per Section 1.5: Georgia (Cinzel fallback), Times New Roman
// (EB Garamond fallback), Impact (Oswald fallback). Never fall back to San Francisco.

import SwiftUI
import UIKit

enum CardFont {

    // MARK: - Section 1.5 SwiftUI Font Accessors

    // --- Cinzel ---

    /// Card name bar, type line, collector number. Cinzel Regular.
    static func cinzelRegular(size: CGFloat) -> Font {
        .custom("Cinzel-Regular", size: size)
    }

    /// Headers, emphasized labels. Cinzel Bold.
    static func cinzelBold(size: CGFloat) -> Font {
        .custom("Cinzel-Bold", size: size)
    }

    // --- EB Garamond ---

    /// Ability text, rules text. EBGaramond Regular.
    static func ebGaramondRegular(size: CGFloat) -> Font {
        .custom("EBGaramond-Regular", size: size)
    }

    /// Flavor text (italic). EBGaramond Italic.
    static func ebGaramondItalic(size: CGFloat) -> Font {
        .custom("EBGaramond-Italic", size: size)
    }

    /// Keyword ability names. EBGaramond SemiBold.
    static func ebGaramondSemiBold(size: CGFloat) -> Font {
        .custom("EBGaramond-SemiBold", size: size)
    }

    // --- Oswald ---

    /// ATK/HP stats, numbers, mana cost. Oswald Bold.
    static func oswaldBold(size: CGFloat) -> Font {
        .custom("Oswald-Bold", size: size)
    }

    // --- Fredericka the Great (Dossier Front Face) ---

    /// Dossier card name, field values, labels. Fredericka the Great Regular.
    static func frederickaTheGreat(size: CGFloat) -> Font {
        .custom("FrederickatheGreat-Regular", size: size)
    }

    /// Legacy alias — callers that still reference yesevaOne route here.
    static func yesevaOne(size: CGFloat) -> Font {
        frederickaTheGreat(size: size)
    }

    // --- Faction-Specific Front Face Fonts ---

    /// Passions Conflict — Demonic Kingdoms front face font.
    static func passionsConflict(size: CGFloat) -> Font {
        .custom("PassionsConflict-Regular", size: size)
    }

    /// Lovers Quarrel — Fey Courts front face font.
    static func loversQuarrel(size: CGFloat) -> Font {
        .custom("LoversQuarrel-Regular", size: size)
    }

    /// Rammetto One — The Endless front face font (legacy, kept for reference).
    static func rammettoOne(size: CGFloat) -> Font {
        .custom("RammettoOne-Regular", size: size)
    }

    /// UnifrakturCook — The Endless front face font.
    static func unifrakturCook(size: CGFloat) -> Font {
        .custom("UnifrakturCook-Bold", size: size)
    }

    /// Returns the faction-specific front face font at the given size.
    /// Ironwright and Celestial share Fredericka the Great; other factions
    /// use their own display fonts. Neutral/nil defaults to Fredericka.
    /// Note: Lovers Quarrel (Fey) is scaled 1.5x because script fonts render
    /// visually smaller than block fonts at the same point size.
    static func factionFont(for faction: CardFaction?, size: CGFloat) -> Font {
        switch faction {
        case .ironwright:
            return frederickaTheGreat(size: size)
        case .demonic:
            return passionsConflict(size: size)
        case .celestial:
            return frederickaTheGreat(size: size)
        case .fey:
            return loversQuarrel(size: size * 1.5)
        case .endless:
            return unifrakturCook(size: size)
        case nil:
            return frederickaTheGreat(size: size)
        }
    }

    // --- IM Fell English (Intelligence Report Back Face) ---

    /// Report body text. IM Fell English Regular.
    static func imFellEnglish(size: CGFloat) -> Font {
        .custom("IMFellEnglish-Regular", size: size)
    }

    /// Report flavor text (italic). IM Fell English Italic.
    static func imFellEnglishItalic(size: CGFloat) -> Font {
        .custom("IMFellEnglish-Italic", size: size)
    }

    // MARK: - Semantic Aliases (Section 1.5 Zone Table)

    /// Card name bar — Cinzel-Regular 13pt (spec: Cinzel-Bold 13pt; implemented as
    /// regular via cinzelRegular to use the variable font; bold weight applied via
    /// `.fontWeight(.bold)` at call site if variable font registered as "Cinzel").
    static func cardName(size: CGFloat = 13) -> Font { cinzelBold(size: size) }

    /// Type line — Cinzel-Regular 10pt
    static func cardType(size: CGFloat = 10) -> Font { cinzelRegular(size: size) }

    /// Mana cost text — Cinzel-Regular 10pt
    static func manaCostText(size: CGFloat = 10) -> Font { cinzelRegular(size: size) }

    /// Collector number — Cinzel-Regular 7pt
    static func collectorNumber(size: CGFloat = 7) -> Font { cinzelRegular(size: size) }

    /// Ability text — EBGaramond-Regular 11pt
    static func abilityText(size: CGFloat = 11) -> Font { ebGaramondRegular(size: size) }

    /// Flavor text — EBGaramond-Italic 10pt
    static func flavorText(size: CGFloat = 10) -> Font { ebGaramondItalic(size: size) }

    /// Keyword ability name — EBGaramond-SemiBold 11pt
    static func keywordName(size: CGFloat = 11) -> Font { ebGaramondSemiBold(size: size) }

    /// ATK/HP stat numbers — Oswald-Bold 13pt
    static func statNumber(size: CGFloat = 13) -> Font { oswaldBold(size: size) }

    /// Mana cost numeral — Oswald-Bold 14pt
    static func manaCost(size: CGFloat = 14) -> Font { oswaldBold(size: size) }

    // MARK: — Dossier Front Face (Fredericka the Great)

    /// Card name on front face — 13pt at reference scale
    static func dossierName(size: CGFloat) -> Font { frederickaTheGreat(size: size) }
    /// Field values on front face — 10-11pt
    static func dossierField(size: CGFloat) -> Font { frederickaTheGreat(size: size) }
    /// Field labels on front face — 8pt, paired with 70% opacity
    static func dossierLabel(size: CGFloat) -> Font { frederickaTheGreat(size: size) }

    // MARK: — Intelligence Report Back Face (IM Fell English)

    /// Body text on back face — 10pt
    static func reportBody(size: CGFloat) -> Font { imFellEnglish(size: size) }
    /// Flavor text on back face — 10pt italic
    static func reportItalic(size: CGFloat) -> Font { imFellEnglishItalic(size: size) }
    /// Section labels on back face — 9pt
    static func reportSectionLabel(size: CGFloat) -> Font { imFellEnglish(size: size) }
    /// Faction header on back face — 8pt
    static func reportFactionHeader(size: CGFloat) -> Font { imFellEnglish(size: size) }

    // MARK: - SpriteKit Font Name Strings (PostScript names for SKLabelNode.fontName)

    /// Cinzel Bold PostScript name — use for card name labels in SpriteKit.
    /// If the variable font registered as "Cinzel" only, use "Cinzel" and set weight via
    /// SKLabelNode's attributed text with NSFontAttributeName + bold descriptor.
    static let spriteKitCardName = "Cinzel-Bold"

    /// Cinzel Regular PostScript name for SKLabelNode.
    static let spriteKitCardType = "Cinzel-Regular"

    /// EBGaramond Regular PostScript name for SKLabelNode.
    static let spriteKitAbilityText = "EBGaramond-Regular"

    /// EBGaramond Italic PostScript name for SKLabelNode.
    static let spriteKitFlavorText = "EBGaramond-Italic"

    /// EBGaramond SemiBold PostScript name for SKLabelNode.
    static let spriteKitKeywordName = "EBGaramond-SemiBold"

    /// Oswald-Bold PostScript name for SKLabelNode (stat numerals, mana cost).
    static let spriteKitStatNumber = "Oswald-Bold"

    /// FrederickatheGreat-Regular PostScript name for SKLabelNode (dossier front face).
    static let spriteKitDossierName = "FrederickatheGreat-Regular"

    /// PassionsConflict-Regular PostScript name for SKLabelNode (Demonic Kingdoms front face).
    static let spriteKitPassionsConflict = "PassionsConflict-Regular"

    /// LoversQuarrel-Regular PostScript name for SKLabelNode (Fey Courts front face).
    static let spriteKitLoversQuarrel = "LoversQuarrel-Regular"

    /// RammettoOne-Regular PostScript name for SKLabelNode (The Endless front face — legacy).
    static let spriteKitRammettoOne = "RammettoOne-Regular"

    /// UnifrakturCook-Bold PostScript name for SKLabelNode (The Endless front face).
    static let spriteKitUnifrakturCook = "UnifrakturCook-Bold"

    /// IMFellEnglish-Regular PostScript name for SKLabelNode (report back face body).
    static let spriteKitReportBody = "IMFellEnglish-Regular"

    /// IMFellEnglish-Italic PostScript name for SKLabelNode (report back face italic).
    static let spriteKitReportItalic = "IMFellEnglish-Italic"

    // MARK: - UIFont Accessors for SpriteKit / UIKit

    /// ATK/HP/CM numerals and chaos roll in SpriteKit. Oswald Bold.
    static func statNumberUI(size: CGFloat) -> UIFont {
        if let font = UIFont(name: "Oswald-Bold", size: size) { return font }
        // Fallback per Section 1.5: Impact (closest system match to Oswald)
        if let font = UIFont(name: "Impact", size: size) { return font }
        // Terminal fallback: serif font to maintain aesthetic — never sans-serif system font
        return UIFont(name: "Georgia-Bold", size: size) ?? .systemFont(ofSize: size, weight: .heavy)
    }

    /// Card name in SpriteKit. Cinzel Bold.
    static func cardNameUI(size: CGFloat) -> UIFont {
        cinzelUIFont(size: size, weight: .bold)
    }

    /// Type line, headers in SpriteKit. Cinzel Regular.
    static func cardTypeUI(size: CGFloat) -> UIFont {
        cinzelUIFont(size: size, weight: .regular)
    }

    /// Ability/rules text in SpriteKit. EBGaramond Regular.
    static func abilityTextUI(size: CGFloat) -> UIFont {
        ebGaramondUIFont(size: size, italic: false, semiBold: false)
    }

    /// Flavor text in SpriteKit. EBGaramond Italic.
    static func flavorTextUI(size: CGFloat) -> UIFont {
        ebGaramondUIFont(size: size, italic: true, semiBold: false)
    }

    /// Keyword names in SpriteKit. EBGaramond SemiBold.
    static func keywordNameUI(size: CGFloat) -> UIFont {
        ebGaramondUIFont(size: size, italic: false, semiBold: true)
    }

    /// Dossier front face in SpriteKit / UIKit. Fredericka the Great Regular.
    static func frederickaTheGreatUI(size: CGFloat) -> UIFont {
        if let font = UIFont(name: "FrederickatheGreat-Regular", size: size) { return font }
        // Fallback: Georgia Bold — closest serif match for display weight
        if let fallback = UIFont(name: "Georgia-Bold", size: size) { return fallback }
        return .systemFont(ofSize: size, weight: .bold)
    }

    /// Legacy alias — callers that still reference yesevaOneUI route here.
    static func yesevaOneUI(size: CGFloat) -> UIFont {
        frederickaTheGreatUI(size: size)
    }

    /// Report back face body in SpriteKit / UIKit. IM Fell English Regular.
    static func imFellEnglishUI(size: CGFloat) -> UIFont {
        if let font = UIFont(name: "IMFellEnglish-Regular", size: size) { return font }
        // Fallback: Georgia — closest serif match
        if let fallback = UIFont(name: "Georgia", size: size) { return fallback }
        return .systemFont(ofSize: size, weight: .regular)
    }

    /// Passions Conflict in SpriteKit / UIKit. Demonic Kingdoms front face.
    static func passionsConflictUI(size: CGFloat) -> UIFont {
        if let font = UIFont(name: "PassionsConflict-Regular", size: size) { return font }
        // Fallback: Georgia Bold — closest serif match for display weight
        if let fallback = UIFont(name: "Georgia-Bold", size: size) { return fallback }
        return .systemFont(ofSize: size, weight: .bold)
    }

    /// Lovers Quarrel in SpriteKit / UIKit. Fey Courts front face.
    static func loversQuarrelUI(size: CGFloat) -> UIFont {
        if let font = UIFont(name: "LoversQuarrel-Regular", size: size) { return font }
        if let fallback = UIFont(name: "Georgia-Bold", size: size) { return fallback }
        return .systemFont(ofSize: size, weight: .bold)
    }

    /// Rammetto One in SpriteKit / UIKit. The Endless front face (legacy, kept for reference).
    static func rammettoOneUI(size: CGFloat) -> UIFont {
        if let font = UIFont(name: "RammettoOne-Regular", size: size) { return font }
        if let fallback = UIFont(name: "Georgia-Bold", size: size) { return fallback }
        return .systemFont(ofSize: size, weight: .bold)
    }

    /// UnifrakturCook in SpriteKit / UIKit. The Endless front face.
    static func unifrakturCookUI(size: CGFloat) -> UIFont {
        if let font = UIFont(name: "UnifrakturCook-Bold", size: size) { return font }
        if let fallback = UIFont(name: "Georgia-Bold", size: size) { return fallback }
        return .systemFont(ofSize: size, weight: .bold)
    }

    /// Returns the faction-specific front face UIFont at the given size.
    /// Note: Lovers Quarrel (Fey) is scaled 1.5x because script fonts render
    /// visually smaller than block fonts at the same point size.
    static func factionFontUI(for faction: CardFaction?, size: CGFloat) -> UIFont {
        switch faction {
        case .ironwright:
            return frederickaTheGreatUI(size: size)
        case .demonic:
            return passionsConflictUI(size: size)
        case .celestial:
            return frederickaTheGreatUI(size: size)
        case .fey:
            return loversQuarrelUI(size: size * 1.5)
        case .endless:
            return unifrakturCookUI(size: size)
        case nil:
            return frederickaTheGreatUI(size: size)
        }
    }

    /// Report back face italic in SpriteKit / UIKit. IM Fell English Italic.
    static func imFellEnglishItalicUI(size: CGFloat) -> UIFont {
        if let font = UIFont(name: "IMFellEnglish-Italic", size: size) { return font }
        // Fallback: Georgia Italic — closest serif italic match
        if let fallback = UIFont(name: "Georgia-Italic", size: size) { return fallback }
        return .italicSystemFont(ofSize: size)
    }

    // MARK: - Legacy Accessors (Non-Card UI — Retired from Card Rendering)
    // These remain active for non-card screens until those screens are audited in Phase 2.
    // Do not use these for any new card view work.

    // Bebas Neue — retired from cards, still used in non-card animations
    /// Damage numbers and chaos roll result display in SpriteKit. Bebas Neue.
    static func chaosRollNumberUI(size: CGFloat) -> UIFont {
        if let font = UIFont(name: "BebasNeue-Regular", size: size) { return font }
        let descriptor = UIFontDescriptor(fontAttributes: [.family: "Bebas Neue"])
        let font = UIFont(descriptor: descriptor, size: size)
        if font.familyName.contains("Bebas") { return font }
        // Terminal fallback: serif font to maintain aesthetic — never sans-serif system font
        return UIFont(name: "Georgia-Bold", size: size) ?? .systemFont(ofSize: size, weight: .bold)
    }

    // Fira Sans — retired from cards, still used in UI chrome
    /// UI labels, button text. Fira Sans Regular.
    static func uiLabel(size: CGFloat) -> Font {
        .custom("Fira Sans", size: size).weight(.regular)
    }

    /// Emphasized UI labels. Fira Sans SemiBold.
    static func uiLabelBold(size: CGFloat) -> Font {
        .custom("Fira Sans", size: size).weight(.semibold)
    }

    static func uiLabelUI(size: CGFloat) -> UIFont { firaSansUIFont(size: size, weight: .regular) }
    static func uiLabelBoldUI(size: CGFloat) -> UIFont { firaSansUIFont(size: size, weight: .semibold) }

    // Alegreya — retired from cards, still used in non-card UI
    /// Body text in non-card screens. Alegreya Regular.
    static func body(size: CGFloat) -> Font {
        .custom("Alegreya", size: size).weight(.regular)
    }

    static func bodyBold(size: CGFloat) -> Font {
        .custom("Alegreya", size: size).weight(.bold)
    }

    /// ATK/HP and other numeric stats in non-card screens. Alegreya Bold.
    /// Legacy accessor preserved for non-card UI. Prefer statNumber() for card rendering.
    static func stats(size: CGFloat) -> Font {
        .custom("Alegreya", size: size).weight(.bold)
    }

    /// Large display titles (e.g. onboarding, splash). Cinzel Black.
    /// Legacy accessor preserved for non-card UI screens.
    static func displayTitle(size: CGFloat) -> Font {
        .custom("Cinzel", size: size).weight(.black)
    }

    /// Section headers, navigation titles. Cinzel Regular.
    /// Legacy accessor preserved for non-card UI screens.
    static func header(size: CGFloat) -> Font {
        cinzelRegular(size: size)
    }

    // Legacy SpriteKit PostScript names — non-card screens only
    static let spriteKitHeader = "Cinzel-Regular"
    static let spriteKitBody = "Alegreya-Regular"        // legacy: Alegreya body text in SpriteKit
    static let spriteKitStats = "Alegreya-Bold"          // legacy: Alegreya bold stats in SpriteKit
    static let spriteKitStatNumberLegacy = "BebasNeue-Regular"
    static let spriteKitUILabel = "FiraSans-Regular"
    static let spriteKitUILabelBold = "FiraSans-SemiBold"

    // MARK: - Private UIFont Helpers

    private static func cinzelUIFont(size: CGFloat, weight: UIFont.Weight) -> UIFont {
        // Try PostScript name first (works if variable font registered weight-specific names)
        let psName = weight == .bold ? "Cinzel-Bold" : "Cinzel-Regular"
        if let font = UIFont(name: psName, size: size) { return font }
        // Try family descriptor (works with variable fonts)
        let descriptor = UIFontDescriptor(fontAttributes: [
            .family: "Cinzel",
            .traits: [UIFontDescriptor.TraitKey.weight: weight]
        ])
        let font = UIFont(descriptor: descriptor, size: size)
        if font.familyName.contains("Cinzel") { return font }
        // Fallback per Section 1.5: Georgia — never fall back to sans-serif system font
        let georgiaName = weight == .bold ? "Georgia-Bold" : "Georgia"
        if let fallback = UIFont(name: georgiaName, size: size) { return fallback }
        // Georgia is built-in on iOS, but guard against the impossible
        return UIFont(name: "Georgia", size: size) ?? .systemFont(ofSize: size, weight: weight)
    }

    private static func ebGaramondUIFont(size: CGFloat, italic: Bool, semiBold: Bool) -> UIFont {
        // Try PostScript name first
        let psName: String
        if italic { psName = "EBGaramond-Italic" }
        else if semiBold { psName = "EBGaramond-SemiBold" }
        else { psName = "EBGaramond-Regular" }
        if let font = UIFont(name: psName, size: size) { return font }
        // Try family descriptor
        let baseDescriptor = UIFontDescriptor(fontAttributes: [
            .family: "EB Garamond",
            .traits: [UIFontDescriptor.TraitKey.weight: semiBold ? UIFont.Weight.semibold : UIFont.Weight.regular]
        ])
        let descriptor: UIFontDescriptor
        if italic, let italicDesc = baseDescriptor.withSymbolicTraits(.traitItalic) {
            descriptor = italicDesc
        } else {
            descriptor = baseDescriptor
        }
        let font = UIFont(descriptor: descriptor, size: size)
        if font.familyName.contains("Garamond") { return font }
        // Fallback per Section 1.5: Times New Roman — never fall back to sans-serif system font
        let fallbackName = italic ? "TimesNewRomanPS-ItalicMT" : "TimesNewRomanPSMT"
        if let fallback = UIFont(name: fallbackName, size: size) { return fallback }
        // Times New Roman is built-in on iOS, but guard against the impossible
        return UIFont(name: "TimesNewRomanPSMT", size: size)
            ?? (italic ? .italicSystemFont(ofSize: size) : .systemFont(ofSize: size, weight: .regular))
    }

    private static func firaSansUIFont(size: CGFloat, weight: UIFont.Weight) -> UIFont {
        let psName = weight == .semibold ? "FiraSans-SemiBold" : "FiraSans-Regular"
        if let font = UIFont(name: psName, size: size) { return font }
        let descriptor = UIFontDescriptor(fontAttributes: [
            .family: "Fira Sans",
            .traits: [UIFontDescriptor.TraitKey.weight: weight]
        ])
        let font = UIFont(descriptor: descriptor, size: size)
        if font.familyName.contains("Fira") { return font }
        // Terminal fallback: serif font to maintain aesthetic — never sans-serif system font
        let tnrName = weight == .semibold ? "TimesNewRomanPS-BoldMT" : "TimesNewRomanPSMT"
        return UIFont(name: tnrName, size: size) ?? .systemFont(ofSize: size, weight: weight)
    }

    // MARK: - Debug: Verify Registered Font Names

    /// Call at app launch (DEBUG only) to confirm all required fonts loaded.
    /// Prints "FONT OK" or "FONT NOT FOUND" for each required PostScript name.
    /// Section 4.7: all six names must print OK before proceeding to Phase 1.
    static func debugVerifyRequiredFonts() {
        #if DEBUG
        let required = [
            "Cinzel-Regular",
            "Cinzel-Bold",
            "EBGaramond-Regular",
            "EBGaramond-Italic",
            "EBGaramond-SemiBold",
            "Oswald-Bold",
            "FrederickatheGreat-Regular",
            "IMFellEnglish-Regular",
            "IMFellEnglish-Italic",
            "PassionsConflict-Regular",
            "LoversQuarrel-Regular",
            "RammettoOne-Regular",
            "UnifrakturCook-Bold"
        ]
        print("=== CardFont Phase 0 Verification ===")
        for name in required {
            if UIFont(name: name, size: 14) != nil {
                print("FONT OK: \(name)")
            } else {
                print("FONT NOT FOUND: \(name) — check Info.plist UIAppFonts and pbxproj bundle resources")
            }
        }
        // Also print all registered families that match our target families
        let targetFamilies = ["Cinzel", "Garamond", "Oswald", "Alegreya", "Bebas", "Fira", "Fredericka", "Fell", "Passions", "Lovers", "Rammetto", "Unifraktur"]
        print("--- Registered families ---")
        for family in UIFont.familyNames.sorted() {
            if targetFamilies.contains(where: { family.contains($0) }) {
                print("Family: \(family)")
                for name in UIFont.fontNames(forFamilyName: family) {
                    print("  - \(name)")
                }
            }
        }
        print("=== End CardFont Verification ===")
        #endif
    }
}
