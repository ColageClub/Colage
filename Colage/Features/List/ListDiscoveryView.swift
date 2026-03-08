import SwiftUI

/// List discovery view — 2-column grid with distance slider
struct ListDiscoveryView: View {
    @ObservedObject var students: NearbyStudentsViewModel
    @EnvironmentObject var appState: AppState
    @State private var selectedStudent: NearbyStudent?

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    var body: some View {
        VStack(spacing: 0) {
            Spacer().frame(height: 100) // Space for top controls

            // Distance slider
            DistanceSlider(distance: $students.maxDistance)
                .padding(.horizontal, 24)
                .padding(.bottom, 16)

            // Student grid
            ScrollView {
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(students.filteredStudents) { student in
                        StudentCard(student: student)
                            .onTapGesture {
                                selectedStudent = student
                            }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 100)
            }
        }
        .sheet(item: $selectedStudent) { student in
            FullProfileView(student: student)
        }
    }
}

/// Distance slider with logarithmic scale
struct DistanceSlider: View {
    @Binding var distance: Double

    // Logarithmic: 2ft to 2640ft (0.5 mile)
    private let minLog = log(2.0)
    private let maxLog = log(2640.0)

    private var sliderValue: Double {
        get { (log(distance) - minLog) / (maxLog - minLog) }
        nonmutating set { }
    }

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Text("Distance")
                    .font(ColageFonts.captionBold)
                    .foregroundStyle(ColageColors.textSecondary)
                Spacer()
                Text(distanceLabel)
                    .font(ColageFonts.monoSmall)
                    .foregroundStyle(ColageColors.primary)
            }

            Slider(
                value: Binding(
                    get: { (log(distance) - minLog) / (maxLog - minLog) },
                    set: { distance = exp(minLog + $0 * (maxLog - minLog)) }
                ),
                in: 0...1
            )
            .tint(ColageColors.primary)
        }
    }

    private var distanceLabel: String {
        if distance < 100 {
            return "\(Int(distance)) ft"
        } else if distance < 5280 {
            return String(format: "%.0f ft", distance)
        } else {
            return String(format: "%.1f mi", distance / 5280)
        }
    }
}

/// Student card for grid
struct StudentCard: View {
    let student: NearbyStudent

    var body: some View {
        VStack(spacing: 10) {
            // Profile photo
            AvatarView(
                imageURL: student.profile.profilePhotoURL,
                size: 64
            )

            // Name
            Text(student.profile.displayName)
                .font(ColageFonts.bodyBold)
                .foregroundStyle(ColageColors.textPrimary)
                .lineLimit(1)

            // Distance
            Text(formatDistance(student.distance))
                .font(ColageFonts.monoSmall)
                .foregroundStyle(ColageColors.textSecondary)

            // Social icons
            HStack(spacing: 6) {
                ForEach(student.profile.socialLinks.prefix(5)) { link in
                    Image(systemName: link.platform.iconName)
                        .font(.system(size: 12))
                        .foregroundStyle(ColageColors.primary)
                }
            }
        }
        .padding(.vertical, 16)
        .frame(maxWidth: .infinity)
        .background(ColageColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func formatDistance(_ feet: Double) -> String {
        if feet < 100 {
            return "\(Int(feet)) ft"
        } else {
            return String(format: "%.0f ft", feet)
        }
    }
}

#Preview {
    ListDiscoveryView(students: {
        let vm = NearbyStudentsViewModel()
        vm.loadMockData()
        return vm
    }())
    .environmentObject(AppState())
}
