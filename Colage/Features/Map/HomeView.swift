import SwiftUI

/// Main home screen — contains the mode picker + Map/List/AR views
struct HomeView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var locationService: LocationService
    @EnvironmentObject var universityService: UniversityService
    @StateObject private var nearbyStudents = NearbyStudentsViewModel()

    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()

            // Active discovery mode
            Group {
                switch appState.activeMode {
                case .map:
                    MapDiscoveryView(students: nearbyStudents)
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
                        floors: Array(-1...5)
                    )
                    .padding(.leading, 12)
                    Spacer()
                }
                Spacer()
            }
            .padding(.top, 80)
        }
        .sheet(isPresented: $appState.showOwnProfile) {
            OwnProfileView()
        }
        .onAppear {
            locationService.startTracking()
            nearbyStudents.loadMockData()
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
    @Published var maxDistance: Double = 300 // feet

    func loadMockData() {
        guard AppState.devMode else { return }
        // UMich campus center coordinates
        let baseLat = 42.2780
        let baseLng = -83.7382
        students = (0..<20).map { i in
            NearbyStudent.mock(index: i, baseLat: baseLat, baseLng: baseLng)
        }
    }

    var filteredStudents: [NearbyStudent] {
        students.filter { $0.distance <= maxDistance }
            .sorted { $0.distance < $1.distance }
    }
}

#Preview {
    HomeView()
        .environmentObject(AppState())
        .environmentObject(LocationService())
        .environmentObject(UniversityService())
}
