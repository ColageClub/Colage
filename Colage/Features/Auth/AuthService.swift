import Foundation
import SwiftUI

/// Handles authentication — email verification, phone OTP, session management
class AuthService: ObservableObject {
    @Published var emailVerified = false
    @Published var phoneVerified = false
    @Published var isLoading = false
    @Published var errorMessage: String?

    var enteredEmail: String = ""
    var enteredPhone: String = ""
    var resolvedUniversity: University?

    /// Extract domain from email
    func extractDomain(from email: String) -> String? {
        guard let atIndex = email.firstIndex(of: "@") else { return nil }
        let domain = String(email[email.index(after: atIndex)...]).lowercased()
        guard domain.hasSuffix(".edu") else { return nil }
        return domain
    }

    /// Send email OTP
    func sendEmailOTP(email: String) async -> Bool {
        enteredEmail = email
        isLoading = true
        defer { isLoading = false }

        if AppState.devMode {
            // Dev mode: instant success
            try? await Task.sleep(for: .seconds(1))
            return true
        }

        // TODO: POST /auth/email/verify
        return false
    }

    /// Confirm email OTP
    func confirmEmailOTP(code: String) async -> Bool {
        isLoading = true
        defer { isLoading = false }

        if AppState.devMode {
            // Dev mode: any 6-digit code works
            try? await Task.sleep(for: .seconds(0.5))
            if code.count == 6 {
                emailVerified = true
                return true
            }
            errorMessage = "Invalid code"
            return false
        }

        // TODO: POST /auth/email/confirm
        return false
    }

    /// Send phone OTP via Twilio
    func sendPhoneOTP(phone: String) async -> Bool {
        enteredPhone = phone
        isLoading = true
        defer { isLoading = false }

        if AppState.devMode {
            try? await Task.sleep(for: .seconds(1))
            return true
        }

        // TODO: POST /auth/phone/verify
        return false
    }

    /// Confirm phone OTP
    func confirmPhoneOTP(code: String) async -> Bool {
        isLoading = true
        defer { isLoading = false }

        if AppState.devMode {
            try? await Task.sleep(for: .seconds(0.5))
            if code.count == 6 {
                phoneVerified = true
                return true
            }
            errorMessage = "Invalid code"
            return false
        }

        // TODO: POST /auth/phone/confirm
        return false
    }

    /// Create dev-mode profile
    func createDevProfile(name: String, bio: String?, major: String?, socialLinks: [SocialLink]) {
        let profile = UserProfile(
            userId: UUID().uuidString,
            universityDomain: extractDomain(from: enteredEmail) ?? "umich.edu",
            displayName: name,
            profilePhotoURL: nil,
            bio: bio,
            major: major,
            socialLinks: socialLinks,
            isVisible: true,
            createdAt: Date(),
            updatedAt: Date()
        )
        UserProfile.current = profile
        UserDefaults.standard.set(true, forKey: "dev_onboarding_complete")

        // Store profile JSON for persistence across launches
        if let data = try? JSONEncoder().encode(profile) {
            UserDefaults.standard.set(data, forKey: "dev_profile")
        }
    }

    /// Load dev profile from storage
    func loadDevProfile() -> UserProfile? {
        guard let data = UserDefaults.standard.data(forKey: "dev_profile"),
              let profile = try? JSONDecoder().decode(UserProfile.self, from: data) else {
            return nil
        }
        UserProfile.current = profile
        return profile
    }

    // MARK: - Login (existing accounts)

    /// Send login OTP to existing user's email
    func sendLoginOTP(email: String) async -> Bool {
        enteredEmail = email
        isLoading = true
        defer { isLoading = false }

        if AppState.devMode {
            // Dev mode: check if a profile exists for this email
            try? await Task.sleep(for: .seconds(0.5))
            // In dev, any .edu email "exists"
            return true
        }

        // TODO: POST /auth/login — triggers Cognito to send OTP
        // Should return 404 if user doesn't exist
        return false
    }

    /// Confirm login OTP and restore session
    func confirmLoginOTP(email: String, code: String) async -> Bool {
        isLoading = true
        defer { isLoading = false }

        if AppState.devMode {
            try? await Task.sleep(for: .seconds(0.5))
            if code.count == 6 {
                emailVerified = true
                phoneVerified = true

                // Restore or create dev profile
                if let existing = loadDevProfile() {
                    UserProfile.current = existing
                } else {
                    // No stored profile — create a basic one
                    let domain = extractDomain(from: email) ?? "umich.edu"
                    createDevProfile(
                        name: email.components(separatedBy: "@").first?.capitalized ?? "Student",
                        bio: nil,
                        major: nil,
                        socialLinks: []
                    )
                }

                UserDefaults.standard.set(true, forKey: "dev_onboarding_complete")
                return true
            }
            errorMessage = "Invalid code"
            return false
        }

        // TODO: POST /auth/login/confirm — returns JWT tokens
        // Store tokens in Keychain, fetch profile from API
        return false
    }

    func logout() {
        KeychainWrapper.clearAll()
        UserProfile.current = nil
        UserDefaults.standard.removeObject(forKey: "dev_onboarding_complete")
        UserDefaults.standard.removeObject(forKey: "dev_profile")
        emailVerified = false
        phoneVerified = false
    }
}
