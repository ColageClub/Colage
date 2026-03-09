import SwiftUI

struct PhoneEntryScreen: View {
    let onContinue: () -> Void
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var onboardingData: OnboardingData
    @State private var phoneNumber = ""
    @State private var countryCode = "+1"
    @State private var isLoading = false
    @State private var errorMessage: String?

    private var isValidPhone: Bool {
        phoneNumber.filter { $0.isNumber }.count >= 10
    }

    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                OnboardingProgress(currentStep: 2, totalSteps: 10)
                    .padding(.top, 8)

                VStack(spacing: 12) {
                    Text("Verify your phone")
                        .font(ColageFonts.title)
                        .foregroundStyle(ColageColors.textPrimary)
                    Text("For account recovery only — never shared")
                        .font(ColageFonts.body)
                        .foregroundStyle(ColageColors.textSecondary)
                }
                .padding(.top, 48)

                Spacer().frame(height: 48)

                HStack(spacing: 12) {
                    // Country code
                    Text(countryCode)
                        .font(ColageFonts.body)
                        .foregroundStyle(ColageColors.textPrimary)
                        .frame(width: 56, height: 56)
                        .background(ColageColors.surface)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .strokeBorder(ColageColors.border, lineWidth: 1)
                        )

                    ColageTextField(
                        placeholder: "(555) 555-5555",
                        text: $phoneNumber,
                        keyboardType: .phonePad
                    )
                }
                .padding(.horizontal, 24)

                if let error = errorMessage {
                    Text(error)
                        .font(ColageFonts.footnote)
                        .foregroundStyle(ColageColors.error)
                        .padding(.top, 8)
                }

                if AppState.devMode {
                    HStack(spacing: 6) {
                        Image(systemName: "hammer.fill")
                        Text("Dev mode — verification will be skipped")
                    }
                    .font(ColageFonts.caption)
                    .foregroundStyle(ColageColors.warning)
                    .padding(.top, 16)
                }

                Spacer()

                ColagePrimaryButton(
                    title: "Send Code",
                    action: sendOTP,
                    isLoading: isLoading,
                    isDisabled: !isValidPhone
                )
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
        }
    }

    private func sendOTP() {
        isLoading = true
        errorMessage = nil
        let fullNumber = countryCode + phoneNumber.filter { $0.isNumber }
        Task {
            let success = await authService.sendPhoneOTP(phone: fullNumber)
            await MainActor.run {
                isLoading = false
                if success {
                    onboardingData.phone = fullNumber
                    onContinue()
                } else {
                    errorMessage = "Failed to send SMS"
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        PhoneEntryScreen(onContinue: {})
            .environmentObject(AuthService())
    }
}
