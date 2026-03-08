import SwiftUI

struct ProfileInfoScreen: View {
    let onContinue: () -> Void
    @EnvironmentObject var authService: AuthService
    @State private var displayName = ""
    @State private var bio = ""
    @State private var major = ""
    @State private var showMajorPicker = false

    private let commonMajors = [
        "Computer Science", "Business", "Engineering", "Biology",
        "Psychology", "Economics", "Political Science", "English",
        "Mathematics", "Chemistry", "Physics", "Art",
        "Communications", "Nursing", "Finance", "Marketing",
        "History", "Sociology", "Music", "Philosophy",
        "Pre-Med", "Pre-Law", "Architecture", "Education"
    ]

    @State private var filteredMajors: [String] = []

    private var isValid: Bool {
        !displayName.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    OnboardingProgress(currentStep: 5, totalSteps: 10)
                        .padding(.top, 8)

                    VStack(spacing: 12) {
                        Text("About you")
                            .font(ColageFonts.title)
                            .foregroundStyle(ColageColors.textPrimary)
                        Text("Only your name is required")
                            .font(ColageFonts.body)
                            .foregroundStyle(ColageColors.textSecondary)
                    }
                    .padding(.top, 48)

                    VStack(spacing: 20) {
                        // Name
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Name *")
                                .font(ColageFonts.captionBold)
                                .foregroundStyle(ColageColors.textSecondary)
                            ColageTextField(
                                placeholder: "Your name",
                                text: $displayName,
                                autocapitalization: .words
                            )
                        }

                        // Bio
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Bio")
                                    .font(ColageFonts.captionBold)
                                    .foregroundStyle(ColageColors.textSecondary)
                                Spacer()
                                Text("\(bio.count)/160")
                                    .font(ColageFonts.caption)
                                    .foregroundStyle(
                                        bio.count > 160 ? ColageColors.error : ColageColors.textTertiary
                                    )
                            }
                            TextField("Something about you...", text: $bio, axis: .vertical)
                                .font(ColageFonts.body)
                                .foregroundStyle(ColageColors.textPrimary)
                                .lineLimit(3...5)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 16)
                                .background(ColageColors.surface)
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .strokeBorder(ColageColors.border, lineWidth: 1)
                                )
                                .onChange(of: bio) { _, newValue in
                                    if newValue.count > 160 {
                                        bio = String(newValue.prefix(160))
                                    }
                                }
                        }

                        // Major
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Major")
                                .font(ColageFonts.captionBold)
                                .foregroundStyle(ColageColors.textSecondary)
                            ColageTextField(
                                placeholder: "Search or type your major",
                                text: $major
                            )
                            .onChange(of: major) { _, newValue in
                                if newValue.isEmpty {
                                    filteredMajors = []
                                } else {
                                    filteredMajors = commonMajors.filter {
                                        $0.localizedCaseInsensitiveContains(newValue)
                                    }
                                }
                            }

                            if !filteredMajors.isEmpty {
                                VStack(spacing: 0) {
                                    ForEach(filteredMajors.prefix(5), id: \.self) { suggestion in
                                        Button {
                                            major = suggestion
                                            filteredMajors = []
                                        } label: {
                                            Text(suggestion)
                                                .font(ColageFonts.body)
                                                .foregroundStyle(ColageColors.textPrimary)
                                                .frame(maxWidth: .infinity, alignment: .leading)
                                                .padding(.horizontal, 20)
                                                .padding(.vertical, 12)
                                        }
                                        Divider().background(ColageColors.border)
                                    }
                                }
                                .background(ColageColors.surface)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 40)

                    Spacer().frame(height: 100)
                }
            }

            // Fixed bottom button
            VStack {
                Spacer()
                ColagePrimaryButton(
                    title: "Continue",
                    action: onContinue,
                    isDisabled: !isValid
                )
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

#Preview {
    NavigationStack {
        ProfileInfoScreen(onContinue: {})
            .environmentObject(AuthService())
    }
}
