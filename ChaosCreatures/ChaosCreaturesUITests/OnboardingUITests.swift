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

        XCTAssertTrue(app.navigationBars["Collection"].waitForExistence(timeout: 10))
        attachScreenshot(named: "00-collection")

        tapTab("Home", in: app)
        XCTAssertTrue(app.navigationBars["Chaos Creatures"].waitForExistence(timeout: 5))
        attachScreenshot(named: "01-home")

        tapTab("Decks", in: app)
        XCTAssertTrue(app.navigationBars["My Decks"].waitForExistence(timeout: 5))
        attachScreenshot(named: "02-decks")

        tapTab("Profile", in: app)
        XCTAssertTrue(app.navigationBars["Profile"].waitForExistence(timeout: 5))
        attachScreenshot(named: "03-profile")

        tapTab("Shop", in: app)
        XCTAssertTrue(app.navigationBars["Shop"].waitForExistence(timeout: 5))
        attachScreenshot(named: "04-shop")

        tapTab("Collection", in: app)
        XCTAssertTrue(app.navigationBars["Collection"].waitForExistence(timeout: 5))
        attachScreenshot(named: "05-collection-return")

        // Attempt to open a card detail screen for Tier-3 hierarchy audit.
        if app.staticTexts["Rebar Golem"].firstMatch.waitForExistence(timeout: 3) {
            app.staticTexts["Rebar Golem"].firstMatch.tap()
            sleep(1)
            attachScreenshot(named: "06-card-detail")
        }
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
