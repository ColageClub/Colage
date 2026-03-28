import SwiftUI

/// Central app state — controls navigation, auth status, and active mode
@MainActor class AppState: ObservableObject {
    enum AuthState {
        case loading
        case onboarding
        case authenticated
    }

    enum DiscoveryMode: String, CaseIterable {
        case map = "Map"
        case list = "List"
        case ar = "AR"
    }

    @Published var authState: AuthState = .loading
    @Published var activeMode: DiscoveryMode = .map
    @Published var isVisible: Bool = true
    @Published var currentFloor: Int = 1
    @Published var showOwnProfile: Bool = false

    /// Dev mode — skips real auth, uses mock data
    static let devMode: Bool = {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }()

    func checkExistingSession() {
        // Check for stored profile in Keychain and tokens
        if let jsonString = KeychainWrapper.get(key: "user_profile"),
           let data = jsonString.data(using: .utf8),
           let profile = try? JSONDecoder().decode(UserProfile.self, from: data),
           KeychainWrapper.get(key: "access_token") != nil {
            UserProfile.current = profile
            authState = .authenticated
            refreshProfileFromServer()
        } else if KeychainWrapper.get(key: "access_token") != nil {
            authState = .authenticated
        } else {
            authState = .onboarding
        }
    }

    /// Fetch latest profile from server (authenticated — JWT required)
    private func refreshProfileFromServer() {
        Task {
            do {
                struct ServerProfile: Decodable {
                    let profile: ProfileData
                    struct ProfileData: Decodable {
                        let userId: String
                        let displayName: String?
                        let profilePhotoURL: String?
                        let bio: String?
                        let major: String?
                        let universityDomain: String?
                        let isVisible: Bool?
                        let socialLinks: [SocialLink]?
                    }
                }
                let result: ServerProfile = try await APIClient.shared.request(
                    method: "GET",
                    path: "/auth/me"
                )
                let p = result.profile
                print("[Profile] Synced from server: userId=\(p.userId), photo=\(p.profilePhotoURL ?? "nil")")
                let current = await MainActor.run { UserProfile.current }
                let updated = UserProfile(
                    userId: p.userId,
                    universityDomain: p.universityDomain ?? current?.universityDomain ?? "",
                    displayName: p.displayName ?? current?.displayName ?? "",
                    profilePhotoURL: p.profilePhotoURL,
                    bio: p.bio,
                    major: p.major,
                    socialLinks: p.socialLinks ?? current?.socialLinks ?? [],
                    isVisible: p.isVisible ?? true,
                    serverType: current?.serverType ?? .student,
                    createdAt: current?.createdAt ?? Date(),
                    updatedAt: Date()
                )
                await MainActor.run {
                    UserProfile.current = updated
                    if let data = try? JSONEncoder().encode(updated),
                       let jsonString = String(data: data, encoding: .utf8) {
                        KeychainWrapper.set(key: "user_profile", value: jsonString)
                    }
                }
            } catch {
                print("Profile refresh failed: \(error)")
            }
        }
    }
}
