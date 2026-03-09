import SwiftUI

/// Ad data model
struct AdData: Identifiable, Equatable {
    let id: String
    let businessName: String
    let bio: String
    let deal: String
    let logoEmoji: String
    let logoUrl: String?
    let distance: String

    static func == (lhs: AdData, rhs: AdData) -> Bool {
        lhs.id == rhs.id
    }
}

/// Future: Ad service for fetching ads from API
/// Currently using mock data embedded in AdBannerView
