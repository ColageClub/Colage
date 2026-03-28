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
    @Published var serverType: ServerType = .student
}
