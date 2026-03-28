import SwiftUI
@preconcurrency import MapboxMaps

/// Map discovery view — Mapbox-powered with university theming
struct MapDiscoveryView: View {
    @ObservedObject var students: NearbyStudentsViewModel
    var allMapStudents: [NearbyStudent]
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var universityService: UniversityService
    @EnvironmentObject var locationService: LocationService
    @State private var selectedStudent: NearbyStudent?
    @State private var hasInitializedCamera = false
    @State private var recenterTrigger: UUID?
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
                students: allMapStudents,
                universityTheme: universityService.currentTheme,
                isVisible: appState.isVisible,
                recenterCoordinate: locationService.currentLocation,
                recenterTrigger: recenterTrigger,
                onStudentTapped: { student in
                    selectedStudent = student
                }
            )
            .ignoresSafeArea()

            // Recenter button
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    Button {
                        recenterOnUser()
                    } label: {
                        Image(systemName: "location.fill")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(ColageColors.textPrimary)
                            .frame(width: 44, height: 44)
                            .background(ColageColors.surface.opacity(0.9))
                            .clipShape(Circle())
                            .shadow(color: .black.opacity(0.3), radius: 4, y: 2)
                    }
                    .padding(.trailing, 16)
                    .padding(.bottom, 120) // Above ad banner
                }
            }
        }
        .onAppear {
            if !hasInitializedCamera {
                recenterOnUser()
                hasInitializedCamera = true
            }
        }
        .sheet(item: $selectedStudent) { student in
            MiniProfileSheet(student: student)
                .presentationDetents([.fraction(0.35), .large])
                .presentationDragIndicator(.visible)
                .presentationBackgroundInteraction(.enabled)
        }
    }

    private func recenterOnUser() {
        recenterTrigger = UUID()
    }
}

/// UIViewRepresentable wrapper for Mapbox MapView
struct MapboxMapView: UIViewRepresentable {
    @Binding var viewport: Viewport
    let students: [NearbyStudent]
    let universityTheme: UniversityTheme?
    let isVisible: Bool
    var recenterCoordinate: CLLocationCoordinate2D?
    var recenterTrigger: UUID?
    var onStudentTapped: ((NearbyStudent) -> Void)?

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIView(context: Context) -> MapView {
        let mapInitOptions = MapInitOptions(
            styleURI: .dark // Dark base — we'll customize colors
        )
        let mapView = MapView(frame: .zero, mapInitOptions: mapInitOptions)

        // Reposition Mapbox ornaments — keep logo & attribution visible (required)
        mapView.ornaments.options.logo.margins = .init(x: 8, y: 8)
        mapView.ornaments.options.logo.position = .bottomLeading
        mapView.ornaments.options.attributionButton.margins = .init(x: 8, y: 8)
        mapView.ornaments.options.attributionButton.position = .bottomLeading
        mapView.ornaments.options.scaleBar.visibility = .hidden
        mapView.ornaments.options.compass.visibility = .hidden

        // Configure map — puck color reflects visibility
        let puckColor = context.coordinator.parent.isVisible
            ? UIColor(context.coordinator.parent.universityTheme?.primary ?? ColageColors.primary)
            : UIColor(ColageColors.offline)
        var puckConfig = Puck2DConfiguration.makeDefault(showBearing: true)
        puckConfig.topImage = createPuckImage(color: puckColor)
        mapView.location.options.puckType = .puck2D(puckConfig)

        // Store reference for updates
        context.coordinator.mapView = mapView
        context.coordinator.setupAnnotations(mapView: mapView)

        return mapView
    }

    func updateUIView(_ mapView: MapView, context: Context) {
        context.coordinator.updateStudentAnnotations(students: students, mapView: mapView)

        // Recenter camera when trigger changes
        if let trigger = recenterTrigger, trigger != context.coordinator.lastRecenterTrigger,
           let coord = recenterCoordinate {
            context.coordinator.lastRecenterTrigger = trigger
            let camera = CameraOptions(center: coord, zoom: 15.5, bearing: 0, pitch: 0)
            mapView.camera.fly(to: camera, duration: 0.5)
        }

        // Update puck color when visibility changes
        let puckColor = isVisible
            ? UIColor(universityTheme?.primary ?? ColageColors.primary)
            : UIColor(ColageColors.offline)
        var puckConfig = Puck2DConfiguration.makeDefault(showBearing: true)
        puckConfig.topImage = createPuckImage(color: puckColor)
        mapView.location.options.puckType = .puck2D(puckConfig)
    }

    class Coordinator: NSObject {
        var parent: MapboxMapView
        var mapView: MapView?
        private var annotationManager: PointAnnotationManager?
        private var studentMap: [String: NearbyStudent] = [:]
        var lastRecenterTrigger: UUID?

        init(parent: MapboxMapView) {
            self.parent = parent
        }

        private var imageCache: [String: UIImage] = [:]
        private var pendingDownloads: Set<String> = []
        /// Track last known positions for smooth animation
        private var lastPositions: [String: CLLocationCoordinate2D] = [:]

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

                // Smooth position: interpolate from last known position
                let targetCoord = CLLocationCoordinate2D(
                    latitude: student.location.latitude,
                    longitude: student.location.longitude
                )
                let displayCoord: CLLocationCoordinate2D
                if let lastPos = lastPositions[student.profile.userId] {
                    // Lerp 70% toward target for smooth movement
                    displayCoord = CLLocationCoordinate2D(
                        latitude: lastPos.latitude + (targetCoord.latitude - lastPos.latitude) * 0.7,
                        longitude: lastPos.longitude + (targetCoord.longitude - lastPos.longitude) * 0.7
                    )
                } else {
                    displayCoord = targetCoord
                }
                lastPositions[student.profile.userId] = displayCoord

                var annotation = PointAnnotation(
                    coordinate: displayCoord
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

// MARK: - Puck Image Generator

/// Creates a simple circular puck image with the given color
private func createPuckImage(color: UIColor, size: CGFloat = 22) -> UIImage {
    let renderer = UIGraphicsImageRenderer(size: CGSize(width: size, height: size))
    return renderer.image { ctx in
        // Outer glow
        color.withAlphaComponent(0.3).setFill()
        ctx.cgContext.fillEllipse(in: CGRect(x: 0, y: 0, width: size, height: size))
        // Inner solid circle
        color.setFill()
        let inset: CGFloat = 4
        ctx.cgContext.fillEllipse(in: CGRect(x: inset, y: inset, width: size - inset * 2, height: size - inset * 2))
        // White center dot
        UIColor.white.setFill()
        let centerInset: CGFloat = 7
        ctx.cgContext.fillEllipse(in: CGRect(x: centerInset, y: centerInset, width: size - centerInset * 2, height: size - centerInset * 2))
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
    }(), allMapStudents: [])
    .environmentObject(AppState())
    .environmentObject(UniversityService())
}
