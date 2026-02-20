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
            Image("UIIcons/ui-chaos-spark")
                .renderingMode(.template)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 60, height: 60)
                .foregroundColor(.ironwright)
                .opacity(logoOpacity)
                .scaleEffect(logoScale)

            Text("Chaos Creatures")
                .font(CardFont.displayTitle(size: 28))
                .foregroundColor(.textPrimary)
                .opacity(logoOpacity)

            ChaosMoteSpinner(size: 30, tint: .ironwright)
                .padding(.top, 20)
                .opacity(logoOpacity)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            ZStack {
                Color.bgPrimary
                Image("UIBackgrounds/bg-dark-leather")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
                    .opacity(0.28)
            }
        )
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
                Image("UIIcons/ui-chaos-spark")
                    .renderingMode(.template)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 72, height: 72)
                    .foregroundColor(.ironwright)

                Text("Chaos Creatures")
                    .font(CardFont.displayTitle(size: 32))
                    .foregroundColor(.textPrimary)

                Text("AI-Generated Card Game")
                    .font(CardFont.uiLabel(size: 16))
                    .foregroundColor(.textSecondary)
            }

            Spacer()

            // Sign in button
            VStack(spacing: 16) {
                Button(action: {
                    Task { await appState.auth.signInWithApple() }
                }) {
                    HStack(spacing: 0) {
                        Text("Sign in with Apple")
                            .font(CardFont.uiLabelBold(size: 17))
                    }
                    .foregroundColor(.black)
                    .frame(maxWidth: .infinity, minHeight: 52)
                    .background(Color.white)
                    .cornerRadius(12)
                }
                .padding(.horizontal, 40)
                .disabled(appState.auth.isLoading)

                if appState.auth.isLoading {
                    ChaosMoteSpinner(size: 24, tint: .appAccent)
                }

                if let error = appState.auth.error {
                    Text(error)
                        .font(CardFont.body(size: 13))
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
                    Image("UIIcons/ui-chaos-rift")
                        .renderingMode(.template)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 14, height: 14)
                    Text("Dev Mode (Skip Auth)")
                        .font(CardFont.uiLabel(size: 14))
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
                    .font(CardFont.body(size: 11))
                    .foregroundColor(.textTertiary)
                Link("Terms", destination: URL(string: "https://chaoscreatures.app/terms")!)
                    .font(CardFont.bodyBold(size: 11))
                    .foregroundColor(.textSecondary)
                Text("and")
                    .font(CardFont.body(size: 11))
                    .foregroundColor(.textTertiary)
                Link("Privacy Policy", destination: URL(string: "https://chaoscreatures.app/privacy")!)
                    .font(CardFont.bodyBold(size: 11))
                    .foregroundColor(.textSecondary)
            }
            .padding(.bottom, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            ZStack {
                Color.bgPrimary
                Image("UIBackgrounds/bg-dark-leather")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
                    .opacity(0.28)
            }
        )
    }
}

#Preview("Splash") {
    SplashView()
}

#Preview("Sign In") {
    SignInView()
        .environment(AppState())
}
