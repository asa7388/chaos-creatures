// SettingsView.swift
// Chaos Creatures
// App settings: account, audio, visuals, gameplay, notifications, privacy.
// Source: docs/design/07-ui-ux-specs.md Section 14
// Redesigned: Wave 8 visual polish — custom physical-material UI, no native Form/Toggle/Slider.

import SwiftUI

// MARK: - Custom Toggle (Leather/Metal Switch)

/// A physical on/off switch with leather track and bronze metal knob.
private struct PhysicalToggle: View {
    @Binding var isOn: Bool

    private let trackWidth: CGFloat = 52
    private let trackHeight: CGFloat = 28
    private let knobSize: CGFloat = 24
    private let onColor = Color(hex: "#4A7A3A")    // Muted forest green
    private let offColor = Color(hex: "#3A2A1A")    // Dark leather brown
    private let knobColor = Color(hex: "#C9A84C")   // Bronze gold

    var body: some View {
        ZStack(alignment: isOn ? .trailing : .leading) {
            // Track — leather-textured
            RoundedRectangle(cornerRadius: trackHeight / 2)
                .fill(isOn ? onColor : offColor)
                .frame(width: trackWidth, height: trackHeight)
                .overlay(
                    // Leather texture overlay on track
                    Image("CardTextures/leather-panel")
                        .resizable()
                        .opacity(0.3)
                        .clipShape(RoundedRectangle(cornerRadius: trackHeight / 2))
                )
                .overlay(
                    // Inner shadow for depth
                    RoundedRectangle(cornerRadius: trackHeight / 2)
                        .strokeBorder(
                            LinearGradient(
                                colors: [.black.opacity(0.4), .clear, .white.opacity(0.1)],
                                startPoint: .top,
                                endPoint: .bottom
                            ),
                            lineWidth: 1
                        )
                )

            // Knob — bronze metal
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            knobColor.opacity(0.9),
                            knobColor.opacity(0.6),
                            Color(hex: "#8B6914")
                        ],
                        center: .init(x: 0.35, y: 0.3),
                        startRadius: 0,
                        endRadius: knobSize
                    )
                )
                .frame(width: knobSize, height: knobSize)
                .overlay(
                    // Metal sheen highlight
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [.white.opacity(0.3), .clear],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .padding(2)
                )
                .overlay(
                    Circle()
                        .strokeBorder(Color(hex: "#8B6914"), lineWidth: 0.5)
                )
                .shadow(color: .black.opacity(0.4), radius: 2, x: 0, y: 1)
                .padding(.horizontal, 2)
        }
        .frame(width: trackWidth, height: trackHeight)
        .contentShape(Rectangle())
        .onTapGesture {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                isOn.toggle()
            }
        }
    }
}

// MARK: - Custom Slider (Leather Track + Bronze Knob)

/// A physical slider with leather-textured track and bronze draggable knob.
private struct PhysicalSlider: View {
    @Binding var value: Double
    var range: ClosedRange<Double> = 0...1

    private let trackHeight: CGFloat = 10
    private let knobSize: CGFloat = 26
    private let fillColor = Color(hex: "#4A7A3A")
    private let trackColor = Color(hex: "#2A1E14")
    private let knobColor = Color(hex: "#C9A84C")

    var body: some View {
        GeometryReader { geometry in
            let trackWidth = geometry.size.width
            let normalizedValue = (value - range.lowerBound) / (range.upperBound - range.lowerBound)
            let knobX = normalizedValue * (trackWidth - knobSize)

            ZStack(alignment: .leading) {
                // Track background — leather
                RoundedRectangle(cornerRadius: trackHeight / 2)
                    .fill(trackColor)
                    .frame(height: trackHeight)
                    .overlay(
                        Image("CardTextures/leather-panel")
                            .resizable()
                            .opacity(0.25)
                            .clipShape(RoundedRectangle(cornerRadius: trackHeight / 2))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: trackHeight / 2)
                            .strokeBorder(
                                LinearGradient(
                                    colors: [.black.opacity(0.5), .clear],
                                    startPoint: .top,
                                    endPoint: .bottom
                                ),
                                lineWidth: 1
                            )
                    )

                // Filled portion
                RoundedRectangle(cornerRadius: trackHeight / 2)
                    .fill(
                        LinearGradient(
                            colors: [fillColor.opacity(0.7), fillColor],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: max(trackHeight, knobX + knobSize / 2), height: trackHeight)

                // Knob — bronze metal
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                knobColor.opacity(0.95),
                                knobColor.opacity(0.65),
                                Color(hex: "#8B6914")
                            ],
                            center: .init(x: 0.35, y: 0.3),
                            startRadius: 0,
                            endRadius: knobSize
                        )
                    )
                    .frame(width: knobSize, height: knobSize)
                    .overlay(
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [.white.opacity(0.3), .clear],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .padding(3)
                    )
                    .overlay(
                        Circle()
                            .strokeBorder(Color(hex: "#8B6914"), lineWidth: 0.5)
                    )
                    .shadow(color: .black.opacity(0.5), radius: 3, x: 0, y: 1)
                    .offset(x: knobX)
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { drag in
                                let newX = drag.location.x
                                let clampedX = min(max(0, newX), trackWidth)
                                let newValue = range.lowerBound + (clampedX / trackWidth) * (range.upperBound - range.lowerBound)
                                value = min(max(newValue, range.lowerBound), range.upperBound)
                            }
                    )
            }
            .frame(height: knobSize)
        }
        .frame(height: 26)
    }
}

