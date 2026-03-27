import Foundation
import SwiftUI

// MARK: - University

struct University: Codable, Identifiable {
    let id: String
    let domain: String
    let name: String
    var memberCount: Int
    let brandingThemes: [UniversityTheme]
}

// MARK: - University Theme

struct UniversityTheme: Codable, Identifiable {
    let id: String
    let name: String
    let primaryColor: String
    let accentColor: String
    let textColor: String
    let backgroundAsset: String?

    var primary: Color { Color(hex: primaryColor) }
    var accent: Color { Color(hex: accentColor) }
    var text: Color { Color(hex: textColor) }

    static let `default` = UniversityTheme(
        id: "default",
        name: "Classic",
        primaryColor: "#A51C30",
        accentColor: "#00CEC9",
        textColor: "#FFFFFF",
        backgroundAsset: nil
    )
}

// MARK: - User Profile

struct UserProfile: Codable, Identifiable {
    var id: String { userId }
    let userId: String
    var universityDomain: String
    var displayName: String
    var profilePhotoURL: String?
    var bio: String?
    var major: String?
    var socialLinks: [SocialLink]
    var isVisible: Bool
    var serverType: ServerType
    var createdAt: Date
    var updatedAt: Date

    /// Currently logged-in user profile (stored in memory)
    static var current: UserProfile?
}

// MARK: - Social Link

struct SocialLink: Codable, Identifiable {
    var id: String { platform.rawValue }
    let platform: SocialPlatform
    var handle: String

    var url: URL? {
        let urlString: String
        switch platform {
        case .instagram:    urlString = "https://instagram.com/\(handle.replacingOccurrences(of: "@", with: ""))"
        case .tiktok:       urlString = "https://tiktok.com/@\(handle.replacingOccurrences(of: "@", with: ""))"
        case .x:            urlString = "https://x.com/\(handle.replacingOccurrences(of: "@", with: ""))"
        case .snapchat:     urlString = "https://snapchat.com/add/\(handle)"
        case .facebook:     urlString = handle.hasPrefix("http") ? handle : "https://facebook.com/\(handle)"
        case .bereal:       urlString = "https://bere.al/\(handle)"
        case .linkedin:     urlString = handle.hasPrefix("http") ? handle : "https://linkedin.com/in/\(handle)"
        case .custom1, .custom2, .custom3:
            urlString = handle.hasPrefix("http") ? handle : "https://\(handle)"
        }
        return URL(string: urlString)
    }
}

enum SocialPlatform: String, Codable, CaseIterable {
    case instagram
    case tiktok
    case x
    case snapchat
    case facebook
    case bereal
    case linkedin
    case custom1
    case custom2
    case custom3

    var displayName: String {
        switch self {
        case .instagram: return "Instagram"
        case .tiktok: return "TikTok"
        case .x: return "X"
        case .snapchat: return "Snapchat"
        case .facebook: return "Facebook"
        case .bereal: return "BeReal"
        case .linkedin: return "LinkedIn"
        case .custom1: return "Link 1"
        case .custom2: return "Link 2"
        case .custom3: return "Link 3"
        }
    }

    var iconName: String {
        switch self {
        case .instagram: return "camera.fill"
        case .tiktok: return "music.note"
        case .x: return "at"
        case .snapchat: return "bolt.fill"
        case .facebook: return "person.2.fill"
        case .bereal: return "eye.fill"
        case .linkedin: return "briefcase.fill"
        case .custom1, .custom2, .custom3: return "link"
        }
    }
}

// MARK: - Server Type

enum ServerType: String, Codable {
    case student
    case alumni

    var displayName: String {
        switch self {
        case .student: return "Student"
        case .alumni: return "Alumni"
        }
    }
}

// MARK: - Student Location

struct StudentLocation: Codable, Identifiable {
    var id: String { userId }
    let userId: String
    let latitude: Double
    let longitude: Double
    let altitude: Double
    let floor: Int
    let timestamp: Date
    // Optional profile snapshot from WebSocket broadcast
    var displayName: String?
    var profilePhotoURL: String?
    var major: String?
}

// MARK: - Nearby Student (location + profile snapshot)

struct NearbyStudent: Identifiable {
    var id: String { profile.userId }
    let profile: UserProfile
    var location: StudentLocation
    var distance: Double // feet

    static func mock(index: Int, baseLat: Double, baseLng: Double) -> NearbyStudent {
        let names = ["Emma Wilson", "James Chen", "Sofia Rodriguez", "Liam O'Brien",
                     "Aisha Johnson", "Noah Kim", "Olivia Park", "Ethan Davis",
                     "Maya Patel", "Lucas Martinez", "Zoe Thompson", "Kai Nakamura"]
        let majors = ["Computer Science", "Psychology", "Biology", "Engineering",
                      "English", "Business", "Art History", "Mathematics",
                      "Political Science", "Chemistry", "Music", "Economics"]
        let name = names[index % names.count]
        let major = majors[index % majors.count]
        let latOffset = Double.random(in: -0.002...0.002)
        let lngOffset = Double.random(in: -0.002...0.002)
        let dist = Double.random(in: 10...2000)

        return NearbyStudent(
            profile: UserProfile(
                userId: "mock-\(index)",
                universityDomain: "umich.edu",
                displayName: name,
                profilePhotoURL: nil,
                bio: "Just a \(major) student ✌️",
                major: major,
                socialLinks: [
                    SocialLink(platform: .instagram, handle: "@\(name.lowercased().replacingOccurrences(of: " ", with: ""))"),
                    SocialLink(platform: .snapchat, handle: name.lowercased().replacingOccurrences(of: " ", with: "_"))
                ],
                isVisible: true,
                serverType: .student,
                createdAt: Date(),
                updatedAt: Date()
            ),
            location: StudentLocation(
                userId: "mock-\(index)",
                latitude: baseLat + latOffset,
                longitude: baseLng + lngOffset,
                altitude: 0,
                floor: {
                    // Ensure good spread: first 6 on floor 1, then round-robin the rest
                    let allFloors = [-2, -1, 1, 2, 3, 4, 5, 6]
                    if index < 6 { return 1 }
                    return allFloors[(index - 6) % allFloors.count]
                }(),
                timestamp: Date()
            ),
            distance: dist
        )
    }
}
