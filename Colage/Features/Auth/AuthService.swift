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
        UserDefaults.standard.set(email.lowercased(), forKey: "user_email")
        isLoading = true
        defer { isLoading = false }

        do {
            struct EmailRequest: Encodable { let email: String }
            struct EmailResponse: Decodable { let message: String; let existing: Bool? }
            let _: EmailResponse = try await api.request(
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
            // Don't fetch tokens here — wait until onboarding is complete
            // Tokens are fetched in completeOnboarding()
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

    func createProfile(name: String, bio: String?, major: String?, socialLinks: [SocialLink], photo: UIImage? = nil) {
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

        // Create on server + upload photo
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
                let serverUserId = result.profile.userId

                // Upload photo if provided
                var photoURL: String? = nil
                if let photo = photo {
                    photoURL = await uploadProfilePhoto(photo, userId: serverUserId)
                }

                // Update local profile with server-assigned userId + photo URL
                let updated = UserProfile(
                    userId: serverUserId,
                    universityDomain: domain,
                    displayName: name,
                    profilePhotoURL: photoURL,
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

                // Update photo URL on server if we uploaded
                if let photoURL = photoURL {
                    struct UpdateProfileRequest: Encodable { let profilePhotoURL: String }
                    let _: [String: String] = try await api.request(
                        method: "PUT",
                        path: "/users/\(serverUserId)",
                        body: UpdateProfileRequest(profilePhotoURL: photoURL)
                    )
                }
            } catch {
                print("Failed to create server profile: \(error)")
            }
        }
    }

    // MARK: - Photo Upload

    /// Upload a profile photo to S3 via presigned URL, returns the CDN URL
    private func uploadProfilePhoto(_ image: UIImage, userId: String) async -> String? {
        // Compress to JPEG
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            print("Failed to compress image")
            return nil
        }

        do {
            // Get presigned upload URL
            struct UploadURLRequest: Encodable { let userId: String; let contentType: String }
            struct UploadURLResponse: Decodable { let uploadUrl: String; let key: String; let publicUrl: String }

            let uploadInfo: UploadURLResponse = try await api.request(
                method: "POST",
                path: "/photos/upload-url",
                body: UploadURLRequest(userId: userId, contentType: "image/jpeg")
            )

            // Upload to S3 via presigned URL
            guard let uploadURL = URL(string: uploadInfo.uploadUrl) else { return nil }
            var request = URLRequest(url: uploadURL)
            request.httpMethod = "PUT"
            request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
            request.httpBody = imageData

            let (_, response) = try await URLSession.shared.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                print("Photo upload failed with status: \((response as? HTTPURLResponse)?.statusCode ?? 0)")
                return nil
            }

            print("Photo uploaded successfully: \(uploadInfo.publicUrl)")
            return uploadInfo.publicUrl
        } catch {
            print("Photo upload error: \(error)")
            return nil
        }
    }



    // MARK: - Update Profile

    /// Update an existing profile (from Edit Profile screen)
    func updateProfile(name: String, bio: String?, major: String?, socialLinks: [SocialLink], photo: UIImage? = nil) async {
        guard let userId = UserProfile.current?.userId else {
            print("No current user to update")
            return
        }

        // Upload photo first if provided
        var photoURL = UserProfile.current?.profilePhotoURL
        if let photo = photo {
            if let newURL = await uploadProfilePhoto(photo, userId: userId) {
                photoURL = newURL
            }
        }

        // Update on server
        struct UpdateRequest: Encodable {
            let displayName: String
            let bio: String?
            let major: String?
            let socialLinks: [SocialLink]
            let profilePhotoURL: String?
        }

        do {
            struct UpdateResponse: Decodable {
                let profile: ProfileData
                struct ProfileData: Decodable {
                    let userId: String
                    let displayName: String?
                    let profilePhotoURL: String?
                }
            }
            let _: UpdateResponse = try await api.request(
                method: "PUT",
                path: "/users/\(userId)",
                body: UpdateRequest(
                    displayName: name,
                    bio: bio,
                    major: major,
                    socialLinks: socialLinks,
                    profilePhotoURL: photoURL
                )
            )
        } catch {
            print("Failed to update profile on server: \(error)")
        }

        // Update local profile
        let domain = UserProfile.current?.universityDomain ?? "unknown"
        let updated = UserProfile(
            userId: userId,
            universityDomain: domain,
            displayName: name,
            profilePhotoURL: photoURL,
            bio: bio,
            major: major,
            socialLinks: socialLinks,
            isVisible: UserProfile.current?.isVisible ?? true,
            serverType: UserProfile.current?.serverType ?? .student,
            createdAt: UserProfile.current?.createdAt ?? Date(),
            updatedAt: Date()
        )
        await MainActor.run {
            UserProfile.current = updated
            if let data = try? JSONEncoder().encode(updated) {
                UserDefaults.standard.set(data, forKey: "dev_profile")
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
            var email = enteredEmail.lowercased()
            // Fall back to persisted email if in-memory value was lost
            if email.isEmpty {
                email = (UserDefaults.standard.string(forKey: "user_email") ?? "").lowercased()
            }
            guard !email.isEmpty else {
                print("[Auth] fetchAndStoreTokens: enteredEmail is empty and no persisted email!")
                return
            }
            print("[Auth] fetchAndStoreTokens: requesting tokens for \(email)")
            struct LoginRequest: Encodable { 
                let email: String 
                let deviceId: String
            }
            let tokens: TokenResponse = try await api.request(
                method: "POST",
                path: "/auth/login",
                body: LoginRequest(
                    email: email,
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

    // MARK: - Server Type Switch

    /// Switch between student and alumni server types on the backend
    func switchServerType(to serverType: ServerType) async -> Bool {
        guard let userId = UserProfile.current?.userId else { return false }

        do {
            struct UpdateServerTypeRequest: Encodable { let serverType: String }
            let _: [String: String] = try await api.request(
                method: "PUT",
                path: "/users/\(userId)",
                body: UpdateServerTypeRequest(serverType: serverType.rawValue)
            )

            // Update local profile
            if var profile = UserProfile.current {
                let updated = UserProfile(
                    userId: profile.userId,
                    universityDomain: profile.universityDomain,
                    displayName: profile.displayName,
                    profilePhotoURL: profile.profilePhotoURL,
                    bio: profile.bio,
                    major: profile.major,
                    socialLinks: profile.socialLinks,
                    isVisible: profile.isVisible,
                    serverType: serverType,
                    createdAt: profile.createdAt,
                    updatedAt: Date()
                )
                await MainActor.run {
                    UserProfile.current = updated
                    if let data = try? JSONEncoder().encode(updated) {
                        UserDefaults.standard.set(data, forKey: "dev_profile")
                    }
                }
            }
            return true
        } catch {
            print("[Auth] Failed to switch server type: \(error)")
            return false
        }
    }

    // MARK: - Account Deletion

    /// Delete the user's account from the backend and clear local data
    func deleteAccount() async -> Bool {
        guard let userId = UserProfile.current?.userId else { return false }

        do {
            try await api.requestVoid(
                method: "DELETE",
                path: "/users/\(userId)"
            )
            await MainActor.run {
                logout()
            }
            return true
        } catch {
            print("[Auth] Failed to delete account: \(error)")
            // Still logout locally even if server delete fails
            await MainActor.run {
                logout()
            }
            return true
        }
    }

    func logout() {
        KeychainWrapper.clearAll()
        UserProfile.current = nil
        UserDefaults.standard.removeObject(forKey: "dev_onboarding_complete")
        UserDefaults.standard.removeObject(forKey: "dev_profile")
        UserDefaults.standard.removeObject(forKey: "user_email")
        emailVerified = false
        phoneVerified = false
    }
}
