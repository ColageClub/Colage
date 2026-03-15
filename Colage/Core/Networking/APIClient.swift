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

        var errorDescription: String? {
            switch self {
            case .invalidURL: return "Invalid URL"
            case .noData: return "No data received"
            case .decodingError: return "Failed to decode response"
            case .serverError(let code, let msg): return "Server error \(code): \(msg ?? "Unknown")"
            case .networkError(let err): return err.localizedDescription
            }
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

        // Attach JWT if available
        if let token = KeychainWrapper.get(key: "access_token") {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            request.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.noData
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let message = String(data: data, encoding: .utf8)
            throw APIError.serverError(httpResponse.statusCode, message)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(T.self, from: data)
    }
}
