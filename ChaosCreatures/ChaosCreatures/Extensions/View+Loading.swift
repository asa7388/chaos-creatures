// View+Loading.swift
// Chaos Creatures
// View modifiers for loading, error, and empty state overlays.
// Source: docs/design/07-ui-ux-specs.md Sections 11, 13

import SwiftUI

// MARK: - Loading Overlay Modifier

struct LoadingOverlayModifier: ViewModifier {
    let isLoading: Bool
    let message: String

    func body(content: Content) -> some View {
        ZStack {
            content
                .disabled(isLoading)
                .opacity(isLoading ? 0.4 : 1.0)

            if isLoading {
                VStack(spacing: 12) {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(.white)
                        .scaleEffect(1.2)
                    if !message.isEmpty {
                        Text(message)
                            .font(CardFont.body(size: 14))
                            .foregroundColor(.textSecondary)
                    }
                }
                .padding(24)
                .background(Color.bgTertiary.opacity(0.95))
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.4), radius: 12)
                .transition(.opacity.combined(with: .scale(scale: 0.9)))
            }
        }
        .animation(.easeInOut(duration: 0.25), value: isLoading)
    }
}

// MARK: - Error Overlay Modifier

struct ErrorOverlayModifier: ViewModifier {
    let error: String?
    let onRetry: (() -> Void)?

    func body(content: Content) -> some View {
        ZStack {
            content

            if let error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 36))
                        .foregroundColor(.warningYellow)

                    Text(error)
                        .font(CardFont.body(size: 14))
                        .foregroundColor(.textPrimary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 16)

                    if let onRetry {
                        Button(action: onRetry) {
                            Text("Retry")
                                .font(CardFont.bodyBold(size: 14))
                                .foregroundColor(.white)
                                .padding(.horizontal, 24)
                                .padding(.vertical, 10)
                                .background(Color.borderActive)
                                .cornerRadius(8)
                        }
                    }
                }
                .padding(24)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.bgPrimary.opacity(0.9))
                .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.25), value: error != nil)
    }
}

// MARK: - Empty State Modifier

struct EmptyStateModifier: ViewModifier {
    let isEmpty: Bool
    let icon: String
    let message: String
    let actionTitle: String?
    let action: (() -> Void)?

    func body(content: Content) -> some View {
        if isEmpty {
            VStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.system(size: 48))
                    .foregroundColor(.textTertiary)

                Text(message)
                    .font(CardFont.body(size: 16))
                    .foregroundColor(.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                if let actionTitle, let action {
                    Button(action: action) {
                        Text(actionTitle)
                            .font(CardFont.bodyBold(size: 14))
                            .foregroundColor(.white)
                            .padding(.horizontal, 24)
                            .padding(.vertical, 10)
                            .background(Color.borderActive)
                            .cornerRadius(8)
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.bgPrimary)
        } else {
            content
        }
    }
}

// MARK: - Toast Modifier

enum ToastType {
    case info
    case warning
    case error
    case success

    var color: Color {
        switch self {
        case .info: return .borderActive
        case .warning: return .warningYellow
        case .error: return .chaosRed
        case .success: return .healGreen
        }
    }
}

struct ToastModifier: ViewModifier {
    @Binding var isPresented: Bool
    let message: String
    let type: ToastType

    func body(content: Content) -> some View {
        ZStack(alignment: .bottom) {
            content

            if isPresented {
                Text(message)
                    .font(CardFont.body(size: 14))
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(type.color)
                    .cornerRadius(20)
                    .shadow(radius: 8)
                    .padding(.bottom, 60) // Above tab bar
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .onAppear {
                        Task {
                            try? await Task.sleep(nanoseconds: 2_000_000_000)
                            withAnimation(.easeInOut(duration: 0.3)) {
                                isPresented = false
                            }
                        }
                    }
            }
        }
        .animation(.spring(response: 0.5, dampingFraction: 0.8), value: isPresented)
    }
}

// MARK: - Shimmer Effect Modifier

struct ShimmerModifier: ViewModifier {
    @State private var phase: CGFloat = -1

    func body(content: Content) -> some View {
        content
            .overlay(
                LinearGradient(
                    gradient: Gradient(colors: [
                        .clear,
                        Color.white.opacity(0.15),
                        .clear
                    ]),
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .offset(x: phase * 300)
                .mask(content)
            )
            .onAppear {
                withAnimation(
                    .linear(duration: 1.5)
                    .repeatForever(autoreverses: false)
                ) {
                    phase = 1
                }
            }
    }
}

// MARK: - View Extension

extension View {
    /// Overlay a loading spinner with optional message
    func loading(isLoading: Bool, message: String = "Loading...") -> some View {
        modifier(LoadingOverlayModifier(isLoading: isLoading, message: message))
    }

    /// Overlay an error message with optional retry button
    func errorOverlay(error: String?, onRetry: (() -> Void)? = nil) -> some View {
        modifier(ErrorOverlayModifier(error: error, onRetry: onRetry))
    }

    /// Show an empty state when content is empty
    func emptyState(
        isEmpty: Bool,
        icon: String = "tray",
        message: String,
        actionTitle: String? = nil,
        action: (() -> Void)? = nil
    ) -> some View {
        modifier(EmptyStateModifier(
            isEmpty: isEmpty,
            icon: icon,
            message: message,
            actionTitle: actionTitle,
            action: action
        ))
    }

    /// Show a toast notification
    func toast(isPresented: Binding<Bool>, message: String, type: ToastType = .info) -> some View {
        modifier(ToastModifier(isPresented: isPresented, message: message, type: type))
    }

    /// Apply shimmer loading effect (for skeleton screens)
    func shimmer() -> some View {
        modifier(ShimmerModifier())
    }

    /// Standard dark background for all screens
    func darkBackground() -> some View {
        self.background(Color.bgPrimary.ignoresSafeArea())
    }

    /// Card-style background with rounded corners
    func cardBackground() -> some View {
        self
            .background(Color.bgSecondary)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.borderDefault, lineWidth: 1)
            )
    }
}