// MARK: - Custom Picker (Segmented, Physical Style)

/// A segmented picker with parchment background and embossed selected state.
private struct PhysicalPicker<T: Hashable>: View {
    @Binding var selection: T
    let options: [(label: String, value: T)]

    var body: some View {
        HStack(spacing: 0) {
            ForEach(Array(options.enumerated()), id: \.offset) { index, option in
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selection = option.value
                    }
                } label: {
                    Text(option.label)
                        .font(CardFont.body(size: 13))
                        .foregroundColor(selection == option.value ? Color(hex: "#F0EAD6") : Color(hex: "#888888"))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(
                            Group {
                                if selection == option.value {
                                    RoundedRectangle(cornerRadius: 6)
                                        .fill(Color(hex: "#4A3A2A"))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 6)
                                                .strokeBorder(Color(hex: "#C9A84C").opacity(0.4), lineWidth: 0.5)
                                        )
                                        .shadow(color: .black.opacity(0.3), radius: 2, y: 1)
                                }
                            }
                        )
                }
                .buttonStyle(.plain)

                if index < options.count - 1 {
                    Rectangle()
                        .fill(Color(hex: "#3A2A1A").opacity(0.5))
                        .frame(width: 1)
                        .padding(.vertical, 4)
                }
            }
        }
        .padding(3)
        .background(Color(hex: "#1A1410"))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .strokeBorder(Color(hex: "#3A2A1A"), lineWidth: 1)
        )
    }
}

// MARK: - Section Panel

/// A vellum-textured section panel with embossed Cinzel header.
private struct SectionPanel<Content: View>: View {
    let title: String
    let icon: String?
    @ViewBuilder let content: () -> Content

    init(_ title: String, icon: String? = nil, @ViewBuilder content: @escaping () -> Content) {
        self.title = title
        self.icon = icon
        self.content = content
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Embossed header
            HStack(spacing: 8) {
                if let icon {
                    ThemedGlyph(symbol: icon, size: 14, weight: .medium, color: Color(hex: "#C9A84C"))
                }
                Text(title.uppercased())
                    .font(CardFont.cardName(size: 14))
                    .foregroundColor(Color(hex: "#C9A84C"))
                    .shadow(color: .black.opacity(0.6), radius: 0, x: 0, y: 1)
            }
            .padding(.bottom, 2)

            // Thin separator line
            Rectangle()
                .fill(
                    LinearGradient(
                        colors: [
                            Color(hex: "#C9A84C").opacity(0.0),
                            Color(hex: "#C9A84C").opacity(0.3),
                            Color(hex: "#C9A84C").opacity(0.3),
                            Color(hex: "#C9A84C").opacity(0.0)
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(height: 1)

            content()
        }
        .padding(16)
        .background(
            ZStack {
                Color(hex: "#1E1A14")
                Image("CardTextures/dark-vellum")
                    .resizable()
                    .opacity(0.25)
            }
            .clipShape(RoundedRectangle(cornerRadius: 12))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(
                    LinearGradient(
                        colors: [
                            Color(hex: "#C9A84C").opacity(0.2),
                            Color(hex: "#3A2A1A").opacity(0.4),
                            Color(hex: "#C9A84C").opacity(0.1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 0.5
                )
        )
        .shadow(color: .black.opacity(0.4), radius: 4, y: 2)
    }
}

// MARK: - Setting Row Components

/// A toggle setting row: label on left, physical toggle on right.
private struct ToggleRow: View {
    let label: String
    @Binding var isOn: Bool

    var body: some View {
        HStack {
            Text(label)
                .font(CardFont.body(size: 16))
                .foregroundColor(Color(hex: "#F0EAD6"))
            Spacer()
            PhysicalToggle(isOn: $isOn)
        }
        .padding(.vertical, 2)
    }
}

/// A slider setting row: label above, physical slider below.
private struct SliderRow: View {
    let label: String
    @Binding var value: Double
    var range: ClosedRange<Double> = 0...1

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(label)
                    .font(CardFont.body(size: 15))
                    .foregroundColor(Color(hex: "#F0EAD6").opacity(0.7))
                Spacer()
                Text("\(Int(value * 100))%")
                    .font(CardFont.stats(size: 14))
                    .foregroundColor(Color(hex: "#C9A84C"))
                    .frame(width: 40, alignment: .trailing)
            }
            PhysicalSlider(value: $value, range: range)
        }
        .padding(.vertical, 2)
    }
}

/// An info row: label on left, value on right.
private struct InfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(CardFont.body(size: 16))
                .foregroundColor(Color(hex: "#F0EAD6"))
            Spacer()
            Text(value)
                .font(CardFont.body(size: 16))
                .foregroundColor(Color(hex: "#AAAAAA"))
        }
        .padding(.vertical, 2)
    }
}

