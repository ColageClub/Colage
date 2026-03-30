import SwiftUI
import CoreLocation

/// Main home screen — contains the mode picker + Map/List/AR views
struct HomeView: View {
    @Environment(\.themeColor) private var themeColor
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var locationService: LocationService
    @EnvironmentObject var universityService: UniversityService
    @StateObject private var nearbyStudents = NearbyStudentsViewModel()

    /// Sync floor picker selection into the students view model
    private func syncFloorFilter() {
        nearbyStudents.filterFloor = appState.currentFloor
    }

    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()

            // Discovery modes — map stays alive (hidden) to preserve camera state
            ZStack {
                MapDiscoveryView(
                    students: nearbyStudents,
                    allMapStudents: nearbyStudents.mapStudents
                )
                .opacity(appState.activeMode == .map ? 1 : 0)
                .allowsHitTesting(appState.activeMode == .map)

                if appState.activeMode == .list {
                    ListDiscoveryView(students: nearbyStudents)
                }
                if appState.activeMode == .ar {
                    ARDiscoveryView(students: nearbyStudents)
                }
            }

            // Overlay controls
            VStack {
                // Top bar
                HStack {
                    // Visibility toggle
                    VisibilityToggle(isVisible: $appState.isVisible)

                    Spacer()

                    // Mode picker
                    DiscoveryModePicker(activeMode: $appState.activeMode)

                    Spacer()

                    // Own profile button
                    Button {
                        appState.showOwnProfile = true
                    } label: {
                        AvatarView(
                            imageURL: UserProfile.current?.profilePhotoURL,
                            size: 36,
                            borderColor: themeColor
                        )
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // University label
                if let uni = universityService.currentUniversity {
                    HStack(spacing: 6) {
                        Text(uni.name)
                            .font(ColageFonts.captionBold)
                            .foregroundStyle(ColageColors.textSecondary)
                        Circle()
                            .fill(ColageColors.online)
                            .frame(width: 6, height: 6)
                        Text("\(nearbyStudents.students.count) nearby")
                            .font(ColageFonts.caption)
                            .foregroundStyle(ColageColors.textTertiary)
                    }
                    .padding(.top, 4)
                }

                // Stale data banner
                if nearbyStudents.isDataStale, let fetchTime = nearbyStudents.lastFetchTime {
                    StaleDataBanner(lastUpdated: fetchTime)
                        .padding(.top, 4)
                }

                Spacer()
            }

            // Floor picker — left edge
            VStack {
                Spacer()
                HStack {
                    FloorPicker(
                        selectedFloor: $appState.currentFloor,
                        floors: [-2, -1, 1, 2, 3, 4, 5, 6]
                    )
                    .padding(.leading, 12)
                    .onChange(of: appState.currentFloor) { _, newFloor in
                        nearbyStudents.filterFloor = newFloor
                    }
                    Spacer()
                }
                Spacer()
            }
            .padding(.top, 80)

            // Error overlay
            if let errorMsg = nearbyStudents.error, nearbyStudents.students.isEmpty {
                ErrorStateView(
                    title: "Something went wrong",
                    message: errorMsg,
                    retryAction: {
                        nearbyStudents.error = nil
                        let domain = UserProfile.current?.universityDomain ?? ""
                        if let coord = locationService.currentLocation {
                            nearbyStudents.fetchNearbyStudents(
                                latitude: coord.latitude,
                                longitude: coord.longitude,
                                domain: domain
                            )
                        }
                    }
                )
            }

            // Ad banner — bottom of map
            VStack {
                Spacer()
                AdBannerView()
                    .padding(.horizontal, 12)
                    .padding(.bottom, 16)
            }
        }
        .sheet(isPresented: $appState.showOwnProfile) {
            OwnProfileView()
        }
        .onAppear {
            locationService.startTracking()
            nearbyStudents.locationService = locationService

            if AppState.devMode {
                nearbyStudents.loadMockData()
            } else {
                // Connect WebSocket
                let domain = UserProfile.current?.universityDomain ?? ""
                WebSocketManager.shared.connect(universityDomain: domain)

                // Start listening for real-time updates
                nearbyStudents.startListeningForUpdates()

                // Start periodic refresh (every 60s)
                nearbyStudents.startPeriodicRefresh()

                // Fetch initial nearby students once we have GPS
                DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                    if let coord = locationService.currentLocation {
                        nearbyStudents.fetchNearbyStudents(
                            latitude: coord.latitude,
                            longitude: coord.longitude,
                            domain: domain
                        )
                    }
                }
            }

            nearbyStudents.filterFloor = appState.currentFloor
        }
        .onDisappear {
            nearbyStudents.stopListening()
        }
        .onChange(of: appState.isVisible) { _, isVisible in
            if isVisible {
                locationService.startTracking()
            } else {
                locationService.stopTracking()
            }
        }
    }
}

