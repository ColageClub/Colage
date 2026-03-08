import SwiftUI

struct EmailEntryScreen: View {
    let onContinue: () -> Void
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var universityService: UniversityService
    @State private var email = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    private var isValidEmail: Bool {
        email.contains("@") && email.lowercased().hasSuffix(".edu")
    }

    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                OnboardingProgress(currentStep: 0, totalSteps: 10)
                    .padding(.top, 8)

                VStack(spacing: 12) {
                    Text("Enter your .edu email")
                        .font(ColageFonts.title)
                        .foregroundStyle(ColageColors.textPrimary)
                    Text("We'll verify you're a real student")
                        .font(ColageFonts.body)
                        .foregroundStyle(ColageColors.textSecondary)
                }
                .padding(.top, 48)

                Spacer().frame(height: 48)

                ColageTextField(
                    placeholder: "you@university.edu",
                    text: $email,
                    keyboardType: .emailAddress,
                    autocapitalization: .never
                )
                .padding(.horizontal, 24)

                if let error = errorMessage {
                    Text(error)
                        .font(ColageFonts.footnote)
                        .foregroundStyle(ColageColors.error)
                        .padding(.top, 8)
                }

                if isValidEmail, let domain = authService.extractDomain(from: email) {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(ColageColors.online)
                        Text(domain)
                            .font(ColageFonts.footnote)
                            .foregroundStyle(ColageColors.textSecondary)
                    }
                    .padding(.top, 12)
                    .transition(.opacity.combined(with: .move(edge: .top)))
                }

                Spacer()

                ColagePrimaryButton(
                    title: "Continue",
                    action: sendOTP,
                    isLoading: isLoading,
                    isDisabled: !isValidEmail
                )
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
        }
        .navigationBarBackButtonHidden(false)
        .animation(.easeInOut(duration: 0.2), value: isValidEmail)
    }

    private func sendOTP() {
        guard isValidEmail else { return }
        isLoading = true
        errorMessage = nil

        Task {
            // Resolve university
            if let domain = authService.extractDomain(from: email) {
                let university = await universityService.resolveUniversity(domain: domain)
                if let university {
                    universityService.setUniversity(university)
                    authService.resolvedUniversity = university
                }
            }

            let success = await authService.sendEmailOTP(email: email)
            await MainActor.run {
                isLoading = false
                if success {
                    onContinue()
                } else {
                    errorMessage = "Failed to send verification code"
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        EmailEntryScreen(onContinue: {})
            .environmentObject(AuthService())
            .environmentObject(UniversityService())
    }
}
