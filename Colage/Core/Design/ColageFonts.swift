import SwiftUI

/// Colage typography system — scalable fonts that respect Dynamic Type
enum ColageFonts {
    // MARK: - Display
    static let largeTitle = Font.system(.largeTitle, design: .rounded, weight: .bold)
    static let title = Font.system(.title, design: .rounded, weight: .bold)
    static let title2 = Font.system(.title2, design: .rounded, weight: .semibold)
    static let title3 = Font.system(.title3, weight: .semibold)

    // MARK: - Body
    static let body = Font.system(.body)
    static let bodyBold = Font.system(.body, weight: .semibold)
    static let callout = Font.system(.callout)

    // MARK: - Small
    static let subheadline = Font.system(.subheadline)
    static let footnote = Font.system(.footnote)
    static let caption = Font.system(.caption)
    static let captionBold = Font.system(.caption, weight: .semibold)

    // MARK: - Monospaced (for codes, distances)
    static let mono = Font.system(.body, design: .monospaced, weight: .medium)
    static let monoSmall = Font.system(.footnote, design: .monospaced, weight: .medium)
}
