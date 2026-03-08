import Foundation
import UserNotifications
import UIKit

/// Push notification management
class NotificationService {
    static let shared = NotificationService()

    func requestPermission() async -> Bool {
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .badge, .sound])
            if granted {
                await MainActor.run {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
            return granted
        } catch {
            return false
        }
    }

    /// Register device token with backend
    func registerDeviceToken(_ token: Data) {
        let tokenString = token.map { String(format: "%02x", $0) }.joined()
        print("[Notifications] Device token: \(tokenString)")

        if AppState.devMode {
            print("[Notifications] Dev mode — skipping token registration")
            return
        }

        // TODO: POST token to backend for SNS registration
    }

    /// Schedule a local notification (for dev/testing)
    func scheduleLocalNotification(
        title: String,
        body: String,
        delay: TimeInterval = 5
    ) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: delay, repeats: false)
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request)
    }

    /// Notify when a student comes nearby
    func notifyStudentNearby(name: String, distance: Int) {
        scheduleLocalNotification(
            title: "\(name) is nearby",
            body: "\(distance) ft away on campus",
            delay: 1
        )
    }
}
