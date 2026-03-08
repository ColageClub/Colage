import SwiftUI
import ARKit
import RealityKit
import CoreLocation

/// AR discovery view — floating bubbles above nearby students
struct ARDiscoveryView: View {
    @ObservedObject var students: NearbyStudentsViewModel
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var locationService: LocationService
    @State private var selectedStudent: NearbyStudent?
    @State private var torchOn = false

    var body: some View {
        ZStack {
            if ARWorldTrackingConfiguration.isSupported {
                ARSceneView(
                    students: students.filteredStudents,
                    userLocation: locationService.currentLocation,
                    onStudentTapped: { student in
                        selectedStudent = student
                    }
                )
                .ignoresSafeArea()
            } else {
                // Simulator / non-AR fallback
                ARSimulatorFallback(students: students, onTap: { student in
                    selectedStudent = student
                })
            }

            // Distance slider
            VStack {
                Spacer().frame(height: 100)
                DistanceSlider(distance: $students.maxDistance)
                    .padding(.horizontal, 24)
                Spacer()
            }

            // Bottom controls
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    Button {
                        toggleTorch()
                    } label: {
                        Image(systemName: torchOn ? "flashlight.on.fill" : "flashlight.off.fill")
                            .font(.system(size: 18))
                            .foregroundStyle(torchOn ? ColageColors.warning : ColageColors.textPrimary)
                            .frame(width: 44, height: 44)
                            .background(ColageColors.surface.opacity(0.8))
                            .clipShape(Circle())
                    }
                    .padding(.trailing, 16)
                    .padding(.bottom, 40)
                }
            }
        }
        .sheet(item: $selectedStudent) { student in
            MiniProfileSheet(student: student)
                .presentationDetents([.fraction(0.35), .large])
                .presentationDragIndicator(.visible)
        }
    }

    private func toggleTorch() {
        guard let device = AVCaptureDevice.default(for: .video),
              device.hasTorch else { return }
        do {
            try device.lockForConfiguration()
            device.torchMode = torchOn ? .off : .on
            device.unlockForConfiguration()
            torchOn.toggle()
        } catch {}
    }
}

// MARK: - Real AR View with bubble anchors

struct ARSceneView: UIViewRepresentable {
    let students: [NearbyStudent]
    let userLocation: CLLocationCoordinate2D?
    var onStudentTapped: ((NearbyStudent) -> Void)?

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIView(context: Context) -> ARView {
        let arView = ARView(frame: .zero)

        let config = ARWorldTrackingConfiguration()
        config.planeDetection = [.horizontal]
        config.worldAlignment = .gravityAndHeading // Align to compass for positioning
        arView.session.run(config)

        // Tap gesture for bubbles
        let tapGesture = UITapGestureRecognizer(
            target: context.coordinator,
            action: #selector(Coordinator.handleTap(_:))
        )
        arView.addGestureRecognizer(tapGesture)

        context.coordinator.arView = arView
        return arView
    }

    func updateUIView(_ arView: ARView, context: Context) {
        context.coordinator.updateBubbles(students: students, userLocation: userLocation)
    }

    class Coordinator: NSObject {
        let parent: ARSceneView
        var arView: ARView?
        private var bubbleAnchors: [String: AnchorEntity] = [:]
        private var studentMap: [Entity: NearbyStudent] = [:]

        init(parent: ARSceneView) {
            self.parent = parent
        }

        func updateBubbles(students: [NearbyStudent], userLocation: CLLocationCoordinate2D?) {
            guard let arView = arView, let userCoord = userLocation else { return }

            // Remove old anchors not in current list
            let currentIds = Set(students.map { $0.id })
            for (id, anchor) in bubbleAnchors where !currentIds.contains(id) {
                arView.scene.removeAnchor(anchor)
                bubbleAnchors.removeValue(forKey: id)
            }

            for student in students {
                let offset = coordinateOffset(
                    from: userCoord,
                    to: CLLocationCoordinate2D(
                        latitude: student.location.latitude,
                        longitude: student.location.longitude
                    )
                )

                // Position: x = east/west, z = north/south (negative = north), y = height
                let position = SIMD3<Float>(
                    Float(offset.east),
                    1.7, // Head height
                    Float(-offset.north) // Negative because ARKit z is south
                )

                if let existingAnchor = bubbleAnchors[student.id] {
                    // Smoothly move existing bubble
                    existingAnchor.position = position
                } else {
                    // Create new bubble
                    let anchor = AnchorEntity(world: position)
                    let bubble = createBubble(for: student)
                    anchor.addChild(bubble)
                    arView.scene.addAnchor(anchor)
                    bubbleAnchors[student.id] = anchor
                    studentMap[bubble] = student
                }
            }
        }

