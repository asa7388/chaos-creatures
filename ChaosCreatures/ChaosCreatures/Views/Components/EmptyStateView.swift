// EmptyStateView.swift
// Chaos Creatures
// Standard empty state with icon, message, and optional action button.
// Source: docs/design/07-ui-ux-specs.md Section 11.2

import SwiftUI

struct EmptyStateView: View {
    let icon: String
    let message: String
    let description: String?
    let actionTitle: String?
    let action: (() -> Void)?

    init(
        icon: String = "tray",
        message: String,
        description: String? = nil,
        actionTitle: String? = nil,
        action: (() -> Void)? = nil
    ) {
        self.icon = icon
        self.message = message
        self.description = description
        self.actionTitle = actionTitle
        self.action = action
    }

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 48))  // SF Symbol icon size - keep as-is
                .foregroundColor(.textTertiary)

            Text(message)
                .font(CardFont.bodyBold(size: 17))
                .foregroundColor(.textPrimary)

            if let description {
                Text(description)
                    .font(CardFont.body(size: 14))
                    .foregroundColor(.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }

            if let actionTitle, let action {
                Button(action: action) {
                    Text(actionTitle)
                        .font(CardFont.bodyBold(size: 14))
                        .foregroundColor(.textPrimary)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 10)
                        .background(Color.borderActive)
                        .cornerRadius(8)
                }
                .padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.bgPrimary)
    }
}

#Preview {
    EmptyStateView(
        icon: "rectangle.stack",
        message: "No cards yet",
        description: "Visit the Shop to get your first cards.",
        actionTitle: "Visit Shop"
    ) {
        // no-op
    }
}
