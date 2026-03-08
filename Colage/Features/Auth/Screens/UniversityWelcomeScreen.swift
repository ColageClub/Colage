import SwiftUI

struct UniversityWelcomeScreen: View {
    let onEnter: () -> Void
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var universityService: UniversityService
    @State private var animateIn = false

    private var universityName: String {
        universityService.currentUniversity?.name ?? "Your University"
    }

    private var theme: UniversityTheme {
        universityService.currentTheme ?? .default
    }

    var body: some View {
        ZStack {
            // University-themed background
            LinearGradient(
                colors: [
                    theme.primary.opacity(0.3),
                    ColageColors.background
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: 24) {
                    // University badge
                    ZStack {
                        Circle()
                            .fill(theme.primary.opacity(0.2))
                            .frame(width: 100, height: 100)
                            .scaleEffect(animateIn ? 1 : 0.5)

                        Image(systemName: "graduationcap.fill")
                            .font(.system(size: 44))
                            .foregroundStyle(theme.primary)
                            .scaleEffect(animateIn ? 1 : 0.3)
                    }

                    VStack(spacing: 8) {
                        Text("Welcome to")
                            .font(ColageFonts.title3)
                            .foregroundStyle(ColageColors.textSecondary)
                            .opacity(animateIn ? 1 : 0)

                        Text(universityName)
                            .font(ColageFonts.largeTitle)
                            .foregroundStyle(theme.primary)
                            .multilineTextAlignment(.center)
                            .opacity(animateIn ? 1 : 0)

                        Text("on Colage")
                            .font(ColageFonts.title2)
                            .foregroundStyle(ColageColors.textPrimary)
                            .opacity(animateIn ? 1 : 0)
                    }

                    if let count = universityService.currentUniversity?.memberCount, count > 0 {
                        HStack(spacing: 6) {
                            Circle()
                                .fill(ColageColors.online)
                                .frame(width: 8, height: 8)
                            Text("\(count) students already here")
                                .font(ColageFonts.subheadline)
                                .foregroundStyle(ColageColors.textSecondary)
                        }
                        .opacity(animateIn ? 1 : 0)
                    }
                }

                Spacer()

                ColagePrimaryButton(title: "Enter \(universityName)", action: {
                    // Finalize dev profile
                    authService.createDevProfile(
                        name: "Dev User",
                        bio: nil,
                        major: nil,
                        socialLinks: []
                    )
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
