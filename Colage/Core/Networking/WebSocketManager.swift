import Foundation

/// WebSocket manager for real-time location updates with auto-reconnection
class WebSocketManager: ObservableObject {
    static let shared = WebSocketManager()

    @Published var isConnected = false

    private var webSocketTask: URLSessionWebSocketTask?
    private var session: URLSession
    private var pingTimer: Timer?
    private var reconnectTimer: Timer?
    private var reconnectAttempts = 0
    private var currentDomain: String?
    private var shouldReconnect = false
    private let maxReconnectAttempts = 10

    var onLocationUpdate: (([StudentLocation]) -> Void)?
    var onStudentJoined: ((StudentLocation) -> Void)?
    var onStudentLeft: ((String) -> Void)?

    private init() {
        self.session = URLSession(configuration: .default)
    }

    func connect(universityDomain: String) {
        guard !AppState.devMode else {
            isConnected = true
            return
        }

        currentDomain = universityDomain
        shouldReconnect = true
        reconnectAttempts = 0
        performConnect()
    }

    private func performConnect() {
        guard let domain = currentDomain else { return }
        let userId = UserProfile.current?.userId ?? "anonymous"
        guard let url = URL(string: "wss://w0m7jw00ak.execute-api.us-east-2.amazonaws.com/dev?domain=\(domain)&userId=\(userId)") else { return }

        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        DispatchQueue.main.async { self.isConnected = true }
        reconnectAttempts = 0
        receiveMessage()
        startPing()
    }

    func disconnect() {
        shouldReconnect = false
        reconnectTimer?.invalidate()
        reconnectTimer = nil
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        webSocketTask = nil
        DispatchQueue.main.async { self.isConnected = false }
        pingTimer?.invalidate()
    }

    /// Reconnect with exponential backoff
    private func scheduleReconnect() {
        guard shouldReconnect, reconnectAttempts < maxReconnectAttempts else {
            print("[WS] Max reconnect attempts reached or reconnection disabled")
            return
        }

        reconnectAttempts += 1
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s cap
        let delay = min(pow(2.0, Double(reconnectAttempts - 1)), 30.0)
        print("[WS] Reconnecting in \(delay)s (attempt \(reconnectAttempts)/\(maxReconnectAttempts))")

        reconnectTimer = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { [weak self] _ in
            self?.performConnect()
        }
    }

    func sendLocationUpdate(_ location: StudentLocation) {
        guard !AppState.devMode else { return }

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        guard let data = try? encoder.encode(location),
              let json = String(data: data, encoding: .utf8) else { return }

        let message = URLSessionWebSocketTask.Message.string(
            "{\"action\":\"location.update\",\"data\":\(json)}"
        )
        webSocketTask?.send(message) { _ in }
    }

    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.handleMessage(text)
                default:
                    break
                }
                self?.receiveMessage() // Continue listening
            case .failure:
                DispatchQueue.main.async { self?.isConnected = false }
                self?.scheduleReconnect()
            }
        }
    }

    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let action = json["action"] as? String else { return }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        switch action {
        case "location.update":
            if let payload = json["data"],
               let payloadData = try? JSONSerialization.data(withJSONObject: payload),
               let location = try? decoder.decode(StudentLocation.self, from: payloadData) {
                DispatchQueue.main.async {
                    self.onStudentJoined?(location)
                }
            }
        case "location.batch":
            if let payload = json["data"],
               let payloadData = try? JSONSerialization.data(withJSONObject: payload),
               let locations = try? decoder.decode([StudentLocation].self, from: payloadData) {
                DispatchQueue.main.async {
                    self.onLocationUpdate?(locations)
                }
            }
        case "student.joined":
            if let payload = json["data"],
               let payloadData = try? JSONSerialization.data(withJSONObject: payload),
               let student = try? decoder.decode(StudentLocation.self, from: payloadData) {
                DispatchQueue.main.async {
                    self.onStudentJoined?(student)
                }
            }
        case "student.left":
            if let userId = (json["data"] as? [String: Any])?["userId"] as? String {
                DispatchQueue.main.async {
                    self.onStudentLeft?(userId)
                }
            }
        default:
            break
        }
    }

    private func startPing() {
        pingTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.webSocketTask?.sendPing { error in
                if error != nil {
                    DispatchQueue.main.async { self?.isConnected = false }
                    self?.pingTimer?.invalidate()
                    self?.scheduleReconnect()
                }
            }
        }
    }
}
