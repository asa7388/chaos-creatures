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
                .font(.system(size: 48))
                .foregroundColor(.textTertiary)

            Text(message)
                .font(.system(size: 17, weight: .semibold))
                .foregroundColor(.textPrimary)

            if let description {
                Text(description)
                    .font(.system(size: 14))
                    .foregroundColor(.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }

            if let actionTitle, let action {
                Button(action: action) {
                    Text(actionTitle)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
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
        print("Action tapped")
    }
}
