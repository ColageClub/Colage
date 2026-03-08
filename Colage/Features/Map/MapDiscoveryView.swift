import SwiftUI
@preconcurrency import MapboxMaps

/// Map discovery view — Mapbox-powered with university theming
struct MapDiscoveryView: View {
    @ObservedObject var students: NearbyStudentsViewModel
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var universityService: UniversityService
    @State private var selectedStudent: NearbyStudent?
    @State private var viewport: Viewport = .camera(
        center: CLLocationCoordinate2D(latitude: 42.2780, longitude: -83.7382),
        zoom: 15.5,
        bearing: 0,
        pitch: 0
    )

    var body: some View {
        ZStack {
            MapboxMapView(
                viewport: $viewport,
                students: students.filteredStudents,
                universityTheme: universityService.currentTheme,
                onStudentTapped: { student in
                    selectedStudent = student
                }
            )
            .ignoresSafeArea()
        }
        .sheet(item: $selectedStudent) { student in
            MiniProfileSheet(student: student)
                .presentationDetents([.fraction(0.35), .large])
                .presentationDragIndicator(.visible)
                .presentationBackgroundInteraction(.enabled)
        }
    }
}

/// UIViewRepresentable wrapper for Mapbox MapView
struct MapboxMapView: UIViewRepresentable {
    @Binding var viewport: Viewport
    let students: [NearbyStudent]
    let universityTheme: UniversityTheme?
    var onStudentTapped: ((NearbyStudent) -> Void)?

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIView(context: Context) -> MapView {
        let mapInitOptions = MapInitOptions(
            styleURI: .dark // Dark base — we'll customize colors
        )
        let mapView = MapView(frame: .zero, mapInitOptions: mapInitOptions)

        // Configure map
        mapView.location.options.puckType = .puck2D(
            Puck2DConfiguration.makeDefault(showBearing: true)
        )

        // Store reference for updates
        context.coordinator.mapView = mapView
        context.coordinator.setupAnnotations(mapView: mapView)

        return mapView
    }

    func updateUIView(_ mapView: MapView, context: Context) {
        context.coordinator.updateStudentAnnotations(students: students, mapView: mapView)
    }

    class Coordinator: NSObject {
        let parent: MapboxMapView
        var mapView: MapView?
        private var annotationManager: PointAnnotationManager?
        private var studentMap: [String: NearbyStudent] = [:]

        init(parent: MapboxMapView) {
            self.parent = parent
        }

        func setupAnnotations(mapView: MapView) {
            let manager = mapView.annotations.makePointAnnotationManager()
            manager.delegate = self
            self.annotationManager = manager
        }

        func updateStudentAnnotations(students: [NearbyStudent], mapView: MapView) {
            guard let manager = annotationManager else { return }

            studentMap = [:]
            var annotations: [PointAnnotation] = []

            for student in students {
                var annotation = PointAnnotation(
                    coordinate: CLLocationCoordinate2D(
                        latitude: student.location.latitude,
                        longitude: student.location.longitude
                    )
                )
                annotation.textField = student.profile.displayName
                annotation.textSize = 11
                annotation.textColor = StyleColor(.white)
                annotation.textOffset = [0, 2.0]
                annotation.textHaloColor = StyleColor(.black)
                annotation.textHaloWidth = 1.0

                // Use a circle icon — custom profile photo icons will be added later
                annotation.iconSize = 0.8
                annotation.iconColor = StyleColor(
                    parent.universityTheme?.primary ?? ColageColors.primary
                )

                // Map annotation ID to student for tap handling
                studentMap[annotation.id] = student
                annotations.append(annotation)
            }

            manager.annotations = annotations
        }
    }
}

// MARK: - Annotation tap handling
extension MapboxMapView.Coordinator: AnnotationInteractionDelegate {
    func annotationManager(
        _ manager: any AnnotationManager,
        didDetectTappedAnnotations annotations: [any Annotation]
    ) {
        guard let tappedId = annotations.first?.id,
              let student = studentMap[tappedId] else { return }
        parent.onStudentTapped?(student)
    }
}

#Preview {
    MapDiscoveryView(students: {
        let vm = NearbyStudentsViewModel()
        vm.loadMockData()
        return vm
    }())
    .environmentObject(AppState())
    .environmentObject(UniversityService())
}
