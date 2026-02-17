// ChaosCreaturesApp.swift
// Chaos Creatures
// App entry point. Configures services and determines root view.
// Source: docs/design/07-ui-ux-specs.md Section 7

import SwiftUI

@main
struct ChaosCreaturesApp: App {
    @State private var appState = AppState()
    @State private var router = AppRouter()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appState)
                .environment(router)
                .preferredColorScheme(.dark)
                .task {
                    await appState.initialize()
                }
                .onChange(of: appState.isInitializing) {
                    router.determineRootScreen(appState: appState)
                }
                .onChange(of: appState.auth.isAuthenticated) {
                    router.determineRootScreen(appState: appState)
                    if appState.auth.isAuthenticated {
                        Task { await appState.loadPlayerData() }
                    }
                }
                #if DEBUG
                .onChange(of: appState.isDevMode) {
                    router.determineRootScreen(appState: appState)
                }
                #endif
        }
    }
}

// MARK: - Root View (Routes between splash, sign-in, onboarding, and main)

struct RootView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router

    var body: some View {
        ZStack {
            Color.bgPrimary.ignoresSafeArea()

            switch router.rootScreen {
            case .splash:
                SplashView()
                    .transition(.opacity)

            case .signIn:
                SignInView()
                    .transition(.opacity)

            case .onboarding:
                OnboardingView()
                    .transition(.opacity)

            case .main:
                ContentView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.4), value: router.rootScreen)
        .toast(
            isPresented: Bindable(appState).showToast,
            message: appState.toastMessage,
            type: appState.toastType
        )
    }
}

// MARK: - Splash View

struct SplashView: View {
    @State private var logoOpacity: Double = 0
    @State private var logoScale: Double = 0.8

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "sparkles")
                .font(.system(size: 60))
                .foregroundColor(.ironwright)
                .opacity(logoOpacity)
                .scaleEffect(logoScale)

            Text("Chaos Creatures")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundColor(.textPrimary)
                .opacity(logoOpacity)

            ProgressView()
                .progressViewStyle(.circular)
                .tint(.textTertiary)
                .padding(.top, 20)
                .opacity(logoOpacity)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.bgPrimary)
        .onAppear {
            withAnimation(.easeOut(duration: 0.8)) {
                logoOpacity = 1
                logoScale = 1
            }
        }
    }
}

// MARK: - Sign In View

struct SignInView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            // Logo area
            VStack(spacing: 16) {
                Image(systemName: "sparkles")
                    .font(.system(size: 72))
                    .foregroundColor(.ironwright)

                Text("Chaos Creatures")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundColor(.textPrimary)

                Text("AI-Generated Card Game")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.textSecondary)
            }

            Spacer()

            // Sign in button
            VStack(spacing: 16) {
                Button(action: {
                    Task { await appState.auth.signInWithApple() }
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: "apple.logo")
                            .font(.system(size: 18))
                        Text("Sign in with Apple")
                            .font(.system(size: 17, weight: .semibold))
                    }
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity, minHeight: 52)
                    .background(Color.white)
                    .cornerRadius(12)
                }
                .padding(.horizontal, 40)
                .disabled(appState.auth.isLoading)

                if appState.auth.isLoading {
                    ProgressView()
                        .tint(.white)
                }

                if let error = appState.auth.error {
                    Text(error)
                        .font(.system(size: 13))
                        .foregroundColor(.chaosRed)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                }
            }

            #if DEBUG
            Button(action: {
                appState.enterDevMode()
            }) {
                HStack(spacing: 6) {
                    Image(systemName: "hammer.fill")
                        .font(.system(size: 14))
                    Text("Dev Mode (Skip Auth)")
                        .font(.system(size: 14, weight: .medium))
                }
                .foregroundColor(.textSecondary)
                .frame(maxWidth: .infinity, minHeight: 44)
                .background(Color.white.opacity(0.08))
                .cornerRadius(10)
            }
            .padding(.horizontal, 40)
            #endif

            // Legal links
            HStack(spacing: 4) {
                Text("By signing in, you agree to our")
                    .font(.system(size: 11))
                    .foregroundColor(.textTertiary)
                Link("Terms", destination: URL(string: "https://chaoscreatures.app/terms")!)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.textSecondary)
                Text("and")
                    .font(.system(size: 11))
                    .foregroundColor(.textTertiary)
                Link("Privacy Policy", destination: URL(string: "https://chaoscreatures.app/privacy")!)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.textSecondary)
            }
            .padding(.bottom, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.bgPrimary)
    }
}

#Preview("Splash") {
    SplashView()
}

#Preview("Sign In") {
    SignInView()
        .environment(AppState())
}
