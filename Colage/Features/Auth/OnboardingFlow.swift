import SwiftUI

/// Full onboarding flow — 10 screens as NavigationStack
struct OnboardingFlow: View {
    @Environment(\.themeColor) private var themeColor
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var universityService: UniversityService
    @StateObject private var onboardingData = OnboardingData()
    @State private var path = NavigationPath()
    @State private var showLogin = false

    var body: some View {
        NavigationStack(path: $path) {
            WelcomeScreen(
                onContinue: { path.append(OnboardingStep.email) },
                onLogin: { showLogin = true }
            )
            .navigationDestination(for: OnboardingStep.self) { step in
                stepView(for: step)
            }
        }
        .tint(themeColor)
        .environmentObject(onboardingData)
        .sheet(isPresented: $showLogin) {
            LoginScreen()
                .environmentObject(appState)
                .environmentObject(authService)
                .environmentObject(universityService)
        }
    }

    @ViewBuilder
    private func stepView(for step: OnboardingStep) -> some View {
        switch step {
        case .email:
            EmailEntryScreen(onContinue: { path.append(OnboardingStep.emailOTP) })
        case .emailOTP:
            EmailOTPScreen(onVerified: { path.append(OnboardingStep.serverType) })
        case .serverType:
            ServerTypeScreen(onContinue: { path.append(OnboardingStep.photo) })
        case .phone:
            EmptyView() // No longer used
        case .phoneOTP:
            EmptyView() // No longer used
        case .photo:
            PhotoUploadScreen(onContinue: { path.append(OnboardingStep.info) })
        case .info:
            ProfileInfoScreen(onContinue: { path.append(OnboardingStep.socialLinks) })
        case .socialLinks:
            SocialLinksScreen(onContinue: { path.append(OnboardingStep.permissions) })
        case .permissions:
            PermissionsScreen(onContinue: { path.append(OnboardingStep.welcome) })
        case .welcome:
            UniversityWelcomeScreen(onEnter: {
                // Build and save profile from onboarding data
                let domain = authService.extractDomain(from: authService.enteredEmail) ?? "umich.edu"
                let links = onboardingData.socialLinks.compactMap { (platform, handle) -> SocialLink? in
                    guard !handle.isEmpty else { return nil }
                    return SocialLink(platform: platform, handle: handle)
                }
                authService.selectedServerType = onboardingData.serverType
                authService.createProfile(
                    name: onboardingData.displayName,
                    bio: onboardingData.bio.isEmpty ? nil : onboardingData.bio,
                    major: onboardingData.major.isEmpty ? nil : onboardingData.major,
                    socialLinks: links
                )
                appState.authState = .authenticated
            })
        }
    }
}

enum OnboardingStep: Hashable {
    case email, emailOTP, serverType, phone, phoneOTP, photo, info, socialLinks, permissions, welcome
}
