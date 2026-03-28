import Foundation
import CoreLocation

/// Fetches ads from the real backend, falls back to mock data in dev mode
class AdService: ObservableObject {
    static let shared = AdService()

    @Published var currentAd: AdData?
    @Published var isLoading = false

    private var ads: [AdData] = []
    private var currentIndex = 0

    private let baseURL = "https://main.dcinq8hq6li09.amplifyapp.com"

    /// Fetch an ad from the server for the given school
    func fetchAd(school: String, studentId: String, userLocation: CLLocationCoordinate2D? = nil) async {
        print("[AdService] Fetching ad for school=\(school) student=\(studentId)")
        await MainActor.run { isLoading = true }

        do {
            let urlStr = "\(baseURL)/api/ads/serve?school=\(school)&student_id=\(studentId)"
            guard let url = URL(string: urlStr) else {
                print("[AdService] Invalid URL: \(urlStr)")
                return
            }
            let (data, response) = try await URLSession.shared.data(from: url)
            let httpResponse = response as? HTTPURLResponse
            print("[AdService] Response: \(httpResponse?.statusCode ?? 0), bytes: \(data.count)")

            let decoded = try JSONDecoder().decode(AdServeResponse.self, from: data)

            await MainActor.run {
                if var ad = decoded.ad {
                    print("[AdService] Got ad: \(ad.businessName) (\(ad.id))")
                    // Calculate distance if we have user location and ad location
                    if let userLoc = userLocation, let lat = ad.lat, let lng = ad.lng, lat != 0, lng != 0 {
                        let adLoc = CLLocation(latitude: lat, longitude: lng)
                        let userCL = CLLocation(latitude: userLoc.latitude, longitude: userLoc.longitude)
                        let meters = userCL.distance(from: adLoc)
                        let miles = meters / 1609.34
                        ad.distance = String(format: "%.1f mi", miles)
                    }
                    currentAd = ad
                    if !ads.contains(where: { $0.id == ad.id }) {
                        ads.append(ad)
                    }
                } else {
                    print("[AdService] Server returned no ad")
                }
                isLoading = false
            }
        } catch {
            print("[AdService] Fetch failed: \(error)")
            if let data = try? await URLSession.shared.data(from: URL(string: "\(baseURL)/api/ads/serve?school=\(school)&student_id=\(studentId)")!) {
                print("[AdService] Raw response: \(String(data: data.0, encoding: .utf8) ?? "nil")")
            }
            await MainActor.run { isLoading = false }
        }
    }

    /// Track a tap on an ad
    func trackTap(adId: String, studentId: String) async {
        guard let url = URL(string: "\(baseURL)/api/ads/serve") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONEncoder().encode(["adId": adId, "studentId": studentId, "action": "tap"])
        _ = try? await URLSession.shared.data(for: request)
    }

    /// Fetch next ad (rotate)
    func rotateAd(school: String, studentId: String, userLocation: CLLocationCoordinate2D? = nil) {
        print("[AdService] Rotate triggered for school=\(school)")
        Task {
            await fetchAd(school: school, studentId: studentId, userLocation: userLocation)
        }
    }
}

struct AdServeResponse: Codable {
    let ad: AdData?
}
