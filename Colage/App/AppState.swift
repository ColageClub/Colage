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
        } else if KeychainWrapper.get(key: "access_token") != nil {
            authState = .authenticated
        } else {
            authState = .onboarding
        }
    }
}
