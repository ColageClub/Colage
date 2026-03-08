import Foundation
import CoreLocation
import CoreMotion
import SwiftUI

/// Core location service — GPS + barometric floor detection
class LocationService: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var currentLocation: CLLocationCoordinate2D?
    @Published var currentAltitude: Double = 0
    @Published var currentFloor: Int = 1
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var isTracking = false

    private let locationManager = CLLocationManager()
    private let altimeter = CMAltimeter()
    private var groundAltitude: Double?
    private var broadcastTimer: Timer?

    /// Meters per floor (approximate)
    private let metersPerFloor: Double = 3.5

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 2 // Update every 2 meters
        locationManager.allowsBackgroundLocationUpdates = false // Enable later for background
        locationManager.showsBackgroundLocationIndicator = true
    }

    func requestPermission() {
        locationManager.requestWhenInUseAuthorization()
    }

    func requestAlwaysPermission() {
        locationManager.requestAlwaysAuthorization()
    }

    func startTracking() {
        locationManager.startUpdatingLocation()
        startAltimeter()
        isTracking = true

        // Broadcast location every 5 seconds in foreground
        broadcastTimer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { [weak self] _ in
            self?.broadcastLocation()
        }
    }

    func stopTracking() {
        locationManager.stopUpdatingLocation()
        altimeter.stopRelativeAltitudeUpdates()
        broadcastTimer?.invalidate()
        isTracking = false
    }

    // MARK: - CLLocationManagerDelegate

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        currentLocation = location.coordinate
    }

    // MARK: - Altimeter / Floor Detection

    private func startAltimeter() {
        guard CMAltimeter.isRelativeAltitudeAvailable() else { return }

        altimeter.startRelativeAltitudeUpdates(to: .main) { [weak self] data, error in
            guard let self = self, let data = data, error == nil else { return }

            let relativeAltitude = data.relativeAltitude.doubleValue

            // Anchor ground floor on first reading
            if self.groundAltitude == nil {
                self.groundAltitude = relativeAltitude
            }

            self.currentAltitude = relativeAltitude
            self.currentFloor = self.computeFloor(relativeAltitude: relativeAltitude)
        }
    }

    /// Compute floor from relative altitude change
    private func computeFloor(relativeAltitude: Double) -> Int {
        guard let ground = groundAltitude else { return 1 }
        let delta = relativeAltitude - ground
        let floor = Int(round(delta / metersPerFloor)) + 1

        // Basement detection
        if delta < -2.0 {
            return Int(Foundation.floor(delta / metersPerFloor))
        }
        return max(floor, 1)
    }

    /// Reset ground floor anchor (call when entering a new building)
    func recalibrateGround() {
        groundAltitude = currentAltitude
        currentFloor = 1
    }

    /// Manual floor override
    func setFloorManually(_ floor: Int) {
        currentFloor = floor
        // Recalculate ground altitude based on manual floor
        groundAltitude = currentAltitude - (Double(floor - 1) * metersPerFloor)
    }

    // MARK: - Broadcasting

    private func broadcastLocation() {
        guard let coord = currentLocation else { return }
        let studentLocation = StudentLocation(
            userId: UserProfile.current?.userId ?? "dev-user",
            latitude: coord.latitude,
            longitude: coord.longitude,
            altitude: currentAltitude,
            floor: currentFloor,
            timestamp: Date()
        )
        WebSocketManager.shared.sendLocationUpdate(studentLocation)
    }
}
