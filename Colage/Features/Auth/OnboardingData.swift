import SwiftUI

/// Shared onboarding data container — persists across onboarding screens
class OnboardingData: ObservableObject {
    @Published var email: String = ""
    @Published var phone: String = ""
    @Published var displayName: String = ""
    @Published var bio: String = ""
    @Published var major: String = ""
    @Published var profilePhoto: UIImage?
    @Published var socialLinks: [SocialPlatform: String] = [:]

    /// Build final profile from onboarding data
    func buildProfile(domain: String) -> UserProfile {
        let links = socialLinks.compactMap { (platform, handle) -> SocialLink? in
            guard !handle.isEmpty else { return nil }
            return SocialLink(platform: platform, handle: handle)
        }

        return UserProfile(
            userId: UUID().uuidString,
            universityDomain: domain,
            displayName: displayName,
            profilePhotoURL: nil, // Set after upload
            bio: bio.isEmpty ? nil : bio,
            major: major.isEmpty ? nil : major,
            socialLinks: links,
            isVisible: true,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}
