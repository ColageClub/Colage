import SwiftUI

struct UniversityWelcomeScreen: View {
    let onEnter: () -> Void
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var universityService: UniversityService
    @EnvironmentObject var onboardingData: OnboardingData
    @State private var animateIn = false

    private var isAlumni: Bool {
        onboardingData.serverType == .alumni
    }

    private var universityName: String {
        universityService.currentUniversity?.name ?? "Your University"
    }

    private var theme: UniversityTheme {
        universityService.currentTheme ?? .default
    }

    private var headerText: String {
        isAlumni ? "The Alumni Network" : universityName
    }

    private var subtitleText: String {
        isAlumni ? "on Colage" : "on Colage"
    }

    private var memberLabel: String {
        if isAlumni {
            if let count = universityService.currentUniversity?.memberCount, count > 0 {
                return "\(count) alumni already here"
            }
            return "Be one of the first alumni"
        } else {
            if let count = universityService.currentUniversity?.memberCount, count > 0 {
                return "\(count) students already here"
            }
            return ""
        }
    }

    private var buttonTitle: String {
        isAlumni ? "Enter Alumni Network" : "Enter \(universityName)"
    }

    private var iconName: String {
        isAlumni ? "globe.americas.fill" : "graduationcap.fill"
    }

    var body: some View {
        ZStack {
            // Themed background
            LinearGradient(
                colors: [
                    (isAlumni ? ColageColors.primary : theme.primary).opacity(0.3),
                    ColageColors.background
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: 24) {
                    // Badge
                    ZStack {
                        Circle()
                            .fill((isAlumni ? ColageColors.primary : theme.primary).opacity(0.2))
                            .frame(width: 100, height: 100)
                            .scaleEffect(animateIn ? 1 : 0.5)

                        Image(systemName: iconName)
                            .font(.system(size: 44))
                            .foregroundStyle(isAlumni ? ColageColors.primary : theme.primary)
                            .scaleEffect(animateIn ? 1 : 0.3)
                    }

                    VStack(spacing: 8) {
                        Text("Welcome to")
                            .font(ColageFonts.title3)
                            .foregroundStyle(ColageColors.textSecondary)
                            .opacity(animateIn ? 1 : 0)

                        Text(headerText)
                            .font(ColageFonts.largeTitle)
                            .foregroundStyle(isAlumni ? ColageColors.primary : theme.primary)
                            .multilineTextAlignment(.center)
                            .opacity(animateIn ? 1 : 0)

                        Text(subtitleText)
                            .font(ColageFonts.title2)
                            .foregroundStyle(ColageColors.textPrimary)
                            .opacity(animateIn ? 1 : 0)

                        if isAlumni {
                            Text("Graduates from every school, one community")
                                .font(ColageFonts.subheadline)
                                .foregroundStyle(ColageColors.textSecondary)
                                .multilineTextAlignment(.center)
                                .padding(.top, 4)
                                .opacity(animateIn ? 1 : 0)
                        }
                    }

                    if !memberLabel.isEmpty {
                        HStack(spacing: 6) {
                            Circle()
                                .fill(ColageColors.online)
                                .frame(width: 8, height: 8)
                            Text(memberLabel)
                                .font(ColageFonts.subheadline)
                                .foregroundStyle(ColageColors.textSecondary)
                        }
                        .opacity(animateIn ? 1 : 0)
                    }
                }

                Spacer()

                ColagePrimaryButton(title: buttonTitle, action: {
                    onEnter()
                })
                .padding(.horizontal, 24)
                .padding(.bottom, 50)
                .opacity(animateIn ? 1 : 0)
            }
        }
        .navigationBarBackButtonHidden(true)
        .onAppear {
            withAnimation(.spring(response: 0.8, dampingFraction: 0.7).delay(0.2)) {
                animateIn = true
            }
        }
    }
}

#Preview {
    UniversityWelcomeScreen(onEnter: {})
        .environmentObject(AuthService())
        .environmentObject(UniversityService())
}
