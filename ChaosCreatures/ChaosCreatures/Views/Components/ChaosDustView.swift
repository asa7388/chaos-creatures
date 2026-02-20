// ChaosDustView.swift
// Chaos Creatures
// Embossed metal-plate currency display for Chaos Dust balance.
// Shows the dust count as an engraved numeral on a small bronze token.
// Source: docs/design/13-visual-design-guide.md

import SwiftUI

/// Compact Chaos Dust display — bronze metal plate with embossed numeral.
/// Use in shop headers, stat tiles, and anywhere the player's dust balance appears.
struct ChaosDustView: View {
    let amount: Int
    var size: ChaosDustSize = .standard

    var body: some View {
        HStack(spacing: size.iconSpacing) {
            // Chaos mote icon
            Image("StatIcons/chaos-mote-ironwright")
                .resizable()
                .frame(width: size.iconSize, height: size.iconSize)

            // Embossed metal plate with numeral
            Text("\(amount)")
                .font(CardFont.statNumber(size: size.fontSize))
                .foregroundStyle(
                    LinearGradient(
                        colors: [
                            Color(hex: "#FFD97D"),  // Bright gold highlight
                            Color(hex: "#C9A84C"),  // Mid gold (appAccent)
                            Color(hex: "#8B7332"),  // Dark gold shadow
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .shadow(color: .black.opacity(0.6), radius: 0.5, x: 0, y: 1)  // Engraved shadow
                .shadow(color: Color(hex: "#FFD97D").opacity(0.3), radius: 0.5, x: 0, y: -0.5)  // Top bevel highlight
                .padding(.horizontal, size.platePaddingH)
                .padding(.vertical, size.platePaddingV)
                .background(
                    ZStack {
                        // Metal plate base
                        RoundedRectangle(cornerRadius: size.plateRadius)
                            .fill(
                                LinearGradient(
                                    colors: [
                                        Color(hex: "#4A3F2F"),  // Top — darker bronze
                                        Color(hex: "#3A3025"),  // Bottom — deep bronze
                                    ],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )

                        // Bronze texture overlay
                        Image("CardTextures/metal-bronze")
                            .resizable()
                            .opacity(0.25)
                            .clipShape(RoundedRectangle(cornerRadius: size.plateRadius))

                        // Inner bevel highlight (top edge catch)
                        RoundedRectangle(cornerRadius: size.plateRadius)
                            .stroke(
                                LinearGradient(
                                    stops: [
                                        .init(color: Color(hex: "#C9A84C").opacity(0.5), location: 0.0),
                                        .init(color: .clear, location: 0.3),
                                        .init(color: .clear, location: 0.7),
                                        .init(color: Color.black.opacity(0.3), location: 1.0),
                                    ],
                                    startPoint: .top,
                                    endPoint: .bottom
                                ),
                                lineWidth: 1
                            )
                    }
                )
                .shadow(color: .black.opacity(0.4), radius: 2, x: 0, y: 1)  // Plate drop shadow
        }
    }
}

// MARK: - Size Variants

enum ChaosDustSize {
    case compact     // For stat tiles, inline mentions
    case standard    // For shop header, balance display
    case large       // For pack opening cost display

    var iconSize: CGFloat {
        switch self {
        case .compact: return 16
        case .standard: return 22
        case .large: return 28
        }
    }

    var fontSize: CGFloat {
        switch self {
        case .compact: return 14
        case .standard: return 20
        case .large: return 24
        }
    }

    var iconSpacing: CGFloat {
        switch self {
        case .compact: return 4
        case .standard: return 6
        case .large: return 8
        }
    }

    var platePaddingH: CGFloat {
        switch self {
        case .compact: return 6
        case .standard: return 10
        case .large: return 14
        }
    }

    var platePaddingV: CGFloat {
        switch self {
        case .compact: return 2
        case .standard: return 3
        case .large: return 4
        }
    }

    var plateRadius: CGFloat {
        switch self {
        case .compact: return 4
        case .standard: return 6
        case .large: return 8
        }
    }
}

#Preview {
    VStack(spacing: 24) {
        ChaosDustView(amount: 1250, size: .compact)
        ChaosDustView(amount: 1250, size: .standard)
        ChaosDustView(amount: 1250, size: .large)

        // In context: shop header style
        HStack {
            ChaosDustView(amount: 500)
            Spacer()
            Text("Balance")
                .font(CardFont.body(size: 13))
                .foregroundColor(.textSecondary)
        }
        .padding(.horizontal, 16)
    }
    .padding(20)
    .background(Color.bgPrimary)
}
