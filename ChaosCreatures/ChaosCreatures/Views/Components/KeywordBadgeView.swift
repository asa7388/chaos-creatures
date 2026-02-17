// KeywordBadgeView.swift
// Chaos Creatures
// Keyword badge with icon and tooltip on long press.
// Source: docs/design/07-ui-ux-specs.md Section 8.3

import SwiftUI

struct KeywordBadgeView: View {
    let keyword: Keyword
    @State private var showTooltip = false

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: keyword.iconName)
                .font(.system(size: 11))
            Text(keyword.displayName)
                .font(.system(size: 11, weight: .medium))
        }
        .foregroundColor(keywordColor)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(keywordColor.opacity(0.15))
        .cornerRadius(6)
        .onLongPressGesture(minimumDuration: 0.4) {
            showTooltip = true
        }
        .popover(isPresented: $showTooltip) {
            KeywordTooltipView(keyword: keyword)
                .presentationCompactAdaptation(.popover)
        }
    }

    private var keywordColor: Color {
        switch keyword {
        case .shield: return .orderBlue
        case .lifesteal: return .healGreen
        case .flying: return Color(hex: "#90CAF9")
        case .reach: return .damageOrange
        case .deathtouch: return .chaosRed
        case .taunt: return .tauntGold
        case .piercing: return .warningYellow
        }
    }
}

// MARK: - Keyword Tooltip

struct KeywordTooltipView: View {
    let keyword: Keyword

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: keyword.iconName)
                    .font(.system(size: 16))
                Text(keyword.displayName)
                    .font(.system(size: 16, weight: .bold))
            }
            .foregroundColor(.textPrimary)

            Text(keyword.description)
                .font(.system(size: 13))
                .foregroundColor(.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(16)
        .frame(width: 240)
        .background(Color.bgSecondary)
    }
}

// MARK: - Keyword Row (for card detail)

struct KeywordRowView: View {
    let keywords: [Keyword]

    var body: some View {
        if keywords.isEmpty {
            EmptyView()
        } else {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(keywords) { keyword in
                        KeywordBadgeView(keyword: keyword)
                    }
                }
            }
        }
    }
}

#Preview {
    VStack(spacing: 12) {
        KeywordRowView(keywords: [.shield, .lifesteal, .flying])
        KeywordRowView(keywords: [.taunt, .deathtouch, .piercing, .reach])
    }
    .padding()
    .background(Color.bgPrimary)
}
