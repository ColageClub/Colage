import SwiftUI

struct PhoneOTPScreen: View {
    let onVerified: () -> Void
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
                OnboardingProgress(currentStep: 3, totalSteps: 10)
                    .padding(.top, 8)

                VStack(spacing: 12) {
                    Text("Enter SMS code")
                        .font(ColageFonts.title)
                        .foregroundStyle(ColageColors.textPrimary)
                    Text("Sent to \(authService.enteredPhone)")
                        .font(ColageFonts.body)
                        .foregroundStyle(ColageColors.textSecondary)
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

                Button {
                    resendCode()
                } label: {
                    Text(canResend ? "Resend code" : "Resend in \(resendCountdown)s")
                        .font(canResend ? ColageFonts.bodyBold : ColageFonts.body)
                        .foregroundStyle(canResend ? ColageColors.primary : ColageColors.textTertiary)
                }
                .disabled(!canResend)
                .padding(.top, 24)

                Spacer()

                if isLoading {
                    ProgressView()
                        .tint(ColageColors.primary)
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
            let success = await authService.confirmPhoneOTP(code: code)
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
            _ = await authService.sendPhoneOTP(phone: authService.enteredPhone)
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
        PhoneOTPScreen(onVerified: {})
            .environmentObject(AuthService())
    }
}
