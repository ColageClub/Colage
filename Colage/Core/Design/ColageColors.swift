import SwiftUI

// MARK: - Theme Environment Key
/// Provides the active university theme color throughout the view hierarchy.
/// Every view should use `@Environment(\.themeColor)` instead of `ColageColors.primary`.
private struct ThemeColorKey: EnvironmentKey {
    static let defaultValue: Color = Color(hex: "A51C30") // Crimson fallback
}

private struct ThemeAccentKey: EnvironmentKey {
    static let defaultValue: Color = Color(hex: "00CEC9") // Teal fallback
}

extension EnvironmentValues {
    var themeColor: Color {
        get { self[ThemeColorKey.self] }
        set { self[ThemeColorKey.self] = newValue }
    }
    var themeAccent: Color {
        get { self[ThemeAccentKey.self] }
        set { self[ThemeAccentKey.self] = newValue }
    }
}

/// Colage color system
enum ColageColors {
    // MARK: - Base
    static let background = Color(hex: "0A0A0A")
    static let surface = Color(hex: "1A1A1A")
    static let surfaceElevated = Color(hex: "252525")
    static let border = Color(hex: "333333")

    // MARK: - Brand
    static let primary = Color(hex: "A51C30")        // Crimson — main brand
    static let primaryLight = Color(hex: "D43B50")
    static let secondary = Color(hex: "00CEC9")      // Teal accent

    // MARK: - Text
    static let textPrimary = Color.white
    static let textSecondary = Color(hex: "A0A0A0")
    static let textTertiary = Color(hex: "666666")

    // MARK: - Status
    static let online = Color(hex: "00E676")
    static let offline = Color(hex: "555555")
    static let error = Color(hex: "FF5252")
    static let warning = Color(hex: "FFD740")

    // MARK: - University defaults
    static let defaultUniversityPrimary = Color(hex: "A51C30")
    static let defaultUniversityAccent = Color(hex: "00CEC9")
}

// MARK: - Hex Color Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6:
            (a, r, g, b) = (255, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = ((int >> 24) & 0xFF, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
