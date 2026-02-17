// LoadingView.swift
// Chaos Creatures
// TODO: Implement in Wave 1
// Standard loading state (spinner + optional message).

import SwiftUI

struct LoadingView: View {
    let message: String

    init(_ message: String = "Loading...") {
        self.message = message
    }

    var body: some View {
        VStack {
            ProgressView()
            Text(message)
        }
    }
}
