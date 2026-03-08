import Foundation

/// Mapbox configuration — token loaded from Info.plist (MBXAccessToken)
enum MapboxConfig {
    static let accessToken: String = {
        Bundle.main.object(forInfoDictionaryKey: "MBXAccessToken") as? String ?? ""
    }()
}
