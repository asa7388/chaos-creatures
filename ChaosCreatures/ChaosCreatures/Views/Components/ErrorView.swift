// ErrorView.swift
// Chaos Creatures
// Standard error state with retry button and dark theme styling.
// Source: docs/design/07-ui-ux-specs.md Section 11

import SwiftUI

struct ErrorView: View {
    let message: String
    let onRetry: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 44))
                .foregroundColor(.warningYellow)

            Text("Something went wrong")
                .font(CardFont.cardName(size: 18))
                .foregroundColor(.textPrimary)

            Text(message)
                .font(CardFont.body(size: 14))
                .foregroundColor(.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Button(action: onRetry) {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.clockwise")
                    Text("Retry")
                }
                .font(CardFont.bodyBold(size: 15))
                .foregroundColor(.white)
                .padding(.horizontal, 28)
                .padding(.vertical, 12)
                .background(Color.borderActive)
                .cornerRadius(10)
            }
            .padding(.top, 4)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.bgPrimary)
    }
}

#Preview {
    ErrorView(message: "Failed to load collection. Check your connection and try again.") {
        print("Retry tapped")
    }
}