/// Manages nearby student data — fetches from API + receives WebSocket updates
@MainActor class NearbyStudentsViewModel: ObservableObject {
    @Published var students: [NearbyStudent] = []
    @Published var maxDistance: Double = 0.5 // list slider position (0...1), logarithmic
    @Published var arMaxDistance: Double = 0.5 // AR slider position (0...1), logarithmic
    @Published var filterFloor: Int? = nil // nil = all floors
    @Published var error: String?
    @Published var lastFetchTime: Date?

    var isDataStale: Bool {
        guard let lastFetch = lastFetchTime else { return false }
        return Date().timeIntervalSince(lastFetch) > 60 && !WebSocketManager.shared.isConnected
    }

    /// Convert a 0...1 slider position to feet using logarithmic scale
    /// 0 → 10ft, 0.25 → ~30ft, 0.5 → ~60ft, 1.0 → 500ft
    static func sliderToFeet(_ value: Double) -> Double {
        let minFeet = 10.0
        let maxFeet = 500.0
        return minFeet * pow(maxFeet / minFeet, value)
    }

    var listDistanceFeet: Double { Self.sliderToFeet(maxDistance) }
    var arDistanceFeet: Double { Self.sliderToFeet(arMaxDistance) }

    func loadMockData() {
        guard AppState.devMode else { return }
        // UMich campus center coordinates
        let baseLat = 42.2780
        let baseLng = -83.7382
        students = (0..<20).map { i in
            NearbyStudent.mock(index: i, baseLat: baseLat, baseLng: baseLng)
        }
    }

    // MARK: - Real Data

    /// Fetch nearby students from the API
    func fetchNearbyStudents(latitude: Double, longitude: Double, domain: String) {
        Task {
            do {
                struct NearbyResponse: Decodable {
                    let students: [NearbyStudentResponse]
                    struct NearbyStudentResponse: Decodable {
                        let profile: ProfileData
                        let location: LocationData
                        let distance: Double
                        struct ProfileData: Decodable {
                            let userId: String
                            let displayName: String?
                            let profilePhotoURL: String?
                            let bio: String?
                            let major: String?
                            let socialLinks: [SocialLink]?
                            let isVisible: Bool?
                        }
                        struct LocationData: Decodable {
                            let latitude: Double
                            let longitude: Double
                            let altitude: Double?
                            let floor: Int?
                            let timestamp: String?
                        }
                    }
                }

                let path = "/nearby?domain=\(domain)&lat=\(latitude)&lng=\(longitude)&maxDistance=5000"
                let response: NearbyResponse = try await APIClient.shared.request(method: "GET", path: path)

                let nearbyStudents = response.students.compactMap { s -> NearbyStudent? in
                    let profile = UserProfile(
                        userId: s.profile.userId,
                        universityDomain: domain,
                        displayName: s.profile.displayName ?? "Student",
                        profilePhotoURL: s.profile.profilePhotoURL,
                        bio: s.profile.bio,
                        major: s.profile.major,
                        socialLinks: s.profile.socialLinks ?? [],
                        isVisible: s.profile.isVisible ?? true,
                        serverType: .student,
                        createdAt: Date(),
                        updatedAt: Date()
                    )
                    let location = StudentLocation(
                        userId: s.profile.userId,
                        latitude: s.location.latitude,
                        longitude: s.location.longitude,
                        altitude: s.location.altitude ?? 0,
                        floor: s.location.floor ?? 1,
                        timestamp: Date()
                    )
                    // Don't include self
                    guard s.profile.userId != UserProfile.current?.userId else { return nil }
                    return NearbyStudent(profile: profile, location: location, distance: s.distance)
                }

                await MainActor.run {
                    self.students = nearbyStudents
                    self.lastFetchTime = Date()
                    self.error = nil
                }
            } catch {
                print("[Nearby] Failed to fetch: \(error)")
                await MainActor.run {
                    self.error = "Couldn't load nearby students. Check your connection."
                }
            }
        }
    }

    /// The location service used for distance calculations and periodic refresh
    weak var locationService: LocationService?

    private var refreshTask: Task<Void, Never>?

