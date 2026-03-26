import Foundation

/// API client — handles REST calls to backend (or mock in dev mode)
class APIClient {
    static let shared = APIClient()

    private let baseURL: String
    private let session: URLSession

    private init() {
        self.baseURL = "https://wn7mxcdxca.execute-api.us-east-2.amazonaws.com/dev"
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
    private let publicPaths = ["/auth/", "/universities/"]

    private struct TokenRefreshRequest: Encodable { let refreshToken: String }
    private struct TokenRefreshResponse: Decodable { let accessToken: String; let idToken: String; let expiresIn: Int }
    
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
        if !isPublic, let token = KeychainWrapper.get(key: "access_token") {
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

        // Auto-refresh on 401
        if httpResponse?.statusCode == 401, !isPublic,
           let refreshToken = KeychainWrapper.get(key: "refresh_token") {
            if let refreshURL = URL(string: "\(baseURL)/auth/refresh") {
                var refreshRequest = URLRequest(url: refreshURL)
                refreshRequest.httpMethod = "POST"
                refreshRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
                let encoder = JSONEncoder()
                refreshRequest.httpBody = try encoder.encode(TokenRefreshRequest(refreshToken: refreshToken))
                if let (refreshData, _) = try? await session.data(for: refreshRequest),
                   let tokens = try? JSONDecoder().decode(TokenRefreshResponse.self, from: refreshData) {
                    KeychainWrapper.set(key: "access_token", value: tokens.accessToken)
                    KeychainWrapper.set(key: "id_token", value: tokens.idToken)
                    // Retry original request with new token
                    request.setValue("Bearer \(tokens.accessToken)", forHTTPHeaderField: "Authorization")
                    (data, response) = try await session.data(for: request)
                    httpResponse = response as? HTTPURLResponse
                }
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
