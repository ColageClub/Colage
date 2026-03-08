import SwiftUI

struct WelcomeScreen: View {
    let onContinue: () -> Void
    let onLogin: () -> Void

    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Logo area
                VStack(spacing: 20) {
                    ZStack {
                        Circle()
                            .fill(ColageColors.primary.opacity(0.15))
                            .frame(width: 120, height: 120)
                        Image(systemName: "location.circle.fill")
                            .font(.system(size: 60))
                            .foregroundStyle(ColageColors.primary)
                    }

                    Text("colage")
                        .font(.system(size: 42, weight: .bold, design: .rounded))
                        .foregroundStyle(ColageColors.textPrimary)

                    Text("discover your campus")
                        .font(ColageFonts.title3)
                        .foregroundStyle(ColageColors.textSecondary)
                }

                Spacer()

                // Features
                VStack(spacing: 16) {
                    FeatureRow(
                        icon: "map.fill",
                        title: "Live Map",
                        subtitle: "See who's around you in real-time"
                    )
                    FeatureRow(
                        icon: "person.2.fill",
                        title: "Student Profiles",
                        subtitle: "Connect via social links"
                    )
                    FeatureRow(
                        icon: "arkit",
                        title: "AR Discovery",
                        subtitle: "Find people through your camera"
                    )
                }
                .padding(.horizontal, 32)

                Spacer()

                // CTAs
                VStack(spacing: 12) {
                    ColagePrimaryButton(title: "Get Started", action: onContinue)

                    Button(action: onLogin) {
                        Text("Already have an account? ")
                            .font(ColageFonts.body)
                            .foregroundStyle(ColageColors.textSecondary)
                        + Text("Log In")
                            .font(ColageFonts.bodyBold)
                            .foregroundStyle(ColageColors.primary)
                    }

                    Text("For verified .edu students only")
                        .font(ColageFonts.caption)
                        .foregroundStyle(ColageColors.textTertiary)
                        .padding(.top, 4)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
        }
        .navigationBarHidden(true)
    }
}

struct FeatureRow: View {
    let icon: String
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 22))
                .foregroundStyle(ColageColors.primary)
                .frame(width: 44, height: 44)
                .background(ColageColors.primary.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(ColageFonts.bodyBold)
                    .foregroundStyle(ColageColors.textPrimary)
                Text(subtitle)
                    .font(ColageFonts.footnote)
                    .foregroundStyle(ColageColors.textSecondary)
            }

            Spacer()
        }
    }
}

#Preview {
    WelcomeScreen(onContinue: {}, onLogin: {})
}
