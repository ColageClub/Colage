import SwiftUI

/// Central app state — controls navigation, auth status, and active mode
class AppState: ObservableObject {
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
        // Check for stored profile and Keychain tokens
        if let data = UserDefaults.standard.data(forKey: "dev_profile"),
           let profile = try? JSONDecoder().decode(UserProfile.self, from: data),
           KeychainWrapper.get(key: "access_token") != nil {
            UserProfile.current = profile
            authState = .authenticated
            // Sync profile from server using email (no auth required)
            let email = UserDefaults.standard.string(forKey: "user_email") ?? ""
            if !email.isEmpty {
                refreshProfileFromServer(email: email)
            }
        } else if KeychainWrapper.get(key: "access_token") != nil {
            authState = .authenticated
        } else {
            authState = .onboarding
        }
    }

    /// Fetch latest profile from server by email and update local copy
    private func refreshProfileFromServer(email: String) {
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
                let encoded = email.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? email
                let result: ServerProfile = try await APIClient.shared.request(
                    method: "GET",
                    path: "/auth/me?email=\(encoded)"
                )
                let p = result.profile
                print("[Profile] Synced from server: userId=\(p.userId), photo=\(p.profilePhotoURL ?? "nil")")
                let updated = UserProfile(
                    userId: p.userId,
                    universityDomain: p.universityDomain ?? UserProfile.current?.universityDomain ?? "",
                    displayName: p.displayName ?? UserProfile.current?.displayName ?? "",
                    profilePhotoURL: p.profilePhotoURL,
                    bio: p.bio,
                    major: p.major,
                    socialLinks: p.socialLinks ?? UserProfile.current?.socialLinks ?? [],
                    isVisible: p.isVisible ?? true,
                    serverType: UserProfile.current?.serverType ?? .student,
                    createdAt: UserProfile.current?.createdAt ?? Date(),
                    updatedAt: Date()
                )
                await MainActor.run {
                    UserProfile.current = updated
                    if let data = try? JSONEncoder().encode(updated) {
                        UserDefaults.standard.set(data, forKey: "dev_profile")
                    }
                }
            } catch {
                print("Profile refresh failed: \(error)")
            }
        }
    }
}
