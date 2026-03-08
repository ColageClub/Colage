import SwiftUI

/// Root view — switches between onboarding and main app
struct RootView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        Group {
            switch appState.authState {
            case .loading:
                LaunchScreen()
            case .onboarding:
                OnboardingFlow()
            case .authenticated:
                HomeView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: appState.authState)
        .onAppear {
            appState.checkExistingSession()
        }
    }
}

/// Simple launch screen with logo
struct LaunchScreen: View {
    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()
            VStack(spacing: 16) {
                Image(systemName: "location.circle.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(ColageColors.primary)
                Text("colage")
                    .font(ColageFonts.title)
                    .foregroundStyle(ColageColors.textPrimary)
            }
        }
    }
}

#Preview {
    RootView()
        .environmentObject(AppState())
        .environmentObject(AuthService())
        .environmentObject(LocationService())
        .environmentObject(UniversityService())
}
