import SwiftUI
import ARKit
import RealityKit

/// AR discovery mode — floating name bubbles in camera view
/// Falls back to a simulated view in the simulator
struct ARDiscoveryView: View {
    @ObservedObject var students: NearbyStudentsViewModel
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var universityService: UniversityService
    @State private var selectedStudent: NearbyStudent?

    var body: some View {
        ZStack {
            #if targetEnvironment(simulator)
            // Simulator fallback — mock AR view
            SimulatedARView(
                students: students.arFilteredStudents,
                themeColor: universityService.currentTheme?.primary ?? ColageColors.primary,
                onStudentTapped: { student in
                    selectedStudent = student
                }
            )
            #else
            // Real device — ARKit session
            LiveARView(
                students: students.arFilteredStudents,
                themeColor: universityService.currentTheme?.primary ?? ColageColors.primary,
                onStudentTapped: { student in
                    selectedStudent = student
                }
            )
            #endif

            // AR overlay UI
            VStack {
                Spacer()

                // AR radius slider
                VStack(spacing: 8) {
                    HStack {
                        Text("AR Range")
                            .font(ColageFonts.caption)
                            .foregroundStyle(ColageColors.textSecondary)
                        Spacer()
                        Text(students.arDistanceFeet.formattedDistance)
                            .font(ColageFonts.monoSmall)
                            .foregroundStyle(universityService.currentTheme?.primary ?? ColageColors.primary)
                    }

                    Slider(
                        value: $students.arMaxDistance,
                        in: 0...1
                    )
                    .tint(universityService.currentTheme?.primary ?? ColageColors.primary)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal, 16)

                // Bottom info bar
                HStack(spacing: 16) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(ColageColors.online)
                            .frame(width: 8, height: 8)
                        Text("\(students.arFilteredStudents.count) visible")
                            .font(ColageFonts.captionBold)
                            .foregroundStyle(ColageColors.textPrimary)
                    }

                    Spacer()

                    Text("Floor \(appState.currentFloor)")
                        .font(ColageFonts.monoSmall)
                        .foregroundStyle(ColageColors.textSecondary)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal, 16)
                .padding(.bottom, 100)
            }
        }
        .sheet(item: $selectedStudent) { student in
            MiniProfileSheet(student: student)
                .presentationDetents([.fraction(0.35), .large])
                .presentationDragIndicator(.visible)
                .presentationBackgroundInteraction(.enabled)
        }
    }
}

// MARK: - Simulator Fallback

struct SimulatedARView: View {
    let students: [NearbyStudent]
    let themeColor: Color
    let onStudentTapped: (NearbyStudent) -> Void

    @State private var bubbleOffsets: [String: CGPoint] = [:]

    var body: some View {
        GeometryReader { geo in
            ZStack {
                // Dark background simulating camera
                LinearGradient(
                    colors: [Color(hex: "1a1a2e"), Color(hex: "0a0a1a")],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()

                // Grid lines for AR effect
                ForEach(0..<8, id: \.self) { i in
                    Rectangle()
                        .fill(Color.white.opacity(0.03))
                        .frame(height: 1)
                        .offset(y: CGFloat(i) * geo.size.height / 8 - geo.size.height / 2)
                }
                ForEach(0..<6, id: \.self) { i in
                    Rectangle()
                        .fill(Color.white.opacity(0.03))
                        .frame(width: 1)
                        .offset(x: CGFloat(i) * geo.size.width / 6 - geo.size.width / 2)
                }

                // "AR" label
                VStack {
                    HStack {
                        Label("SIMULATOR", systemImage: "camera.viewfinder")
                            .font(ColageFonts.captionBold)
                            .foregroundStyle(ColageColors.textTertiary)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(.ultraThinMaterial)
                            .clipShape(Capsule())
                        Spacer()
                    }
                    .padding(.leading, 16)
                    .padding(.top, 90)
                    Spacer()
                }

                // Floating bubbles
                ForEach(students.prefix(10)) { student in
                    let offset = bubbleOffset(for: student, in: geo.size)
                    ARBubble(
                        student: student,
                        themeColor: themeColor
                    )
                    .position(x: offset.x, y: offset.y)
                    .onTapGesture {
                        onStudentTapped(student)
                    }
                    .animation(
                        .easeInOut(duration: 2.0 + Double.random(in: 0...1))
                        .repeatForever(autoreverses: true),
                        value: offset
                    )
                }
            }
        }
        .onAppear {
            generateOffsets()
        }
    }

    private func bubbleOffset(for student: NearbyStudent, in size: CGSize) -> CGPoint {
        if let offset = bubbleOffsets[student.id] {
            return offset
        }
        return CGPoint(x: size.width / 2, y: size.height / 2)
    }

    private func generateOffsets() {
        for student in students.prefix(10) {
            let x = CGFloat.random(in: 60...320)
            let y = CGFloat.random(in: 140...700)
            bubbleOffsets[student.id] = CGPoint(x: x, y: y)
        }
    }
}

// MARK: - AR Bubble

struct ARBubble: View {
    let student: NearbyStudent
    let themeColor: Color

