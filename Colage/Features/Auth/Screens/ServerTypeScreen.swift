import SwiftUI

/// Onboarding screen where the user picks Student or Alumni
struct ServerTypeScreen: View {
    let onContinue: () -> Void
    @Environment(.themeColor) private var themeColor
    @EnvironmentObject var onboardingData: OnboardingData

    @State private var selected: ServerType? = nil
    @State private var animateIn = false

    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: 24) {
                    Text("Are you a…")
                        .font(ColageFonts.largeTitle)
                        .foregroundStyle(ColageColors.textPrimary)
                        .opacity(animateIn ? 1 : 0)

                    Text("This determines which server you join")
                        .font(ColageFonts.subheadline)
                        .foregroundStyle(ColageColors.textSecondary)
                        .opacity(animateIn ? 1 : 0)

                    VStack(spacing: 16) {
                        ServerTypeCard(
                            type: .student,
                            icon: "book.fill",
                            title: "Current Student",
                            description: "Join your school's server with other students on campus",
                            isSelected: selected == .student,
                            onTap: { selected = .student }
                        )

                        ServerTypeCard(
                            type: .alumni,
                            icon: "graduationcap.fill",
                            title: "Alumni",
                            description: "Join the Alumni Network — graduates from all schools, one community",
                            isSelected: selected == .alumni,
                            onTap: { selected = .alumni }
                        )
                    }
                    .padding(.horizontal, 24)
                    .opacity(animateIn ? 1 : 0)
                }

                Spacer()

                ColagePrimaryButton(title: "Continue", action: {
                    guard let type = selected else { return }
                    onboardingData.serverType = type
                    onContinue()
                })
                .disabled(selected == nil)
                .opacity(selected != nil ? 1 : 0.5)
                .padding(.horizontal, 24)
                .padding(.bottom, 50)
                .animation(.easeInOut(duration: 0.2), value: selected)
            }
        }
        .navigationBarBackButtonHidden(false)
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8).delay(0.1)) {
                animateIn = true
            }
        }
    }
}

// MARK: - Server Type Card

private struct ServerTypeCard: View {
    let type: ServerType
    let icon: String
    let title: String
    let description: String
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(isSelected ? themeColor.opacity(0.2) : ColageColors.surface)
                        .frame(width: 56, height: 56)

                    Image(systemName: icon)
                        .font(.system(size: 24))
                        .foregroundStyle(isSelected ? themeColor : ColageColors.textSecondary)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(ColageFonts.bodyBold)
                        .foregroundStyle(ColageColors.textPrimary)

                    Text(description)
                        .font(ColageFonts.caption)
                        .foregroundStyle(ColageColors.textSecondary)
                        .multilineTextAlignment(.leading)
                }

                Spacer()

                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 24))
                    .foregroundStyle(isSelected ? themeColor : ColageColors.textTertiary)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(ColageColors.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(isSelected ? themeColor : Color.clear, lineWidth: 2)
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    NavigationStack {
        ServerTypeScreen(onContinue: {})
            .environmentObject(OnboardingData())
    }
}
