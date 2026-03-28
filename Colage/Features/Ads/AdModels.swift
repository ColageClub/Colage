import Foundation

struct AdData: Codable, Identifiable {
    let id: String
    let businessName: String
    let bio: String
    let deal: String
    var logoEmoji: String?
    let logoUrl: String?
    var distance: String?
    let lat: Double?
    let lng: Double?

    // Server returns "emoji" not "logoEmoji"
    enum CodingKeys: String, CodingKey {
        case id, businessName, bio, deal
        case logoEmoji = "emoji"
        case logoUrl, distance, lat, lng
    }

    /// Display emoji — falls back to 🏪
    var displayEmoji: String { logoEmoji ?? "🏪" }

    /// Display distance — falls back to "nearby"
    var displayDistance: String { distance ?? "nearby" }
}
