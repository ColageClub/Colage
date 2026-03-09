import SwiftUI

/// Login screen — email + OTP verification for existing accounts
struct LoginScreen: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var universityService: UniversityService
    @Environment(\.dismiss) private var dismiss

    enum LoginStep {
        case email
        case otp
    }

    @State private var step: LoginStep = .email
    @State private var email = ""
    @State private var code = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var resendCountdown = 60
    @State private var canResend = false

    private var isValidEmail: Bool {
        email.contains("@") && email.lowercased().hasSuffix(".edu")
    }

    var body: some View {
        NavigationStack {
            ZStack {
                ColageColors.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Header
                    VStack(spacing: 12) {
                        Image(systemName: step == .email ? "person.crop.circle" : "lock.shield")
                            .font(.system(size: 44))
                            .foregroundStyle(ColageColors.primary)
                            .padding(.bottom, 8)

                        Text(step == .email ? "Welcome back" : "Enter your code")
                            .font(ColageFonts.title)
                            .foregroundStyle(ColageColors.textPrimary)

                        Text(step == .email
                             ? "Log in with your .edu email"
                             : "We sent a 6-digit code to")
                            .font(ColageFonts.body)
                            .foregroundStyle(ColageColors.textSecondary)

                        if step == .otp {
                            Text(email)
                                .font(ColageFonts.bodyBold)
                                .foregroundStyle(ColageColors.primary)
                        }
                    }
                    .padding(.top, 48)

                    Spacer().frame(height: 48)

                    // Content
                    if step == .email {
                        emailStep
                    } else {
                        otpStep
                    }

                    Spacer()

                    // Error
                    if let error = errorMessage {
                        Text(error)
                            .font(ColageFonts.footnote)
                            .foregroundStyle(ColageColors.error)
                            .padding(.bottom, 16)
                    }

                    // Action button
                    if step == .email {
                        ColagePrimaryButton(
                            title: "Send Login Code",
                            action: sendLoginCode,
                            isLoading: isLoading,
                            isDisabled: !isValidEmail
                        )
                        .padding(.horizontal, 24)
                        .padding(.bottom, 40)
                    } else if isLoading {
                        ProgressView()
                            .tint(ColageColors.primary)
                            .padding(.bottom, 40)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        if step == .otp {
                            step = .email
                            code = ""
                            errorMessage = nil
                        } else {
                            dismiss()
                        }
                    } label: {
                        Image(systemName: step == .otp ? "chevron.left" : "xmark")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(ColageColors.textSecondary)
                    }
                }
            }
        }
    }

    // MARK: - Email Step

    private var emailStep: some View {
        VStack(spacing: 16) {
            ColageTextField(
                placeholder: "you@university.edu",
                text: $email,
                keyboardType: .emailAddress,
                autocapitalization: .never
            )
            .padding(.horizontal, 24)

            if isValidEmail, let domain = authService.extractDomain(from: email) {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(ColageColors.online)
                    Text(domain)
                        .font(ColageFonts.footnote)
                        .foregroundStyle(ColageColors.textSecondary)
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            }

            if AppState.devMode {
                HStack(spacing: 6) {
                    Image(systemName: "hammer.fill")
                    Text("Dev mode — any 6-digit code will work")
                }
                .font(ColageFonts.caption)
                .foregroundStyle(ColageColors.warning)
                .padding(.top, 8)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: isValidEmail)
    }

    // MARK: - OTP Step

    private var otpStep: some View {
        VStack(spacing: 24) {
            OTPCodeField(code: $code, length: 6) { completedCode in
                verifyLoginCode(completedCode)
            }

            // Resend
            Button {
                resendLoginCode()
            } label: {
                if canResend {
                    Text("Resend code")
                        .font(ColageFonts.bodyBold)
                        .foregroundStyle(ColageColors.primary)
                } else {
                    Text("Resend in \(resendCountdown)s")
                        .font(ColageFonts.body)
                        .foregroundStyle(ColageColors.textTertiary)
                }
            }
            .disabled(!canResend)
        }
    }

    // MARK: - Actions

    private func sendLoginCode() {
        isLoading = true
        errorMessage = nil

        Task {
            // Resolve university
            if let domain = authService.extractDomain(from: email) {
                if let university = await universityService.resolveUniversity(domain: domain) {
                    universityService.setUniversity(university)
                }
            }

            let success = await authService.sendLoginOTP(email: email)
            await MainActor.run {
                isLoading = false
                if success {
                    if AppState.devMode {
                        // Dev mode: skip OTP, log in directly
                        Task {
                            let loginSuccess = await authService.confirmLoginOTP(email: email, code: "000000")
                            await MainActor.run {
                                if loginSuccess {
                                    appState.authState = .authenticated
                                }
                            }
                        }
                    } else {
                        step = .otp
                        startCountdown()
                    }
                } else {
                    errorMessage = authService.errorMessage ?? "Failed to send code"
                }
            }
        }
    }

    private func verifyLoginCode(_ code: String) {
        isLoading = true
        errorMessage = nil

        Task {
            let success = await authService.confirmLoginOTP(email: email, code: code)
            await MainActor.run {
                isLoading = false
                if success {
                    appState.authState = .authenticated
                } else {
                    errorMessage = "Invalid code. Try again."
                    self.code = ""
                }
            }
        }
    }

    private func resendLoginCode() {
        canResend = false
        resendCountdown = 60
        startCountdown()
        Task {
            _ = await authService.sendLoginOTP(email: email)
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
    LoginScreen()
        .environmentObject(AppState())
        .environmentObject(AuthService())
        .environmentObject(UniversityService())
}
