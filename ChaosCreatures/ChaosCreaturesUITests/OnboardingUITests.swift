// OnboardingUITests.swift
// Chaos Creatures UI Tests
//
// NOTE:
// This test captures screenshots for visual-design compliance review.
// It launches in dev mode to avoid auth/onboarding gates.

import XCTest

final class OnboardingUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testCapturePrimaryScreenSet() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-devMode", "-startCollection"]
        app.launch()

        // The collection view uses a custom themed nav title (empty string in nav bar),
        // so we wait for the sort button or any card text to appear instead.
        sleep(4)
        attachScreenshot(named: "00-collection")

        tapTab("Home", in: app)
        sleep(2)
        attachScreenshot(named: "01-home")

        tapTab("Decks", in: app)
        sleep(2)
        attachScreenshot(named: "02-decks")

        tapTab("Profile", in: app)
        sleep(2)
        attachScreenshot(named: "03-profile")

        tapTab("Shop", in: app)
        sleep(2)
        attachScreenshot(named: "04-shop")

        tapTab("Collection", in: app)
        sleep(2)
        attachScreenshot(named: "05-collection-return")

        // Attempt to open a card detail using a coordinate-based tap on the first card.
        // The collection grid renders LazyVGrid cards. Header height is ~164pt on all devices.
        // Card height is 164pt (per code). First card center: x≈57, y≈246 in logical points.
        // We use normalized coordinates relative to the app frame to be device-independent.
        let appFrame = app.frame
        // First card: x≈57pt from left, y≈246pt from top (after ~164pt header + 82pt half-card)
        let normX = 57.0 / max(appFrame.width, 1.0)
        let normY = 246.0 / max(appFrame.height, 1.0)
        let cardCoord = app.coordinate(withNormalizedOffset: CGVector(dx: normX, dy: normY))
        cardCoord.tap()
        sleep(3)
        attachScreenshot(named: "06-card-detail")
    }

    private func tapTab(_ title: String, in app: XCUIApplication, timeout: TimeInterval = 5) {
        let tabButton = app.buttons[title].firstMatch
        XCTAssertTrue(tabButton.waitForExistence(timeout: timeout), "Missing tab button: \(title)")
        tabButton.tap()
    }

    private func attachScreenshot(named name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
