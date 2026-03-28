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
        await MainActor.run { isLoading = true }

        do {
            guard let url = URL(string: "\(baseURL)/api/ads/serve?school=\(school)&student_id=\(studentId)") else { return }
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(AdServeResponse.self, from: data)

            await MainActor.run {
                if var ad = response.ad {
                    // Calculate distance if we have user location and ad location
                    if let userLoc = userLocation, ad.lat != 0, ad.lng != 0 {
                        let adLoc = CLLocation(latitude: ad.lat ?? 0, longitude: ad.lng ?? 0)
                        let userCL = CLLocation(latitude: userLoc.latitude, longitude: userLoc.longitude)
                        let meters = userCL.distance(from: adLoc)
                        let miles = meters / 1609.34
                        ad.distance = String(format: "%.1f mi", miles)
                    }
                    currentAd = ad
                    if !ads.contains(where: { $0.id == ad.id }) {
                        ads.append(ad)
                    }
                }
                isLoading = false
            }
        } catch {
            print("[AdService] Fetch failed: \(error)")
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
        Task {
            await fetchAd(school: school, studentId: studentId, userLocation: userLocation)
        }
    }
}

struct AdServeResponse: Codable {
    let ad: AdData?
}
