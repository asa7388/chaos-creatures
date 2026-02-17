// ErrorView.swift
// Chaos Creatures
// TODO: Implement in Wave 1
// Standard error state with retry button.

import SwiftUI

struct ErrorView: View {
    let message: String
    let onRetry: () -> Void

    var body: some View {
        VStack {
            Text(message)
            Button("Retry", action: onRetry)
        }
    }
}
