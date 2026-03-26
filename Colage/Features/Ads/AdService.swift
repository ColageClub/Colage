import Foundation

/// Fetches ads from the server, falls back to mock data in dev mode
class AdService: ObservableObject {
    @Published var currentAd: AdData?
    @Published var isLoading = false

    private var ads: [AdData] = []
    private var currentIndex = 0

    private let mockAds: [AdData] = [
        AdData(id: "ad-1", businessName: "Blue Brew Coffee", bio: "Student-favorite coffee shop since 2019",
               deal: "15% off any drink — show this ad", logoEmoji: "☕", logoUrl: nil, distance: "0.2 mi"),
        AdData(id: "ad-2", businessName: "Campus Pizza Co.", bio: "Late night slices, every night",
               deal: "Free garlic knots with any large pizza", logoEmoji: "🍕", logoUrl: nil, distance: "0.4 mi"),
        AdData(id: "ad-3", businessName: "FitZone Gym", bio: "24/7 gym, 1 block from campus",
               deal: "First month free for students", logoEmoji: "🏋️", logoUrl: nil, distance: "0.3 mi"),
        AdData(id: "ad-4", businessName: "BookStack", bio: "Used textbooks at 60% off retail",
               deal: "Extra 10% off with .edu email", logoEmoji: "📚", logoUrl: nil, distance: "0.1 mi"),
    ]

    /// Fetch an ad from the server for the given school
    func fetchAd(school: String, studentId: String) async {
        // Dev mode: use mock data
        if AppState.devMode {
            await MainActor.run {
                if ads.isEmpty { ads = mockAds }
                currentAd = ads.first
            }
            return
        }

        await MainActor.run { isLoading = true }

        do {
            guard let url = URL(string: "https://api.colageclub.com/api/ads/serve?school=\(school)&student_id=\(studentId)") else { return }
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(AdServeResponse.self, from: data)

            await MainActor.run {
                if let ad = response.ad {
                    currentAd = ad
                    if !ads.contains(where: { $0.id == ad.id }) {
                        ads.append(ad)
                    }
                }
                isLoading = false
            }
        } catch {
            print("[AdService] Fetch failed: \(error). Using mock data.")
            await MainActor.run {
                if ads.isEmpty { ads = mockAds }
                currentAd = ads.first
                isLoading = false
            }
        }
    }

    /// Track a tap on an ad
    func trackTap(adId: String, studentId: String) async {
        guard !AppState.devMode else { return }
        guard let url = URL(string: "https://api.colageclub.com/api/ads/serve") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONEncoder().encode(["adId": adId, "studentId": studentId, "action": "tap"])
        _ = try? await URLSession.shared.data(for: request)
    }

    /// Rotate to next ad
    func rotateAd() {
        guard !ads.isEmpty else { return }
        currentIndex = (currentIndex + 1) % ads.count
        currentAd = ads[currentIndex]
    }
}

struct AdServeResponse: Codable {
    let ad: AdData?
}
