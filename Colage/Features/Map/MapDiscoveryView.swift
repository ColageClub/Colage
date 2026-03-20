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
                students: students.mapStudents,
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

        private var imageCache: [String: UIImage] = [:]
        private var pendingDownloads: Set<String> = []

        func setupAnnotations(mapView: MapView) {
            let manager = mapView.annotations.makePointAnnotationManager()
            manager.delegate = self
            self.annotationManager = manager
        }

        func updateStudentAnnotations(students: [NearbyStudent], mapView: MapView) {
            guard let manager = annotationManager else { return }

            studentMap = [:]
            var annotations: [PointAnnotation] = []
            let themeColor = UIColor(parent.universityTheme?.primary ?? ColageColors.primary)

            for student in students {
                let imageId = "avatar-\(student.profile.userId)"

                // Register avatar image if we have it cached
                if let cached = imageCache[student.profile.userId] {
                    try? mapView.mapboxMap.style.addImage(cached, id: imageId)
                } else {
                    // Use initials placeholder and start downloading
                    let initials = student.profile.displayName
                        .components(separatedBy: " ")
                        .prefix(2)
                        .compactMap { $0.first.map(String.init) }
                        .joined()
                        .uppercased()
                    let placeholder = createAvatarImage(initials: initials, color: themeColor, size: 28)
                    try? mapView.mapboxMap.style.addImage(placeholder, id: imageId)
                    downloadAvatar(for: student, mapView: mapView)
                }

                var annotation = PointAnnotation(
                    coordinate: CLLocationCoordinate2D(
                        latitude: student.location.latitude,
                        longitude: student.location.longitude
                    )
                )

                // Name label below photo
                annotation.textField = student.profile.displayName.components(separatedBy: " ").first ?? ""
                annotation.textSize = 9
                annotation.textColor = StyleColor(.white)
                annotation.textOffset = [0, 1.8]
                annotation.textHaloColor = StyleColor(.black)
                annotation.textHaloWidth = 1.5

                // Profile photo circle
                annotation.iconImage = imageId
                annotation.iconSize = 1.0
                annotation.iconAnchor = .center

                studentMap[annotation.id] = student
                annotations.append(annotation)
            }

            manager.annotations = annotations
        }

        /// Download a student's profile photo and update the map marker
        private func downloadAvatar(for student: NearbyStudent, mapView: MapView) {
            let userId = student.profile.userId
            guard !pendingDownloads.contains(userId) else { return }
            guard let urlStr = student.profile.profilePhotoURL,
                  let url = URL(string: urlStr) else { return }

            pendingDownloads.insert(userId)
            let themeColor = UIColor(parent.universityTheme?.primary ?? ColageColors.primary)

            URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
                guard let self, let data, let downloaded = UIImage(data: data) else { return }
                let circular = self.createCircularImage(from: downloaded, borderColor: themeColor, size: 28)
                DispatchQueue.main.async {
                    self.imageCache[userId] = circular
                    self.pendingDownloads.remove(userId)
                    let imageId = "avatar-\(userId)"
                    try? mapView.mapboxMap.style.addImage(circular, id: imageId)
                }
            }.resume()
        }

        /// Create a circular avatar with initials (placeholder)
        private func createAvatarImage(initials: String, color: UIColor, size: CGFloat) -> UIImage {
            let renderer = UIGraphicsImageRenderer(size: CGSize(width: size, height: size))
            return renderer.image { ctx in
                // Border
                let borderWidth: CGFloat = 2
                ctx.cgContext.setFillColor(color.cgColor)
                ctx.cgContext.fillEllipse(in: CGRect(x: 0, y: 0, width: size, height: size))

                // Background
                let inner = CGRect(x: borderWidth, y: borderWidth, width: size - borderWidth * 2, height: size - borderWidth * 2)
                ctx.cgContext.setFillColor(UIColor(white: 0.15, alpha: 1).cgColor)
                ctx.cgContext.fillEllipse(in: inner)

                // Initials
                let attrs: [NSAttributedString.Key: Any] = [
                    .font: UIFont.systemFont(ofSize: size * 0.32, weight: .bold),
                    .foregroundColor: UIColor.white
                ]
                let text = initials as NSString
                let textSize = text.size(withAttributes: attrs)
                let textRect = CGRect(
                    x: (size - textSize.width) / 2,
                    y: (size - textSize.height) / 2,
                    width: textSize.width,
                    height: textSize.height
                )
                text.draw(in: textRect, withAttributes: attrs)
            }
        }

        /// Crop + circle a downloaded image with a colored border
        private func createCircularImage(from image: UIImage, borderColor: UIColor, size: CGFloat) -> UIImage {
            let renderer = UIGraphicsImageRenderer(size: CGSize(width: size, height: size))
            return renderer.image { ctx in
                let borderWidth: CGFloat = 2

                // Border circle
                ctx.cgContext.setFillColor(borderColor.cgColor)
                ctx.cgContext.fillEllipse(in: CGRect(x: 0, y: 0, width: size, height: size))

                // Clip to inner circle and draw image
                let innerRect = CGRect(x: borderWidth, y: borderWidth, width: size - borderWidth * 2, height: size - borderWidth * 2)
                ctx.cgContext.addEllipse(in: innerRect)
                ctx.cgContext.clip()
                image.draw(in: innerRect)
            }
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
