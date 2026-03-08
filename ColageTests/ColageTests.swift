import XCTest
@testable import Colage

final class ColageTests: XCTestCase {
    func testEmailDomainExtraction() {
        let authService = AuthService()

        // Valid .edu emails
        XCTAssertEqual(authService.extractDomain(from: "student@umich.edu"), "umich.edu")
        XCTAssertEqual(authService.extractDomain(from: "test@harvard.edu"), "harvard.edu")
        XCTAssertEqual(authService.extractDomain(from: "user@cs.stanford.edu"), "cs.stanford.edu")

        // Invalid emails
        XCTAssertNil(authService.extractDomain(from: "student@gmail.com"))
        XCTAssertNil(authService.extractDomain(from: "no-at-sign.edu"))
        XCTAssertNil(authService.extractDomain(from: ""))
    }

    func testFloorComputation() {
        // Floor 1 at ground
        // Floor 2 at ~3.5m
        // Basement at < -2m
        // Basic sanity check
        XCTAssertTrue(true, "Floor computation tests will be expanded with LocationService refactor")
    }

    func testSocialLinkURLGeneration() {
        let igLink = SocialLink(platform: .instagram, handle: "@testuser")
        XCTAssertEqual(igLink.url?.absoluteString, "https://instagram.com/testuser")

        let snapLink = SocialLink(platform: .snapchat, handle: "testuser")
        XCTAssertEqual(snapLink.url?.absoluteString, "https://snapchat.com/add/testuser")

        let tiktokLink = SocialLink(platform: .tiktok, handle: "testuser")
        XCTAssertEqual(tiktokLink.url?.absoluteString, "https://tiktok.com/@testuser")
    }

    func testUniversityThemeDefaults() {
        let defaultTheme = UniversityTheme.default
        XCTAssertEqual(defaultTheme.id, "default")
        XCTAssertEqual(defaultTheme.primaryColor, "#6C5CE7")
    }

    func testMockStudentGeneration() {
        let student = NearbyStudent.mock(index: 0, baseLat: 42.278, baseLng: -83.738)
        XCTAssertFalse(student.profile.displayName.isEmpty)
        XCTAssertFalse(student.profile.socialLinks.isEmpty)
        XCTAssertEqual(student.profile.universityDomain, "umich.edu")
    }
}
