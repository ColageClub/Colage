package com.colageclub.colage.core.location

import android.annotation.SuppressLint
import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Location
import com.colageclub.colage.core.networking.WebSocketManager
import com.colageclub.colage.data.models.StudentLocation
import com.google.android.gms.location.*
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.pow
import kotlin.math.roundToInt

/**
 * Event-driven location service — broadcasts only when the user actually moves.
 *
 * Uses FusedLocationProvider with displacement-based updates instead of fixed timers:
 * - 5m displacement filter triggers location updates only on real movement
 * - 3m minimum broadcast distance filters GPS jitter
 * - 3s minimum broadcast interval throttles rapid-fire updates
 * - 30s heartbeat keeps server TTL alive when stationary
 * - Floor changes trigger immediate broadcast
 */
@Singleton
class LocationService @Inject constructor(
    @ApplicationContext private val context: Context,
    private val webSocketManager: WebSocketManager
) : SensorEventListener {

    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)
    private val sensorManager: SensorManager =
        context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val pressureSensor: Sensor? =
        sensorManager.getDefaultSensor(Sensor.TYPE_PRESSURE)

    private val _currentLocation = MutableStateFlow<Location?>(null)
    val currentLocation: StateFlow<Location?> = _currentLocation.asStateFlow()

    private val _currentFloor = MutableStateFlow(1)
    val currentFloor: StateFlow<Int> = _currentFloor.asStateFlow()

    private val _isTracking = MutableStateFlow(false)
    val isTracking: StateFlow<Boolean> = _isTracking.asStateFlow()

    /** 3.5 meters per floor (matches iOS) */
    private val metersPerFloor = 3.5

    private var groundAltitude: Double? = null
    private var currentAltitude = 0.0

    // Movement-based broadcasting state
    private var lastBroadcastLocation: Location? = null
    private var lastBroadcastTime: Long = 0
    private var lastBroadcastFloor: Int = 0
    private var currentUserId: String = ""

    /** Min distance (meters) before OS triggers a location update */
    private val movementThreshold = 5f

    /** Min distance (meters) before we actually broadcast to server */
    private val broadcastMinDistance = 3.0

    /** Min time (ms) between broadcasts — throttle rapid updates */
    private val broadcastMinIntervalMs = 3000L

    /** Heartbeat interval (ms) — keep-alive when stationary */
    private val heartbeatIntervalMs = 30_000L

    private var heartbeatJob: Job? = null
    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    // FusedLocationProvider: displacement-based, not timer-based
    private val locationRequest = LocationRequest.Builder(
        Priority.PRIORITY_HIGH_ACCURACY, 5000L // Max interval hint — displacement is the real trigger
    ).apply {
        setMinUpdateDistanceMeters(movementThreshold)
        setMinUpdateIntervalMillis(2000L) // Won't fire faster than 2s even if moving fast
    }.build()

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            val location = result.lastLocation ?: return

            // Filter stale or inaccurate readings
            val age = System.currentTimeMillis() - location.time
            if (age > 10_000 || location.accuracy > 100f) return

            _currentLocation.value = location

            // Decide whether to broadcast
            val now = System.currentTimeMillis()
            val lastLoc = lastBroadcastLocation

            val shouldBroadcast = if (lastLoc != null) {
                val distance = location.distanceTo(lastLoc)
                val timeSinceLast = now - lastBroadcastTime
                distance >= broadcastMinDistance && timeSinceLast >= broadcastMinIntervalMs
            } else {
                true // First location — always broadcast
            }

            if (shouldBroadcast) {
                broadcastLocation(location)
            }
        }
    }

    @SuppressLint("MissingPermission")
    fun startTracking(userId: String) {
        if (_isTracking.value) return
        _isTracking.value = true
        currentUserId = userId

        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            android.os.Looper.getMainLooper()
        )

        pressureSensor?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL)
        }

        // Heartbeat: keep server TTL alive when standing still
        heartbeatJob = serviceScope.launch {
            while (isActive) {
                delay(heartbeatIntervalMs)
                _currentLocation.value?.let { broadcastLocation(it) }
            }
        }
    }

    fun stopTracking() {
        if (!_isTracking.value) return
        _isTracking.value = false
        fusedLocationClient.removeLocationUpdates(locationCallback)
        sensorManager.unregisterListener(this)
        heartbeatJob?.cancel()
        heartbeatJob = null
        lastBroadcastLocation = null
    }

    fun recalibrateGround() {
        groundAltitude = currentAltitude
        _currentFloor.value = 1
    }

    fun setFloorManually(floor: Int) {
        _currentFloor.value = floor
        groundAltitude = currentAltitude - (floor - 1) * metersPerFloor
    }

    // MARK: - SensorEventListener (barometer → floor detection)

    override fun onSensorChanged(event: SensorEvent?) {
        if (event?.sensor?.type != Sensor.TYPE_PRESSURE) return
        val pressureHPa = event.values[0]
        val seaLevel = SensorManager.PRESSURE_STANDARD_ATMOSPHERE
        val altitudeM = 44330.0 * (1.0 - (pressureHPa.toDouble() / seaLevel.toDouble()).pow(1.0 / 5.255))

        if (groundAltitude == null) {
            groundAltitude = altitudeM
        }
        currentAltitude = altitudeM
        val newFloor = computeFloor(altitudeM)

        // Floor change → immediate broadcast (even if we haven't moved laterally)
        if (newFloor != _currentFloor.value) {
            _currentFloor.value = newFloor
            _currentLocation.value?.let { broadcastLocation(it) }
        } else {
            _currentFloor.value = newFloor
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    private fun computeFloor(altitude: Double): Int {
        val ground = groundAltitude ?: return 1
        val delta = altitude - ground
        // Dead zone: ignore small altitude changes (matches iOS)
        if (Math.abs(delta) < 1.5) return 1
        return if (delta < -2.0) {
            maxOf((delta / metersPerFloor).toInt(), -2)
        } else {
            maxOf((delta / metersPerFloor).roundToInt() + 1, 1)
        }
    }

    // MARK: - Broadcasting

    private fun broadcastLocation(location: Location) {
        val studentLocation = StudentLocation(
            userId = currentUserId,
            latitude = location.latitude,
            longitude = location.longitude,
            altitude = currentAltitude,
            floor = _currentFloor.value,
            timestamp = System.currentTimeMillis()
        )
        webSocketManager.sendLocationUpdate(studentLocation)

        lastBroadcastLocation = location
        lastBroadcastTime = System.currentTimeMillis()
        lastBroadcastFloor = _currentFloor.value
    }
}
