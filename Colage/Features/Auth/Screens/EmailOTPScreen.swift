import SwiftUI

struct EmailOTPScreen: View {
    let onVerified: () -> Void
    @Environment(\.themeColor) private var themeColor
    @EnvironmentObject var authService: AuthService
    @State private var code = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var resendCountdown = 60
    @State private var canResend = false

    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                OnboardingProgress(currentStep: 1, totalSteps: 10)
                    .padding(.top, 8)

                VStack(spacing: 12) {
                    Text("Check your email")
                        .font(ColageFonts.title)
                        .foregroundStyle(ColageColors.textPrimary)
                    Text("We sent a 6-digit code to")
                        .font(ColageFonts.body)
                        .foregroundStyle(ColageColors.textSecondary)
                    Text(authService.enteredEmail)
                        .font(ColageFonts.bodyBold)
                        .foregroundStyle(themeColor)
                }
                .padding(.top, 48)

                Spacer().frame(height: 48)

                OTPCodeField(code: $code, length: 6) { completedCode in
                    verifyCode(completedCode)
                }

                if let error = errorMessage {
                    Text(error)
                        .font(ColageFonts.footnote)
                        .foregroundStyle(ColageColors.error)
                        .padding(.top, 16)
                }

                // Resend
                Button {
                    resendCode()
                } label: {
                    if canResend {
                        Text("Resend code")
                            .font(ColageFonts.bodyBold)
                            .foregroundStyle(themeColor)
                    } else {
                        Text("Resend in \(resendCountdown)s")
                            .font(ColageFonts.body)
                            .foregroundStyle(ColageColors.textTertiary)
                    }
                }
                .disabled(!canResend)
                .padding(.top, 24)

                Spacer()

                if isLoading {
                    ProgressView()
                        .tint(themeColor)
                        .padding(.bottom, 40)
                }
            }
        }
        .onAppear { startCountdown() }
    }

    private func verifyCode(_ code: String) {
        isLoading = true
        errorMessage = nil
        Task {
            let success = await authService.confirmEmailOTP(code: code)
            await MainActor.run {
                isLoading = false
                if success {
                    onVerified()
                } else {
                    errorMessage = "Invalid code. Try again."
                    self.code = ""
                }
            }
        }
    }

    private func resendCode() {
        canResend = false
        resendCountdown = 60
        startCountdown()
        Task {
            _ = await authService.sendEmailOTP(email: authService.enteredEmail)
        }
    }

    private func startCountdown() {
        Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { timer in
            if resendCountdown > 0 {
                resendCountdown -= 1
            } else {
                canResend = true
                timer.invalidate()
            }
        }
    }
}

#Preview {
    NavigationStack {
        EmailOTPScreen(onVerified: {})
            .environmentObject(AuthService())
    }
}