/// A tappable link/action row with chevron.
private struct ActionRow: View {
    let label: String
    let icon: String?
    var isDestructive: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                if let icon {
                    ThemedGlyph(
                        symbol: icon,
                        size: 14,
                        color: isDestructive ? Color(hex: "#E63946") : Color(hex: "#C9A84C")
                    )
                        .frame(width: 20)
                }
                Text(label)
                    .font(CardFont.body(size: 16))
                    .foregroundColor(isDestructive ? Color(hex: "#E63946") : Color(hex: "#F0EAD6"))
                Spacer()
                if !isDestructive {
                    ThemedGlyph(symbol: "chevron.right", size: 12, weight: .semibold, color: Color(hex: "#555555"))
                }
            }
            .padding(.vertical, 4)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Settings View

struct SettingsView: View {
    @Environment(AppState.self) private var appState
    @Environment(AppRouter.self) private var router

    // Audio
    @AppStorage("musicEnabled") private var musicEnabled = true
    @AppStorage("musicVolume") private var musicVolume = 0.7
    @AppStorage("sfxEnabled") private var sfxEnabled = true
    @AppStorage("sfxVolume") private var sfxVolume = 0.8

    // Visuals
    @AppStorage("colorblindMode") private var colorblindMode = "NONE"
    @AppStorage("reducedMotion") private var reducedMotion = false

    // Gameplay
    @AppStorage("confirmEndTurn") private var confirmEndTurn = false
    @AppStorage("extendedTimer") private var extendedTimer = false

    // Notifications
    @AppStorage("notifyEvolutionReady") private var notifyEvolutionReady = true
    @AppStorage("notifyDailyReset") private var notifyDailyReset = true
    @AppStorage("notifyMatchFound") private var notifyMatchFound = true

    // State
    @State private var showDeleteConfirmation = false
    @State private var showSignOutConfirmation = false

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Account section
                accountSection

                // Audio section
                audioSection

                // Visuals section
                visualsSection

                // Gameplay section
                gameplaySection

                // Notifications section
                notificationsSection

                // Privacy & Legal section
                privacySection