        private func createBubble(for student: NearbyStudent) -> ModelEntity {
            // Create a sphere as the bubble
            let mesh = MeshResource.generateSphere(radius: 0.15)
            var material = SimpleMaterial()
            material.color = .init(
                tint: UIColor(ColageColors.primary).withAlphaComponent(0.85)
            )
            let entity = ModelEntity(mesh: mesh, materials: [material])
            entity.generateCollisionShapes(recursive: false)

            // Add text label below
            let textMesh = MeshResource.generateText(
                student.profile.displayName,
                extrusionDepth: 0.001,
                font: .systemFont(ofSize: 0.04, weight: .semibold),
                containerFrame: .zero,
                alignment: .center,
                lineBreakMode: .byTruncatingTail
            )
            var textMaterial = SimpleMaterial()
            textMaterial.color = .init(tint: .white)
            let textEntity = ModelEntity(mesh: textMesh, materials: [textMaterial])
            textEntity.position = SIMD3<Float>(0, -0.22, 0)
            entity.addChild(textEntity)

            // Distance label
            let distText = "\(Int(student.distance)) ft"
            let distMesh = MeshResource.generateText(
                distText,
                extrusionDepth: 0.001,
                font: .systemFont(ofSize: 0.03),
                containerFrame: .zero,
                alignment: .center,
                lineBreakMode: .byClipping
            )
            var distMaterial = SimpleMaterial()
            distMaterial.color = .init(tint: UIColor(ColageColors.textSecondary))
            let distEntity = ModelEntity(mesh: distMesh, materials: [distMaterial])
            distEntity.position = SIMD3<Float>(0, -0.28, 0)
            entity.addChild(distEntity)

            return entity
        }

        /// Convert GPS coordinate difference to meters (east/north offset)
        private func coordinateOffset(
            from: CLLocationCoordinate2D,
            to: CLLocationCoordinate2D
        ) -> (north: Double, east: Double) {
            let latDiff = to.latitude - from.latitude
            let lngDiff = to.longitude - from.longitude
            let metersPerDegreeLat = 111_132.0
            let metersPerDegreeLng = 111_132.0 * cos(from.latitude * .pi / 180)
            return (
                north: latDiff * metersPerDegreeLat,
                east: lngDiff * metersPerDegreeLng
            )
        }

        @objc func handleTap(_ gesture: UITapGestureRecognizer) {
            guard let arView = arView else { return }
            let location = gesture.location(in: arView)

            if let entity = arView.entity(at: location) {
                // Walk up to find the root model entity
                var current: Entity? = entity
                while let c = current {
                    if let student = studentMap[c] {
                        parent.onStudentTapped?(student)
                        return
                    }
                    current = c.parent
                }
            }
        }
    }
}

// MARK: - Simulator Fallback

struct ARSimulatorFallback: View {
    @ObservedObject var students: NearbyStudentsViewModel
    var onTap: (NearbyStudent) -> Void

    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()

            VStack(spacing: 16) {
                Image(systemName: "arkit")
                    .font(.system(size: 48))
                    .foregroundStyle(ColageColors.textTertiary)
                Text("AR Preview Mode")
                    .font(ColageFonts.title3)
                    .foregroundStyle(ColageColors.textSecondary)
                Text("Run on a real device for the full experience")
                    .font(ColageFonts.caption)
                    .foregroundStyle(ColageColors.textTertiary)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 20) {
                        ForEach(students.filteredStudents.prefix(10)) { student in
                            VStack(spacing: 8) {
                                // Simulated bubble
                                ZStack {
                                    Circle()
                                        .fill(ColageColors.primary.opacity(0.2))
                                        .frame(width: 90, height: 90)
                                    AvatarView(
                                        imageURL: student.profile.profilePhotoURL,
                                        size: 72
                                    )
                                }
                                .shadow(color: ColageColors.primary.opacity(0.3), radius: 12)

                                Text(student.profile.displayName)
                                    .font(ColageFonts.caption)
                                    .foregroundStyle(ColageColors.textPrimary)
                                    .lineLimit(1)

                                Text("\(Int(student.distance)) ft")
                                    .font(ColageFonts.monoSmall)
                                    .foregroundStyle(ColageColors.textSecondary)
                            }
                            .onTapGesture { onTap(student) }
                        }
                    }
                    .padding(.horizontal, 24)
                }
                .padding(.top, 32)
            }
        }
    }
}

#Preview {
    ARDiscoveryView(students: {
        let vm = NearbyStudentsViewModel()
        vm.loadMockData()
        return vm
    }())
    .environmentObject(AppState())
    .environmentObject(LocationService())
}
