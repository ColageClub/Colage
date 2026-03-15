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

    /// Extract the root .edu domain from an email, collapsing subdomains.
    /// e.g. "student@engineering.umich.edu" → "umich.edu"
    ///      "student@umich.edu" → "umich.edu"
    ///      "student@cs.stanford.edu" → "stanford.edu"
    func extractDomain(from email: String) -> String? {
        guard let atIndex = email.firstIndex(of: "@") else { return nil }
        let fullDomain = String(email[email.index(after: atIndex)...]).lowercased()
        guard fullDomain.hasSuffix(".edu") else { return nil }

        // Split into parts and take the last two (root domain + .edu)
        // e.g. ["engineering", "umich", "edu"] → "umich.edu"
        let parts = fullDomain.components(separatedBy: ".")
        guard parts.count >= 2 else { return nil }
        let rootDomain = parts.suffix(2).joined(separator: ".")
        return rootDomain
    }

    private let api = APIClient.shared

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

        do {
            struct EmailRequest: Encodable { let email: String }
            let _: [String: String] = try await api.request(
                method: "POST",
                path: "/auth/email/verify",
                body: EmailRequest(email: email.lowercased())
            )
            return true
        } catch {
            await MainActor.run { errorMessage = error.localizedDescription }
            return false
        }
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

        do {
            struct ConfirmRequest: Encodable { let email: String; let code: String }
            struct ConfirmResponse: Decodable { let verified: Bool; let universityDomain: String }
            let result: ConfirmResponse = try await api.request(
                method: "POST",
                path: "/auth/email/confirm",
                body: ConfirmRequest(email: enteredEmail.lowercased(), code: code)
            )
            await MainActor.run { emailVerified = result.verified }
            return result.verified
        } catch {
            await MainActor.run { errorMessage = error.localizedDescription }
            return false
        }
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

        do {
            struct PhoneRequest: Encodable { let phone: String; let email: String }
            let _: [String: String] = try await api.request(
                method: "POST",
                path: "/auth/phone/verify",
                body: PhoneRequest(phone: phone, email: enteredEmail.lowercased())
            )
            return true
        } catch {
            await MainActor.run { errorMessage = error.localizedDescription }
            return false
        }
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

        do {
            struct PhoneConfirm: Encodable { let phone: String; let code: String }
            struct PhoneResult: Decodable { let verified: Bool }
            let result: PhoneResult = try await api.request(
                method: "POST",
                path: "/auth/phone/confirm",
                body: PhoneConfirm(phone: enteredPhone, code: code)
            )
            await MainActor.run { phoneVerified = result.verified }
            return result.verified
        } catch {
            await MainActor.run { errorMessage = error.localizedDescription }
            return false
        }
    }

    /// Create profile (local in dev, API in production)
    func createDevProfile(name: String, bio: String?, major: String?, socialLinks: [SocialLink]) {
        let domain = extractDomain(from: enteredEmail) ?? "umich.edu"
        let profile = UserProfile(
            userId: UUID().uuidString,
            universityDomain: domain,
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

        // Also create on server (fire-and-forget)
        if !AppState.devMode {
            Task {
                struct CreateProfileRequest: Encodable {
                    let email: String
                    let displayName: String
                    let bio: String?
                    let major: String?
                    let socialLinks: [SocialLink]
                    let universityDomain: String
                }
                struct CreateProfileResponse: Decodable {
                    let profile: ServerProfile
                    struct ServerProfile: Decodable { let userId: String }
                }
                do {
                    let result: CreateProfileResponse = try await api.request(
                        method: "POST",
                        path: "/users",
                        body: CreateProfileRequest(
                            email: enteredEmail.lowercased(),
                            displayName: name,
                            bio: bio,
                            major: major,
                            socialLinks: socialLinks,
                            universityDomain: domain
                        )
                    )
                    // Update local profile with server-assigned userId
                    var updated = profile
                    updated = UserProfile(
                        userId: result.profile.userId,
                        universityDomain: domain,
                        displayName: name,
                        profilePhotoURL: nil,
                        bio: bio,
                        major: major,
                        socialLinks: socialLinks,
                        isVisible: true,
                        createdAt: Date(),
                        updatedAt: Date()
                    )
                    await MainActor.run {
                        UserProfile.current = updated
                        if let data = try? JSONEncoder().encode(updated) {
                            UserDefaults.standard.set(data, forKey: "dev_profile")
                        }
                    }
                } catch {
                    print("Failed to create server profile: \(error)")
                }
            }
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
