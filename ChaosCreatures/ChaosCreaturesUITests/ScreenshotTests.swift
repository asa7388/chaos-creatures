// ScreenshotTests.swift
// Chaos Creatures UI Tests
// Generates App Store screenshots via Xcode UI testing.

import XCTest

final class ScreenshotTests: XCTestCase {

    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
        sleep(3)
    }

    override func tearDownWithError() throws {
        app = nil
    }

    func testCaptureCollectionAndCardDetail() throws {
        // Step 1: Tap "Dev Mode (Skip Auth)" button if present
        let devModeButton = app.buttons.matching(NSPredicate(format: "label CONTAINS 'Dev Mode'")).firstMatch
        if devModeButton.waitForExistence(timeout: 5) {
            devModeButton.tap()
            sleep(4)
        }

        // Step 2: Screenshot after auth
        let afterAuthScreenshot = XCTAttachment(screenshot: app.screenshot())
        afterAuthScreenshot.name = "after_auth"
        afterAuthScreenshot.lifetime = .keepAlways
        add(afterAuthScreenshot)

        // Step 3: Navigate to Collection tab
        let allButtons = app.buttons.allElementsBoundByIndex
        for button in allButtons {
            if button.label == "Collection" {
                button.tap()
                break
            }
        }

        sleep(3)

        // Step 4: Collection screenshot
        let collectionScreenshot = XCTAttachment(screenshot: app.screenshot())
        collectionScreenshot.name = "collection_view"
        collectionScreenshot.lifetime = .keepAlways
        add(collectionScreenshot)

        // Step 5: Tap a card - use coordinate tap since button hittability varies by device
        // Use normalized coordinates: first card is roughly at 25% x, 25% y of screen
        // This avoids nav bar (top ~10%) and tab bar (bottom ~10%)
        let cardCoord = app.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.22))
        cardCoord.tap()

        sleep(3)

        // Step 6: Card detail screenshot
        let detailScreenshot = XCTAttachment(screenshot: app.screenshot())
        detailScreenshot.name = "card_detail_view"
        detailScreenshot.lifetime = .keepAlways
        add(detailScreenshot)

        // Step 7: Scroll down slightly to reveal keyword descriptions
        app.swipeUp()
        sleep(1)

        let detailScrolledScreenshot = XCTAttachment(screenshot: app.screenshot())
        detailScrolledScreenshot.name = "card_detail_scrolled"
        detailScrolledScreenshot.lifetime = .keepAlways
        add(detailScrolledScreenshot)
    }
}
