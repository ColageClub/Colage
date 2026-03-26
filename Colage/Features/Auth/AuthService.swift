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

        do {
            struct ConfirmRequest: Encodable { let email: String; let code: String }
            struct ConfirmResponse: Decodable { let verified: Bool; let universityDomain: String }
            let result: ConfirmResponse = try await api.request(
                method: "POST",
                path: "/auth/email/confirm",
                body: ConfirmRequest(email: enteredEmail.lowercased(), code: code)
            )
            if result.verified {
                // Get auth tokens after confirmation
                await fetchAndStoreTokens()
            }
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
    /// The server type selected during onboarding (set before profile creation)
    var selectedServerType: ServerType = .student

    func createProfile(name: String, bio: String?, major: String?, socialLinks: [SocialLink]) {
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
            serverType: selectedServerType,
            createdAt: Date(),
            updatedAt: Date()
        )
        UserProfile.current = profile
        UserDefaults.standard.set(true, forKey: "dev_onboarding_complete")

        // Store profile JSON for persistence across launches
        if let data = try? JSONEncoder().encode(profile) {
            UserDefaults.standard.set(data, forKey: "dev_profile")
        }

        // Create on server
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
                    serverType: self.selectedServerType,
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



    // MARK: - Login (existing accounts)

    /// Send login OTP to existing user's email
    func sendLoginOTP(email: String) async -> Bool {
        enteredEmail = email
        isLoading = true
        defer { isLoading = false }

        // Use the email verify endpoint to send OTP for existing users
        return await sendEmailOTP(email: email)
    }

    /// Confirm login OTP and restore session
    func confirmLoginOTP(email: String, code: String) async -> Bool {
        isLoading = true
        defer { isLoading = false }

        do {
            struct ConfirmRequest: Encodable { let email: String; let code: String }
            struct ConfirmResponse: Decodable { let verified: Bool; let universityDomain: String }
            let result: ConfirmResponse = try await api.request(
                method: "POST",
                path: "/auth/email/confirm",
                body: ConfirmRequest(email: enteredEmail.lowercased(), code: code)
            )
            if result.verified {
                await fetchAndStoreTokens()
                await MainActor.run {
                    emailVerified = true
                    phoneVerified = true
                }
            }
            return result.verified
        } catch {
            await MainActor.run { errorMessage = error.localizedDescription }
            return false
        }
    }

    // MARK: - Token Management

    private struct TokenResponse: Decodable {
        let accessToken: String
        let idToken: String
        let refreshToken: String?
        let expiresIn: Int
    }

    /// Authenticate with Cognito and store tokens in Keychain
    func fetchAndStoreTokens() async {
        do {
            struct LoginRequest: Encodable { 
                let email: String 
                let deviceId: String
            }
            let tokens: TokenResponse = try await api.request(
                method: "POST",
                path: "/auth/login",
                body: LoginRequest(
                    email: enteredEmail.lowercased(),
                    deviceId: APIClient.deviceId()
                )
            )
            KeychainWrapper.set(key: "access_token", value: tokens.accessToken)
            KeychainWrapper.set(key: "id_token", value: tokens.idToken)
            if let refresh = tokens.refreshToken {
                KeychainWrapper.set(key: "refresh_token", value: refresh)
            }
            // Store expiry time
            let expiry = Date().addingTimeInterval(TimeInterval(tokens.expiresIn))
            UserDefaults.standard.set(expiry.timeIntervalSince1970, forKey: "token_expiry")
        } catch {
            print("Failed to fetch tokens: \(error)")
        }
    }

    /// Refresh tokens using stored refresh token
    func refreshTokensIfNeeded() async -> Bool {
        let expiry = UserDefaults.standard.double(forKey: "token_expiry")
        guard expiry > 0, Date().timeIntervalSince1970 > expiry - 60 else {
            return true // Still valid
        }
        guard let refreshToken = KeychainWrapper.get(key: "refresh_token") else {
            return false
        }
        do {
            struct RefreshRequest: Encodable { let refreshToken: String }
            let tokens: TokenResponse = try await api.request(
                method: "POST",
                path: "/auth/refresh",
                body: RefreshRequest(refreshToken: refreshToken)
            )
            KeychainWrapper.set(key: "access_token", value: tokens.accessToken)
            KeychainWrapper.set(key: "id_token", value: tokens.idToken)
            let newExpiry = Date().addingTimeInterval(TimeInterval(tokens.expiresIn))
            UserDefaults.standard.set(newExpiry.timeIntervalSince1970, forKey: "token_expiry")
            return true
        } catch {
            print("Token refresh failed: \(error)")
            return false
        }
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
