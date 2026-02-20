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
                .contactShadow()
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
                                .foregroundColor(.textPrimary)
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
                            .foregroundColor(.textPrimary)
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
                    .foregroundColor(.textPrimary)
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

    /// Leather-textured panel background
    func leatherPanel(cornerRadius: CGFloat = 12) -> some View {
        self
            .background(
                ZStack {
                    Color.bgSecondary
                    Image("UIComponents/ui-panel-leather")
                        .resizable()
                        .opacity(0.5)
                }
                .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(Color.borderDefault.opacity(0.6), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.25), radius: 4, y: 2)
    }

    /// Parchment-textured panel background
    func parchmentPanel(cornerRadius: CGFloat = 12) -> some View {
        self
            .background(
                ZStack {
                    Color(hex: "#2A2318")
                    Image("CardTextures/tex-parchment")
                        .resizable()
                        .opacity(0.35)
                }
                .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(Color.tauntGold.opacity(0.2), lineWidth: 0.5)
            )
    }

    /// Metal-textured panel (for premium/highlighted sections)
    func metalPanel(texture: String = "CardTextures/metal-bronze", cornerRadius: CGFloat = 12) -> some View {
        self
            .background(
                ZStack {
                    Color.bgTertiary
                    Image(texture)
                        .resizable()
                        .opacity(0.3)
                }
                .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(Color.tauntGold.opacity(0.3), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.3), radius: 3, y: 1)
    }

    // MARK: - Contact Shadow

    /// Contact shadow — dark at base, fades quickly. Cards rest on surface, don't float.
    func contactShadow(opacity: Double = 0.5, yOffset: CGFloat = 2) -> some View {
        self
            .shadow(color: .black.opacity(opacity), radius: 1, x: 0, y: yOffset)
            .shadow(color: .black.opacity(opacity * 0.3), radius: 3, x: 0, y: yOffset + 1)
    }
}

// MARK: - Button Styles

/// Embossed cardstock button — default for most UI actions
struct CardstockButtonStyle: ButtonStyle {
    var tintColor: Color = .textPrimary

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(
                ZStack {
                    Color.bgTertiary
                    Image(configuration.isPressed
                          ? "UIComponents/ui-button-cardstock-pressed"
                          : "UIComponents/ui-button-cardstock")
                        .resizable()
                        .opacity(0.6)
                }
                .clipShape(RoundedRectangle(cornerRadius: 10))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color.borderDefault.opacity(0.5), lineWidth: 0.5)
            )
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

/// Metal-accented button for primary CTAs
struct MetalButtonStyle: ButtonStyle {
    var metalColor: Color = .tauntGold
    var metalTexture: String = "CardTextures/metal-bronze"

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .background(
                ZStack {
                    metalColor.opacity(0.8)
                    Image(metalTexture)
                        .resizable()
                        .opacity(configuration.isPressed ? 0.5 : 0.35)
                }
                .clipShape(RoundedRectangle(cornerRadius: 10))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(metalColor.opacity(0.6), lineWidth: 1)
            )
            .shadow(color: metalColor.opacity(configuration.isPressed ? 0.1 : 0.3), radius: 4, y: 2)
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}
