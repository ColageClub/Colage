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
        if AppState.devMode {
            // In dev mode, check if we have a stored dev profile
            if UserDefaults.standard.bool(forKey: "dev_onboarding_complete") {
                if let data = UserDefaults.standard.data(forKey: "dev_profile"),
                   let profile = try? JSONDecoder().decode(UserProfile.self, from: data) {
                    UserProfile.current = profile
                }
                authState = .authenticated
            } else {
                authState = .onboarding
            }
        } else {
            // Production: check for stored profile (Cognito tokens stored via Keychain)
            if let data = UserDefaults.standard.data(forKey: "dev_profile"),
               let profile = try? JSONDecoder().decode(UserProfile.self, from: data) {
                UserProfile.current = profile
                authState = .authenticated
            } else if KeychainWrapper.get(key: "access_token") != nil {
                authState = .authenticated
            } else {
                authState = .onboarding
            }
        }
    }
}
