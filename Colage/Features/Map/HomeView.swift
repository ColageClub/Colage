import SwiftUI

/// Main home screen — contains the mode picker + Map/List/AR views
struct HomeView: View {
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

            // Active discovery mode
            Group {
                switch appState.activeMode {
                case .map:
                    MapDiscoveryView(
                        students: nearbyStudents,
                        allMapStudents: nearbyStudents.mapStudentsWithSelf(location: locationService)
                    )
                case .list:
                    ListDiscoveryView(students: nearbyStudents)
                case .ar:
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
                            borderColor: universityService.currentTheme?.primary ?? ColageColors.primary
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
            nearbyStudents.loadMockData()
            nearbyStudents.filterFloor = appState.currentFloor
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

/// Manages nearby student data (mock for now)
class NearbyStudentsViewModel: ObservableObject {
    @Published var students: [NearbyStudent] = []
    @Published var maxDistance: Double = 0.5 // list slider position (0...1), logarithmic
    @Published var arMaxDistance: Double = 0.5 // AR slider position (0...1), logarithmic
    @Published var filterFloor: Int? = nil // nil = all floors

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