    var body: some View {
        VStack(spacing: 4) {
            // Avatar circle
            AvatarView(
                imageURL: student.profile.profilePhotoURL,
                size: 48,
                borderColor: themeColor,
                initials: student.profile.displayName.initials
            )
            .shadow(color: themeColor.opacity(0.4), radius: 8)

            // Name tag
            VStack(spacing: 2) {
                Text(student.profile.displayName.components(separatedBy: " ").first ?? "")
                    .font(ColageFonts.captionBold)
                    .foregroundStyle(.white)

                Text(student.distance.formattedDistance)
                    .font(ColageFonts.monoSmall)
                    .foregroundStyle(themeColor)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
    }
}

// MARK: - Live AR View (real device only)

#if !targetEnvironment(simulator)
struct LiveARView: UIViewRepresentable {
    let students: [NearbyStudent]
    let themeColor: Color
    var onStudentTapped: ((NearbyStudent) -> Void)?

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIView(context: Context) -> ARView {
        let arView = ARView(frame: .zero)

        // World tracking with camera feed
        let config = ARWorldTrackingConfiguration()
        config.planeDetection = []
        arView.session.run(config)

        context.coordinator.arView = arView
        context.coordinator.addStudentEntities(students: students)

        // Tap gesture
        let tap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleTap(_:)))
        arView.addGestureRecognizer(tap)

        return arView
    }

    func updateUIView(_ arView: ARView, context: Context) {
        context.coordinator.updateStudentEntities(students: students)
    }

    class Coordinator: NSObject {
        let parent: LiveARView
        var arView: ARView?
        private var anchors: [String: AnchorEntity] = [:]

        init(parent: LiveARView) {
            self.parent = parent
        }

        func addStudentEntities(students: [NearbyStudent]) {
            guard let arView = arView else { return }

            for student in students.prefix(15) {
                let anchor = AnchorEntity(world: randomPosition(distance: student.distance))

                // Simple sphere for now — custom meshes later
                let mesh = MeshResource.generateSphere(radius: 0.08)
                let material = SimpleMaterial(color: UIColor(red: 0.647, green: 0.110, blue: 0.188, alpha: 1.0), isMetallic: false) // Crimson
                let entity = ModelEntity(mesh: mesh, materials: [material])
                entity.name = student.id

                anchor.addChild(entity)
                arView.scene.addAnchor(anchor)
                anchors[student.id] = anchor
            }
        }

        func updateStudentEntities(students: [NearbyStudent]) {
            // Update positions based on new data
        }

        @objc func handleTap(_ gesture: UITapGestureRecognizer) {
            guard let arView = arView else { return }
            let location = gesture.location(in: arView)

            if let entity = arView.entity(at: location) {
                let studentId = entity.name
                if let student = parent.students.first(where: { $0.id == studentId }) {
                    parent.onStudentTapped?(student)
                }
            }
        }

        private func randomPosition(distance: Double) -> SIMD3<Float> {
            let meters = Float(distance) * 0.3048 // feet to meters
            let angle = Float.random(in: 0...(2 * .pi))
            let height = Float.random(in: -0.5...1.5)
            let clampedDist = min(meters, 10.0) // Cap at 10m for visibility
            return SIMD3(
                cos(angle) * clampedDist,
                height,
                -sin(angle) * clampedDist
            )
        }
    }
}
#endif

#Preview {
    ARDiscoveryView(students: {
        let vm = NearbyStudentsViewModel()
        vm.loadMockData()
        return vm
    }())
    .environmentObject(AppState())
    .environmentObject(UniversityService())
}
