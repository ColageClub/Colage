import SwiftUI

struct SocialLinksScreen: View {
    let onContinue: () -> Void
    @State private var links: [SocialPlatform: String] = [:]
    @State private var expandedPlatform: SocialPlatform?

    private let platforms: [SocialPlatform] = [
        .instagram, .tiktok, .x, .snapchat, .facebook, .bereal, .linkedin
    ]

    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    OnboardingProgress(currentStep: 6, totalSteps: 10)
                        .padding(.top, 8)

                    VStack(spacing: 12) {
                        Text("Add social links")
                            .font(ColageFonts.title)
                            .foregroundStyle(ColageColors.textPrimary)
                        Text("This is how people connect with you")
                            .font(ColageFonts.body)
                            .foregroundStyle(ColageColors.textSecondary)
                    }
                    .padding(.top, 48)

                    VStack(spacing: 12) {
                        ForEach(platforms, id: \.self) { platform in
                            SocialLinkRow(
                                platform: platform,
                                handle: Binding(
                                    get: { links[platform] ?? "" },
                                    set: { links[platform] = $0 }
                                ),
                                isExpanded: expandedPlatform == platform,
                                onTap: {
                                    withAnimation(.spring(response: 0.3)) {
                                        expandedPlatform = expandedPlatform == platform ? nil : platform
                                    }
                                }
                            )
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 32)

                    Spacer().frame(height: 120)
                }
            }

            VStack {
                Spacer()
                VStack(spacing: 12) {
                    ColagePrimaryButton(title: "Continue", action: onContinue)

                    Button("Skip for now") {
                        onContinue()
                    }
                    .font(ColageFonts.body)
                    .foregroundStyle(ColageColors.textSecondary)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
                .background(
                    LinearGradient(
                        colors: [ColageColors.background.opacity(0), ColageColors.background],
                        startPoint: .top,
                        endPoint: .center
                    )
                )
            }
        }
    }
}

struct SocialLinkRow: View {
    let platform: SocialPlatform
    @Binding var handle: String
    let isExpanded: Bool
    let onTap: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Button(action: onTap) {
                HStack(spacing: 14) {
                    Image(systemName: platform.iconName)
                        .font(.system(size: 20))
                        .foregroundStyle(ColageColors.primary)
                        .frame(width: 40, height: 40)
                        .background(ColageColors.primary.opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 10))

                    Text(platform.displayName)
                        .font(ColageFonts.body)
                        .foregroundStyle(ColageColors.textPrimary)

                    Spacer()

                    if !handle.isEmpty {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(ColageColors.online)
                    }

                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(ColageColors.textTertiary)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }

            if isExpanded {
                ColageTextField(
                    placeholder: placeholder(for: platform),
                    text: $handle,
                    autocapitalization: .never
                )
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
            }
        }
        .background(ColageColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func placeholder(for platform: SocialPlatform) -> String {
        switch platform {
        case .instagram, .tiktok, .x: return "@username"
        case .snapchat, .bereal: return "username"
        case .facebook, .linkedin: return "Profile URL"
        case .custom1, .custom2, .custom3: return "https://..."
        }
    }
}

#Preview {
    NavigationStack {
        SocialLinksScreen(onContinue: {})
    }
}
