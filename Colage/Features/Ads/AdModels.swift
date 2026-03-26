import Foundation

struct AdData: Codable, Identifiable {
    let id: String
    let businessName: String
    let bio: String
    let deal: String
    let logoEmoji: String
    let logoUrl: String?
    let distance: String

    enum CodingKeys: String, CodingKey {
        case id, businessName, bio, deal, logoEmoji, logoUrl, distance
    }
}
