// LoadingView.swift
// Chaos Creatures
// Standard loading state with spinner, message, and dark theme styling.
// Source: docs/design/07-ui-ux-specs.md Section 11

import SwiftUI

struct LoadingView: View {
    let message: String

    init(_ message: String = "Loading...") {
        self.message = message
    }

    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .progressViewStyle(.circular)
                .tint(.white)
                .scaleEffect(1.3)

            Text(message)
                .font(CardFont.body(size: 15))
                .foregroundColor(.textSecondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.bgPrimary)
    }
}

#Preview {
    LoadingView("Fetching your collection...")
}
