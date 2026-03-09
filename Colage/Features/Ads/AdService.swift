import SwiftUI

/// Ad data model
struct AdData: Identifiable, Equatable {
    let id: String
    let businessName: String
    let bio: String
    let deal: String
    let logoEmoji: String
    let logoUrl: String?
    let distance: String

    static func == (lhs: AdData, rhs: AdData) -> Bool {
        lhs.id == rhs.id
    }
}

/// Ad service — fetches and rotates ads for the current school
class AdService: ObservableObject {
    static let shared = AdService()

    @Published var currentAd: AdData?
    @Published var isLoading = false

    private var rotationTimer: Timer?
    private var ads: [AdData] = []
    private var currentIndex = 0

    init() {
        if AppState.devMode {
            loadMockAds()
        }
    }

    // MARK: - Mock Data (Dev Mode)

    private func loadMockAds() {
        ads = [
            AdData(
                id: "ad-1",
                businessName: "Blue Brew Coffee",
                bio: "Student-favorite coffee shop since 2019",
                deal: "15% off any drink — show this ad",
                logoEmoji: "☕",
                logoUrl: nil,
                distance: "0.2 mi"
            ),
            AdData(
                id: "ad-2",
                businessName: "Campus Pizza Co.",
                bio: "Late night slices, every night",
                deal: "Free garlic knots with any large pizza",
                logoEmoji: "🍕",
                logoUrl: nil,
                distance: "0.4 mi"
            ),
            AdData(
                id: "ad-3",
                businessName: "FitZone Gym",
                bio: "24/7 gym, 1 block from campus",
                deal: "First month free for students",
                logoEmoji: "🏋️",
                logoUrl: nil,
                distance: "0.3 mi"
            ),
            AdData(
                id: "ad-4",
                businessName: "BookStack",
                bio: "Used textbooks at 60% off retail",
                deal: "Extra 10% off with .edu email",
                logoEmoji: "📚",
                logoUrl: nil,
                distance: "0.1 mi"
            ),
        ]
    }

    // MARK: - Fetch & Rotate

    func fetchAd() {
        if AppState.devMode {
            if ads.isEmpty { loadMockAds() }
            print("[AdService] fetchAd called, \(ads.count) ads available")
            DispatchQueue.main.async { [weak self] in
                self?.currentAd = self?.ads.first
            }
            startRotation()
            return
        }

        // TODO: GET /api/ads/serve?school=\(domain)
        // Parse response and set currentAd
    }

    func startRotation() {
        rotationTimer?.invalidate()
        rotationTimer = Timer.scheduledTimer(withTimeInterval: 15, repeats: true) { [weak self] _ in
            self?.rotateAd()
        }
    }

    func stopRotation() {
        rotationTimer?.invalidate()
        rotationTimer = nil
    }

    private func rotateAd() {
        guard !ads.isEmpty else { return }
        currentIndex = (currentIndex + 1) % ads.count

        // Weighted rotation would happen server-side
        // Client just calls fetchAd() again in production
        if AppState.devMode {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                currentAd = ads[currentIndex]
            }
        } else {
            fetchAd()
        }
    }

    // MARK: - Tracking

    func trackTap(adId: String) {
        if AppState.devMode {
            print("[AdService] Tap tracked: \(adId)")
            return
        }

        // TODO: POST /api/ads/serve { adId, action: "tap" }
    }

    func trackImpression(adId: String) {
        if AppState.devMode {
            print("[AdService] Impression tracked: \(adId)")
            return
        }

        // TODO: POST /api/ads/serve { adId, action: "impression" }
    }
}
