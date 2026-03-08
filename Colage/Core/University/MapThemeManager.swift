import Foundation
@preconcurrency import MapboxMaps

/// Manages Mapbox style customization per university
class MapThemeManager {
    static let shared = MapThemeManager()

    /// University-specific Mapbox style customizations
    /// In production these would be full Mapbox Studio styles — for now we tint the dark base
    struct MapThemeConfig {
        let roadColor: String
        let waterColor: String
        let buildingColor: String
        let labelColor: String
        let backgroundTint: String
    }

    private let themes: [String: MapThemeConfig] = [
        "umich.edu": MapThemeConfig(
            roadColor: "#FFCB05",    // Maize
            waterColor: "#00274C",    // Blue
            buildingColor: "#1A1A2E",
            labelColor: "#FFCB05",
            backgroundTint: "#00274C"
        ),
        "harvard.edu": MapThemeConfig(
            roadColor: "#A51C30",    // Crimson
            waterColor: "#1A1A2E",
            buildingColor: "#2D1520",
            labelColor: "#F5F0E1",
            backgroundTint: "#2D1520"
        ),
        "stanford.edu": MapThemeConfig(
            roadColor: "#8C1515",    // Cardinal
            waterColor: "#1A1A2E",
            buildingColor: "#2D1D1D",
            labelColor: "#D2C295",
            backgroundTint: "#2D1D1D"
        )
    ]

    /// Get theme config for a university domain
    func config(for domain: String) -> MapThemeConfig {
        themes[domain] ?? MapThemeConfig(
            roadColor: "#6C5CE7",    // Default purple
            waterColor: "#1A1A2E",
            buildingColor: "#1E1E2E",
            labelColor: "#A0A0A0",
            backgroundTint: "#1E1E2E"
        )
    }

    /// Get the Mapbox style URI — dark base for all, custom styles later via Mapbox Studio
    func styleURI(for domain: String) -> StyleURI {
        // TODO: Use custom Mapbox Studio styles per university
        // For now, use dark as the base
        return .dark
    }
}
