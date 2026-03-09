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
    @State private var animateIn = false
    @State private var pulse = false

    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()
            VStack(spacing: 16) {
                Image(systemName: "location.circle.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(ColageColors.primary)
                    .scaleEffect(pulse ? 1.1 : 1.0)
                    .opacity(animateIn ? 1 : 0)

                Text("colage")
                    .font(.system(size: 36, weight: .bold, design: .rounded))
                    .foregroundStyle(ColageColors.textPrimary)
                    .opacity(animateIn ? 1 : 0)

                Text("Be You.")
                    .font(ColageFonts.subheadline)
                    .foregroundStyle(ColageColors.textSecondary)
                    .opacity(animateIn ? 1 : 0)
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.6)) {
                animateIn = true
            }
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                pulse = true
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