    /// Wire WebSocket callbacks for real-time updates
    func startListeningForUpdates() {
        WebSocketManager.shared.onStudentJoined = { [weak self] location in
            self?.handleLocationUpdate(location)
        }
        WebSocketManager.shared.onStudentLeft = { [weak self] userId in
            self?.students.removeAll { $0.profile.userId == userId }
        }
        WebSocketManager.shared.onLocationUpdate = { [weak self] locations in
            for location in locations {
                self?.handleLocationUpdate(location)
            }
        }
        WebSocketManager.shared.onReconnect = { [weak self] in
            self?.refreshNearby()
        }
    }

    /// Start periodic refresh — re-fetches nearby students every 60 seconds
    func startPeriodicRefresh() {
        refreshTask?.cancel()
        refreshTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 60_000_000_000) // 60s
                guard !Task.isCancelled else { break }
                self?.refreshNearby()
            }
        }
    }

    /// Re-fetch nearby students using the current GPS position
    private func refreshNearby() {
        guard let coord = locationService?.currentLocation else { return }
        let domain = UserProfile.current?.universityDomain ?? ""
        fetchNearbyStudents(latitude: coord.latitude, longitude: coord.longitude, domain: domain)
    }

    /// Handle an incoming location update from WebSocket
    private func handleLocationUpdate(_ location: StudentLocation) {
        // Don't track self
        guard location.userId != UserProfile.current?.userId else { return }

        // Calculate distance from user's current location
        let distance: Double
        if let userCoord = locationService?.currentLocation {
            let userCL = CLLocation(latitude: userCoord.latitude, longitude: userCoord.longitude)
            let studentCL = CLLocation(latitude: location.latitude, longitude: location.longitude)
            let meters = userCL.distance(from: studentCL)
            distance = meters * 3.28084 // convert to feet
        } else {
            distance = 0
        }

        if let index = students.firstIndex(where: { $0.profile.userId == location.userId }) {
            // Update existing student's location and distance
            students[index].location = location
            students[index].distance = distance
        } else {
            // New student — create with minimal profile info
            // The WebSocket broadcast now includes displayName/profilePhotoURL
            let profile = UserProfile(
                userId: location.userId,
                universityDomain: UserProfile.current?.universityDomain ?? "",
                displayName: location.displayName ?? "Student",
                profilePhotoURL: location.profilePhotoURL,
                bio: nil,
                major: location.major,
                socialLinks: [],
                isVisible: true,
                serverType: .student,
                createdAt: Date(),
                updatedAt: Date()
            )
            students.append(NearbyStudent(profile: profile, location: location, distance: distance))
        }
    }

    func stopListening() {
        WebSocketManager.shared.onStudentJoined = nil
        WebSocketManager.shared.onStudentLeft = nil
        WebSocketManager.shared.onLocationUpdate = nil
        WebSocketManager.shared.onReconnect = nil
        refreshTask?.cancel()
        refreshTask = nil
    }

    /// All students on the selected floor (no distance limit) — used by Map
    var mapStudents: [NearbyStudent] {
        students.filter { student in
            filterFloor == nil || student.location.floor == filterFloor
        }
        .sorted { $0.distance < $1.distance }
    }

    /// Map students + self marker
    func mapStudentsWithSelf(location: LocationService) -> [NearbyStudent] {
        var result = mapStudents
        if let profile = UserProfile.current,
           let coord = location.currentLocation {
            let selfStudent = NearbyStudent(
                profile: profile,
                location: StudentLocation(
                    userId: profile.userId,
                    latitude: coord.latitude,
                    longitude: coord.longitude,
                    altitude: location.currentAltitude,
                    floor: location.currentFloor,
                    timestamp: Date()
                ),
                distance: 0
            )
            result.insert(selfStudent, at: 0)
        }
        return result
    }

    /// Distance + floor filtered students — used by List
    var filteredStudents: [NearbyStudent] {
        students.filter { student in
            student.distance <= listDistanceFeet &&
            (filterFloor == nil || student.location.floor == filterFloor)
        }
        .sorted { $0.distance < $1.distance }
    }

    /// AR-specific filtered students (own radius + floor)
    var arFilteredStudents: [NearbyStudent] {
        students.filter { student in
            student.distance <= arDistanceFeet &&
            (filterFloor == nil || student.location.floor == filterFloor)
        }
        .sorted { $0.distance < $1.distance }
    }
}

#Preview {
    HomeView()
        .environmentObject(AppState())
        .environmentObject(LocationService())
        .environmentObject(UniversityService())
}
