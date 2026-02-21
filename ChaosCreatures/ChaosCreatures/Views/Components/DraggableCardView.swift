// DraggableCardView.swift
// Chaos Creatures
//
// Wraps CardFrameView in a drag gesture with physical momentum feel.
// Drag resistance: 0.72 (translation * 0.72)
// Return spring: response 0.38s, damping 0.62
// Rotation: width * 0.025 degrees (card tilts slightly as it drags)
// Scale: 1.05 while dragging, 1.0 at rest
// Shadow: radius 16 while dragging, 4 at rest
//
// Task 2.12

import SwiftUI

/// Wraps `CardFrameView` with a drag gesture. Use in hand, deck builder, and any
/// context where cards can be physically moved by the player.
struct DraggableCardView: View {
    let data: CardDisplayData
    let size: CardDisplaySize

    @State private var dragOffset: CGSize = .zero
    @State private var isDragging = false

    var body: some View {
        CardFrameView(data: data, size: size)
            .scaleEffect(isDragging ? 1.05 : 1.0)
            .shadow(radius: isDragging ? 16 : 4)
            .offset(dragOffset)
            .rotationEffect(.degrees(Double(dragOffset.width) * 0.025))
            .gesture(
                DragGesture()
                    .onChanged { value in
                        isDragging = true
                        // Drag resistance: 0.72
                        dragOffset = CGSize(
                            width: value.translation.width * 0.72,
                            height: value.translation.height * 0.72
                        )
                    }
                    .onEnded { _ in
                        withAnimation(.spring(response: 0.38, dampingFraction: 0.62)) {
                            isDragging = false
                            dragOffset = .zero
                        }
                    }
            )
            .animation(.spring(response: 0.38, dampingFraction: 0.62), value: isDragging)
    }
}

// MARK: - Previews

#Preview("DraggableCardView") {
    DraggableCardView(
        data: CardDisplayData(
            name: "Iron Sentinel",
            artUrl: nil,
            manaCost: 3,
            attack: 4,
            health: 5,
            instability: 2,
            tier: .uncommon,
            faction: .ironwright,
            keywords: [.shield, .taunt],
            flavorText: "Forged from recycled starship hulls.",
            abilityText: "Shield: absorbs the first instance of damage."
        ),
        size: .detail
    )
    .frame(width: 210)
    .padding(40)
    .background(Color.bgPrimary)
}
