import Foundation
import CoreLocation
import CoreMotion
import SwiftUI

/// Core location service — event-driven GPS + barometric floor detection
///
/// Uses movement-based broadcasting instead of fixed timers:
/// - distanceFilter triggers updates only when the user actually moves
/// - Heartbeat timer (30s) catches floor changes and keeps-alive when stationary
/// - Activity type hint tells iOS to optimize for pedestrian movement
class LocationService: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var currentLocation: CLLocationCoordinate2D?
    @Published var currentAltitude: Double = 0
    @Published var currentFloor: Int = 1
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var isTracking = false

    private let locationManager = CLLocationManager()
    private let altimeter = CMAltimeter()
    private var groundAltitude: Double?

    // Movement-based broadcasting
    private var lastBroadcastLocation: CLLocation?
    private var lastBroadcastTime: Date = .distantPast
    private var lastBroadcastFloor: Int = 0
    private var heartbeatTimer: Timer?

    /// Min distance (meters) before triggering a location update from iOS
    private let movementThreshold: CLLocationDistance = 5

    /// Min distance (meters) before we actually broadcast to server
    /// (filters out GPS jitter — don't broadcast if you moved < 3m)
    private let broadcastMinDistance: Double = 3.0

    /// Min time between broadcasts (throttle rapid-fire updates)
    private let broadcastMinInterval: TimeInterval = 3.0

    /// Heartbeat interval — catch floor changes + keep alive when standing still
    private let heartbeatInterval: TimeInterval = 30.0

    /// Meters per floor (approximate)
    private let metersPerFloor: Double = 3.5

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = movementThreshold
        locationManager.activityType = .fitness // Pedestrian on campus
        locationManager.allowsBackgroundLocationUpdates = false
        locationManager.showsBackgroundLocationIndicator = false
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

        // Recalibrate ground after 3s so barometer has time to settle
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) { [weak self] in
            self?.recalibrateGround()
        }

        // Heartbeat: fallback broadcast every 30s for floor changes / keep-alive
        // This is NOT the primary broadcast — movement triggers are
        heartbeatTimer = Timer.scheduledTimer(withTimeInterval: heartbeatInterval, repeats: true) { [weak self] _ in
            self?.heartbeatBroadcast()
        }
    }

    func stopTracking() {
        locationManager.stopUpdatingLocation()
        altimeter.stopRelativeAltitudeUpdates()
        heartbeatTimer?.invalidate()
        heartbeatTimer = nil
        isTracking = false
        lastBroadcastLocation = nil
    }

    // MARK: - CLLocationManagerDelegate

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        // Filter out stale or inaccurate readings
        let age = -location.timestamp.timeIntervalSinceNow
        guard age < 10, location.horizontalAccuracy >= 0, location.horizontalAccuracy < 100 else { return }

        currentLocation = location.coordinate

        // Decide whether to broadcast
        let shouldBroadcast: Bool
        let now = Date()

        if let lastLoc = lastBroadcastLocation {
            let distance = location.distance(from: lastLoc)
            let timeSinceLastBroadcast = now.timeIntervalSince(lastBroadcastTime)

            // Broadcast if: moved enough AND enough time has passed
            shouldBroadcast = distance >= broadcastMinDistance && timeSinceLastBroadcast >= broadcastMinInterval
        } else {
            // First location — always broadcast
            shouldBroadcast = true
        }

        if shouldBroadcast {
            broadcastLocation(from: location)
        }
    }

    // MARK: - Altimeter / Floor Detection

    private func startAltimeter() {
        guard CMAltimeter.isRelativeAltitudeAvailable() else { return }

        altimeter.startRelativeAltitudeUpdates(to: .main) { [weak self] data, error in
            guard let self = self, let data = data, error == nil else { return }

            let relativeAltitude = data.relativeAltitude.doubleValue

            if self.groundAltitude == nil {
                self.groundAltitude = relativeAltitude
            }

            self.currentAltitude = relativeAltitude
            let newFloor = self.computeFloor(relativeAltitude: relativeAltitude)

            // If floor changed, broadcast immediately (even if we haven't moved laterally)
            if newFloor != self.currentFloor {
                self.currentFloor = newFloor
                if let coord = self.currentLocation {
                    let loc = CLLocation(latitude: coord.latitude, longitude: coord.longitude)
                    self.broadcastLocation(from: loc)
                }
            } else {
                self.currentFloor = newFloor
            }
        }
    }

    private func computeFloor(relativeAltitude: Double) -> Int {
        guard let ground = groundAltitude else { return 1 }
        let delta = relativeAltitude - ground

        // Dead zone: ignore altitude changes less than ~half a floor (1.5m)
        // This prevents barometric noise from changing floors
        if abs(delta) < 1.5 {
            return 1
        }

        if delta < -2.0 {
            return max(Int(Foundation.floor(delta / metersPerFloor)), -2)
        }
        let floor = Int(round(delta / metersPerFloor)) + 1
        return max(floor, 1)
    }

    func recalibrateGround() {
        groundAltitude = currentAltitude
        currentFloor = 1
    }

    func setFloorManually(_ floor: Int) {
        currentFloor = floor
        groundAltitude = currentAltitude - (Double(floor - 1) * metersPerFloor)
    }

    // MARK: - Broadcasting

    /// Primary broadcast — called when movement or floor change detected
    private func broadcastLocation(from location: CLLocation) {
        let studentLocation = StudentLocation(
            userId: UserProfile.current?.userId ?? "dev-user",
            latitude: location.coordinate.latitude,
            longitude: location.coordinate.longitude,
            altitude: currentAltitude,
            floor: currentFloor,
            timestamp: Date()
        )
        WebSocketManager.shared.sendLocationUpdate(studentLocation)

        lastBroadcastLocation = location
        lastBroadcastTime = Date()
        lastBroadcastFloor = currentFloor
    }

    /// Heartbeat — sends update every 30s even if stationary
    /// Catches floor changes the altimeter might have missed, keeps server TTL alive
    private func heartbeatBroadcast() {
        guard let coord = currentLocation else { return }
        let loc = CLLocation(latitude: coord.latitude, longitude: coord.longitude)
        broadcastLocation(from: loc)
    }
}
