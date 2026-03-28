import Foundation

/// API client — handles REST calls to backend (or mock in dev mode)
class APIClient {
    static let shared = APIClient()

    private let baseURL: String
    private let session: URLSession

    private init() {
        self.baseURL = Bundle.main.infoDictionary?["API_BASE_URL"] as? String
            ?? "https://wn7mxcdxca.execute-api.us-east-2.amazonaws.com/dev"
        self.session = URLSession.shared
    }

    enum APIError: Error, LocalizedError {
        case invalidURL
        case noData
        case decodingError
        case serverError(Int, String?)
        case networkError(Error)
        case deviceMismatch

        var errorDescription: String? {
            switch self {
            case .invalidURL: return "Invalid URL"
            case .noData: return "No data received"
            case .decodingError: return "Failed to decode response"
            case .serverError(let code, let msg): return "Server error \(code): \(msg ?? "Unknown")"
            case .networkError(let err): return err.localizedDescription
            case .deviceMismatch: return "This account is signed in on another device"
            }
        }
    }

    /// Paths that don't need auth tokens
    private let publicPaths = ["/auth/email/", "/auth/login", "/auth/refresh", "/universities/"]

    private struct TokenRefreshRequest: Encodable { let refreshToken: String }
    private struct TokenRefreshResponse: Decodable { let accessToken: String; let idToken: String; let expiresIn: Int }

    // MARK: - Serialized Token Refresh

    /// Actor that serializes concurrent 401-triggered refresh attempts.
    /// The first caller performs the actual refresh; subsequent callers wait for the same result.
    private actor TokenRefreshCoordinator {
        private var isRefreshing = false
        private var waitingContinuations: [CheckedContinuation<String, Error>] = []

        func refresh(using performRefresh: @Sendable () async throws -> String) async throws -> String {
            if isRefreshing {
                // Another refresh is in flight — wait for it
                return try await withCheckedThrowingContinuation { continuation in
                    waitingContinuations.append(continuation)
                }
            }

            isRefreshing = true
            do {
                let newToken = try await performRefresh()
                // Resume all waiters with the new token
                for continuation in waitingContinuations {
                    continuation.resume(returning: newToken)
                }
                waitingContinuations.removeAll()
                isRefreshing = false
                return newToken
            } catch {
                // Resume all waiters with the error
                for continuation in waitingContinuations {
                    continuation.resume(throwing: error)
                }
                waitingContinuations.removeAll()
                isRefreshing = false
                throw error
            }
        }
    }

    private let refreshCoordinator = TokenRefreshCoordinator()
    
    /// Get or generate a stable device UUID
    static func deviceId() -> String {
        if let existing = KeychainWrapper.get(key: "device_id") {
            return existing
        } else {
            let newId = UUID().uuidString
            KeychainWrapper.set(key: "device_id", value: newId)
            return newId
        }
    }

    /// Fire-and-forget request — ignores response body, just checks for 2xx
    func requestVoid(
        method: String = "POST",
        path: String,
        body: Encodable? = nil
    ) async throws {
        let _: EmptyResponse = try await request(method: method, path: path, body: body)
    }

    private struct EmptyResponse: Decodable {
        // Accepts any JSON — just needs to not throw on decode
        init(from decoder: Decoder) throws {
            // Accept anything: object, array, or even try to skip
            _ = try? decoder.singleValueContainer()
        }
    }

    func request<T: Decodable>(
        method: String = "GET",
        path: String,
        body: Encodable? = nil
    ) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(path)") else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Attach JWT if available (skip for public auth endpoints)
        let isPublic = publicPaths.contains(where: { path.hasPrefix($0) })
        // Use id_token (not access_token) — Cognito ID tokens contain email claim needed by backend
        if !isPublic, let token = KeychainWrapper.get(key: "id_token") ?? KeychainWrapper.get(key: "access_token") {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            // Add device ID header for authenticated requests
            request.setValue(APIClient.deviceId(), forHTTPHeaderField: "X-Device-Id")
        }

        if let body = body {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            request.httpBody = try encoder.encode(body)
        }

        var (data, response) = try await session.data(for: request)
        var httpResponse = response as? HTTPURLResponse

        // Auto-refresh on 401 — serialized so concurrent requests share one refresh
        if httpResponse?.statusCode == 401, !isPublic,
           KeychainWrapper.get(key: "refresh_token") != nil {
            let refreshBaseURL = self.baseURL
            let currentSession = self.session
            do {
                let newToken = try await refreshCoordinator.refresh { @Sendable in
                    guard let refreshToken = KeychainWrapper.get(key: "refresh_token"),
                          let refreshURL = URL(string: "\(refreshBaseURL)/auth/refresh") else {
                        throw APIError.serverError(401, "No refresh token")
                    }
                    var refreshRequest = URLRequest(url: refreshURL)
                    refreshRequest.httpMethod = "POST"
                    refreshRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    refreshRequest.httpBody = try JSONEncoder().encode(TokenRefreshRequest(refreshToken: refreshToken))
                    let (refreshData, _) = try await currentSession.data(for: refreshRequest)
                    let tokens = try JSONDecoder().decode(TokenRefreshResponse.self, from: refreshData)
                    KeychainWrapper.set(key: "access_token", value: tokens.accessToken)
                    KeychainWrapper.set(key: "id_token", value: tokens.idToken)
                    let newExpiry = Date().addingTimeInterval(TimeInterval(tokens.expiresIn))
                    UserDefaults.standard.set(newExpiry.timeIntervalSince1970, forKey: "token_expiry")
                    return tokens.idToken
                }
                // Retry original request with new ID token
                request.setValue("Bearer \(newToken)", forHTTPHeaderField: "Authorization")
                (data, response) = try await session.data(for: request)
                httpResponse = response as? HTTPURLResponse
            } catch {
                // Refresh failed — fall through to normal error handling
            }
        }

        guard let finalResponse = httpResponse else {
            throw APIError.noData
        }

        guard (200...299).contains(finalResponse.statusCode) else {
            let message = String(data: data, encoding: .utf8)
            
            // Check for device mismatch
            if finalResponse.statusCode == 401 && message?.contains("device_mismatch") == true {
                // Clear tokens and throw device mismatch error
                KeychainWrapper.clearAll()
                throw APIError.deviceMismatch
            }
            
            throw APIError.serverError(finalResponse.statusCode, message)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(T.self, from: data)
    }
}
