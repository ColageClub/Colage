import SwiftUI

@main
struct ColageApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var authService = AuthService()
    @StateObject private var locationService = LocationService()
    @StateObject private var universityService = UniversityService()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .environmentObject(authService)
                .environmentObject(locationService)
                .environmentObject(universityService)
                .preferredColorScheme(.dark)
        }
    }
}
