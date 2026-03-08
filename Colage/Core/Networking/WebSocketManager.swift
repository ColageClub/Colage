import Foundation

/// WebSocket manager for real-time location updates
class WebSocketManager: ObservableObject {
    static let shared = WebSocketManager()

    @Published var isConnected = false

    private var webSocketTask: URLSessionWebSocketTask?
    private var session: URLSession
    private var pingTimer: Timer?

    var onLocationUpdate: (([StudentLocation]) -> Void)?
    var onStudentJoined: ((StudentLocation) -> Void)?
    var onStudentLeft: ((String) -> Void)?

    private init() {
        self.session = URLSession(configuration: .default)
    }

    func connect(universityDomain: String) {
        guard !AppState.devMode else {
            // In dev mode, simulate WebSocket with mock data
            isConnected = true
            return
        }

        // Will be replaced with real WebSocket API Gateway URL
        guard let url = URL(string: "wss://ws.colage.app?domain=\(universityDomain)") else { return }

        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        isConnected = true
        receiveMessage()
        startPing()
    }

    func disconnect() {
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        webSocketTask = nil
        isConnected = false
        pingTimer?.invalidate()
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
                self?.isConnected = false
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
                    self?.isConnected = false
                }
            }
        }
    }
}
