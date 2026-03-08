import Foundation
import SwiftUI

/// Manages university server data and branding
class UniversityService: ObservableObject {
    @Published var currentUniversity: University?
    @Published var currentTheme: UniversityTheme?
    @Published var availableThemes: [UniversityTheme] = []

    /// Resolve university from .edu domain
    func resolveUniversity(domain: String) async -> University? {
        if AppState.devMode {
            return mockUniversity(for: domain)
        }
        // TODO: API call to GET /universities/{domain}
        return nil
    }

    func setUniversity(_ university: University) {
        currentUniversity = university
        availableThemes = university.brandingThemes
        currentTheme = university.brandingThemes.first
    }

    func selectTheme(_ theme: UniversityTheme) {
        currentTheme = theme
    }

    // MARK: - Mock Data (Dev Mode)

    private func mockUniversity(for domain: String) -> University {
        switch domain {
        case "umich.edu":
            return University(
                id: "umich",
                domain: "umich.edu",
                name: "University of Michigan",
                memberCount: 847,
                brandingThemes: [
                    UniversityTheme(
                        id: "umich-maize-blue",
                        name: "Maize & Blue",
                        primaryColor: "#FFCB05",
                        accentColor: "#00274C",
                        textColor: "#FFFFFF",
                        backgroundAsset: nil
                    ),
                    UniversityTheme(
                        id: "umich-stadium",
                        name: "The Big House",
                        primaryColor: "#FFCB05",
                        accentColor: "#00274C",
                        textColor: "#FFFFFF",
                        backgroundAsset: nil
                    ),
                    UniversityTheme(
                        id: "umich-block-m",
                        name: "Block M Classic",
                        primaryColor: "#FFCB05",
                        accentColor: "#00274C",
                        textColor: "#FFFFFF",
                        backgroundAsset: nil
                    )
                ]
            )
        case "harvard.edu":
            return University(
                id: "harvard",
                domain: "harvard.edu",
                name: "Harvard University",
                memberCount: 512,
                brandingThemes: [
                    UniversityTheme(
                        id: "harvard-crimson",
                        name: "Crimson",
                        primaryColor: "#A51C30",
                        accentColor: "#F5F0E1",
                        textColor: "#FFFFFF",
                        backgroundAsset: nil
                    )
                ]
            )
        case "stanford.edu":
            return University(
                id: "stanford",
                domain: "stanford.edu",
                name: "Stanford University",
                memberCount: 623,
                brandingThemes: [
                    UniversityTheme(
                        id: "stanford-cardinal",
                        name: "Cardinal",
                        primaryColor: "#8C1515",
                        accentColor: "#D2C295",
                        textColor: "#FFFFFF",
                        backgroundAsset: nil
                    )
                ]
            )
        default:
            // Auto-create default university
            let name = domain
                .replacingOccurrences(of: ".edu", with: "")
                .capitalized
            return University(
                id: domain,
                domain: domain,
                name: "\(name) University",
                memberCount: 0,
                brandingThemes: [UniversityTheme.default]
            )
        }
    }
}