                // About section
                aboutSection
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 80)
        }
        .scrollContentBackground(.hidden)
        .background(
            ZStack {
                Color.bgPrimary
                Image("UIBackgrounds/bg-dark-leather")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
                    .opacity(0.35)
            }
        )
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .alert("Sign Out?", isPresented: $showSignOutConfirmation) {
            Button("Sign Out", role: .destructive) {
                Task {
                    await appState.auth.signOut()
                    router.reset()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("You will need to sign in again to access your account.")
        }
        .alert("Delete Account?", isPresented: $showDeleteConfirmation) {
            Button("Delete Forever", role: .destructive) {
                Task {
                    try? await appState.auth.deleteAccount()
                    router.reset()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will permanently delete your account and all your cards. This cannot be undone.")
        }
    }

    // MARK: - Account Section

    private var accountSection: some View {
        SectionPanel("Account", icon: "person.fill") {
            VStack(spacing: 10) {
                InfoRow(label: "Username", value: appState.player?.displayName ?? "Adventurer")

                if let tier = appState.player?.subscriptionTier {
                    InfoRow(label: "Subscription", value: tier.displayName)
                }

                // Divider before destructive actions
                Rectangle()
                    .fill(Color(hex: "#3A2A1A").opacity(0.5))
                    .frame(height: 1)
                    .padding(.vertical, 4)

                ActionRow(label: "Sign Out", icon: "rectangle.portrait.and.arrow.right", isDestructive: true) {
                    showSignOutConfirmation = true
                }

                ActionRow(label: "Delete Account", icon: "trash", isDestructive: true) {
                    showDeleteConfirmation = true
                }
            }
        }
    }

    // MARK: - Audio Section

    private var audioSection: some View {
        SectionPanel("Audio", icon: "speaker.wave.2.fill") {
            VStack(spacing: 10) {
                ToggleRow(label: "Music", isOn: $musicEnabled)
                if musicEnabled {
                    SliderRow(label: "Music Volume", value: $musicVolume)
                        .padding(.leading, 8)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                }

                Rectangle()
                    .fill(Color(hex: "#3A2A1A").opacity(0.3))
                    .frame(height: 1)

                ToggleRow(label: "Sound Effects", isOn: $sfxEnabled)
                if sfxEnabled {
                    SliderRow(label: "SFX Volume", value: $sfxVolume)
                        .padding(.leading, 8)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                }
            }
            .animation(.easeInOut(duration: 0.25), value: musicEnabled)
            .animation(.easeInOut(duration: 0.25), value: sfxEnabled)
        }
    }

    // MARK: - Visuals Section

    private var visualsSection: some View {
        SectionPanel("Visuals", icon: "eye.fill") {
            VStack(spacing: 12) {
                // Colorblind mode picker
                VStack(alignment: .leading, spacing: 8) {
                    Text("Colorblind Mode")
                        .font(CardFont.body(size: 16))
                        .foregroundColor(Color(hex: "#F0EAD6"))

                    PhysicalPicker(selection: $colorblindMode, options: [
                        ("None", "NONE"),
                        ("Deuter.", "DEUTERANOPIA"),
                        ("Protan.", "PROTANOPIA"),
                        ("Tritan.", "TRITANOPIA")
                    ])
                }

                Rectangle()
                    .fill(Color(hex: "#3A2A1A").opacity(0.3))
                    .frame(height: 1)

                ToggleRow(label: "Reduce Motion", isOn: $reducedMotion)
            }
        }
    }

    // MARK: - Gameplay Section

    private var gameplaySection: some View {
        SectionPanel("Gameplay", icon: "gamecontroller.fill") {
            VStack(spacing: 10) {
                ToggleRow(label: "Confirm Before End Turn", isOn: $confirmEndTurn)

                Rectangle()
                    .fill(Color(hex: "#3A2A1A").opacity(0.3))
                    .frame(height: 1)

                ToggleRow(label: "Extended Timer", isOn: $extendedTimer)
                Text("Adds extra time for casual and practice matches")
                    .font(CardFont.body(size: 12))
                    .foregroundColor(Color(hex: "#888888"))
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    // MARK: - Notifications Section

    private var notificationsSection: some View {
        SectionPanel("Notifications", icon: "bell.fill") {
            VStack(spacing: 10) {
                ToggleRow(label: "Evolution Ready", isOn: $notifyEvolutionReady)

                Rectangle()
                    .fill(Color(hex: "#3A2A1A").opacity(0.3))
                    .frame(height: 1)

                ToggleRow(label: "Daily Quests Reset", isOn: $notifyDailyReset)

                Rectangle()
                    .fill(Color(hex: "#3A2A1A").opacity(0.3))
                    .frame(height: 1)

                ToggleRow(label: "Match Found", isOn: $notifyMatchFound)
            }
        }
    }

    // MARK: - Privacy & Legal Section

    private var privacySection: some View {
        SectionPanel("Privacy & Legal", icon: "lock.shield.fill") {
            VStack(spacing: 10) {
                ActionRow(label: "Privacy Policy", icon: "doc.text") {
                    if let url = URL(string: "https://chaoscreatures.app/privacy") {
                        UIApplication.shared.open(url)
                    }
                }

                Rectangle()
                    .fill(Color(hex: "#3A2A1A").opacity(0.3))
                    .frame(height: 1)

                ActionRow(label: "Terms of Service", icon: "doc.text") {
                    if let url = URL(string: "https://chaoscreatures.app/terms") {
                        UIApplication.shared.open(url)
                    }
                }

                Rectangle()
                    .fill(Color(hex: "#3A2A1A").opacity(0.3))
                    .frame(height: 1)

                ActionRow(label: "Export My Data", icon: "square.and.arrow.up") {
                    Task { await exportData() }
                }
            }
        }
    }

    // MARK: - About Section

    private var aboutSection: some View {
        SectionPanel("About", icon: "info.circle.fill") {
            VStack(spacing: 10) {
                InfoRow(
                    label: "Version",
                    value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
                )
                InfoRow(
                    label: "Build",
                    value: Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
                )
            }
        }
    }

    // MARK: - Actions

    private func exportData() async {
        do {
            struct ExportResponse: Decodable {
                let url: String
            }
            let _: ExportResponse = try await SupabaseService.shared.callFunction("player/export-data")
            // In production, present ShareLink with the URL
            appState.showToast("Data export ready!", type: .success)
        } catch {
            appState.showToast("Export failed. Try again later.", type: .error)
        }
    }
}

#Preview {
    NavigationStack {
        SettingsView()
    }
    .environment(AppState())
    .environment(AppRouter())
}
