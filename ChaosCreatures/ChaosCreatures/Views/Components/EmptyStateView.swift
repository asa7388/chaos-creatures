// EmptyStateView.swift
// Chaos Creatures
// TODO: Implement in Wave 1
// Standard empty state (icon + message + optional action).

import SwiftUI

struct EmptyStateView: View {
    let message: String

    var body: some View {
        VStack {
            Text(message)
                .foregroundColor(.secondary)
        }
    }
}
