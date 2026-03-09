import SwiftUI

/// List discovery mode — 2-column grid sorted by distance with distance slider
struct ListDiscoveryView: View {
    @ObservedObject var students: NearbyStudentsViewModel
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var universityService: UniversityService
    @State private var selectedStudent: NearbyStudent?

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                // Distance slider
                VStack(spacing: 8) {
                    HStack {
                        Text("Within")
                            .font(ColageFonts.caption)
                            .foregroundStyle(ColageColors.textSecondary)
                        Spacer()
                        Text(distanceLabel)
                            .font(ColageFonts.monoSmall)
                            .foregroundStyle(universityService.currentTheme?.primary ?? ColageColors.primary)
                    }

                    Slider(
                        value: $students.maxDistance,
                        in: 50...5000,
                        step: 50
                    )
                    .tint(universityService.currentTheme?.primary ?? ColageColors.primary)
                }
                .padding(.horizontal, 20)
                .padding(.top, 80)
                .padding(.bottom, 12)

                // Floor filter
                HStack(spacing: 8) {
                    FloorFilterChip(
                        label: "All Floors",
                        isSelected: students.filterFloor == nil,
                        action: { students.filterFloor = nil }
                    )

                    FloorFilterChip(
                        label: "Floor \(appState.currentFloor)",
                        isSelected: students.filterFloor == appState.currentFloor,
                        action: { students.filterFloor = appState.currentFloor }
                    )

                    Spacer()

                    Text("\(students.filteredStudents.count) nearby")
                        .font(ColageFonts.caption)
                        .foregroundStyle(ColageColors.textTertiary)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 12)

                // Student grid
                if students.filteredStudents.isEmpty {
                    Spacer()
                    VStack(spacing: 12) {
                        Image(systemName: "person.slash")
                            .font(.system(size: 40))
                            .foregroundStyle(ColageColors.textTertiary)
                        Text("No students within range")
                            .font(ColageFonts.body)
                            .foregroundStyle(ColageColors.textSecondary)
                        Text("Try increasing the distance")
                            .font(ColageFonts.caption)
                            .foregroundStyle(ColageColors.textTertiary)
                    }
                    Spacer()
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 12) {
                            ForEach(students.filteredStudents) { student in
                                StudentCard(
                                    student: student,
                                    themeColor: universityService.currentTheme?.primary ?? ColageColors.primary
                                )
                                .onTapGesture {
                                    selectedStudent = student
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 100)
                    }
                }
            }
        }
        .sheet(item: $selectedStudent) { student in
            MiniProfileSheet(student: student)
                .presentationDetents([.fraction(0.35), .large])
                .presentationDragIndicator(.visible)
                .presentationBackgroundInteraction(.enabled)
        }
    }

    private var distanceLabel: String {
        students.maxDistance.formattedDistance
    }
}

// MARK: - Student Card

struct StudentCard: View {
    let student: NearbyStudent
    let themeColor: Color

    var body: some View {
        VStack(spacing: 10) {
            // Avatar
            AvatarView(
                imageURL: student.profile.profilePhotoURL,
                size: 72,
                borderColor: themeColor,
                initials: student.profile.displayName.initials
            )

            // Name
            Text(student.profile.displayName)
                .font(ColageFonts.bodyBold)
                .foregroundStyle(ColageColors.textPrimary)
                .lineLimit(1)

            // Major
            if let major = student.profile.major {
                Text(major)
                    .font(ColageFonts.caption)
                    .foregroundStyle(ColageColors.textSecondary)
                    .lineLimit(1)
            }

            // Distance + Floor
            HStack(spacing: 6) {
                Image(systemName: "location.fill")
                    .font(.system(size: 10))
                    .foregroundStyle(themeColor)
                Text(student.distance.formattedDistance)
                    .font(ColageFonts.monoSmall)
                    .foregroundStyle(ColageColors.textSecondary)

                if student.location.floor > 1 {
                    Text("· F\(student.location.floor)")
                        .font(ColageFonts.monoSmall)
                        .foregroundStyle(ColageColors.textTertiary)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .padding(.horizontal, 12)
        .background(ColageColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .strokeBorder(ColageColors.border, lineWidth: 0.5)
        )
    }

    // Using Double.formattedDistance extension
}

// MARK: - Floor Filter Chip

struct FloorFilterChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(ColageFonts.captionBold)
                .foregroundStyle(isSelected ? ColageColors.textPrimary : ColageColors.textTertiary)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? ColageColors.primary.opacity(0.2) : ColageColors.surface)
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .strokeBorder(isSelected ? ColageColors.primary.opacity(0.4) : ColageColors.border, lineWidth: 1)
                )
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
    .environmentObject(UniversityService())
}
