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
import kotlin.math.abs
import kotlin.math.pow
import kotlin.math.roundToInt

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

    private var broadcastJob: Job? = null
    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private val locationRequest = LocationRequest.Builder(
        Priority.PRIORITY_HIGH_ACCURACY, 2000L
    ).apply {
        setMinUpdateDistanceMeters(2f)
    }.build()

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { _currentLocation.value = it }
        }
    }

    @SuppressLint("MissingPermission")
    fun startTracking(userId: String) {
        if (_isTracking.value) return
        _isTracking.value = true

        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            android.os.Looper.getMainLooper()
        )

        pressureSensor?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL)
        }

        broadcastJob = serviceScope.launch {
            while (isActive) {
                delay(5000L)
                broadcastLocation(userId)
            }
        }
    }

    fun stopTracking() {
        if (!_isTracking.value) return
        _isTracking.value = false
        fusedLocationClient.removeLocationUpdates(locationCallback)
        sensorManager.unregisterListener(this)
        broadcastJob?.cancel()
        broadcastJob = null
    }

    fun recalibrateGround() {
        groundAltitude = currentAltitude
        _currentFloor.value = 1
    }

    fun setFloorManually(floor: Int) {
        _currentFloor.value = floor
        groundAltitude = currentAltitude - (floor - 1) * metersPerFloor
    }

    // MARK: - SensorEventListener

    override fun onSensorChanged(event: SensorEvent?) {
        if (event?.sensor?.type != Sensor.TYPE_PRESSURE) return
        val pressureHPa = event.values[0] // hPa
        // Convert pressure to altitude using standard barometric formula
        // altitude (m) = 44330 * (1 - (P/P0)^(1/5.255)), P0 = 1013.25 hPa
        val seaLevel = SensorManager.PRESSURE_STANDARD_ATMOSPHERE // 1013.25 hPa
        val altitudeM = 44330.0 * (1.0 - (pressureHPa.toDouble() / seaLevel.toDouble()).pow(1.0 / 5.255))

        if (groundAltitude == null) {
            groundAltitude = altitudeM
        }
        currentAltitude = altitudeM
        _currentFloor.value = computeFloor(altitudeM)
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    private fun computeFloor(altitude: Double): Int {
        val ground = groundAltitude ?: return 1
        val delta = altitude - ground
        return if (delta < -2.0) {
            maxOf((delta / metersPerFloor).toInt(), -2)
        } else {
            maxOf((delta / metersPerFloor).roundToInt() + 1, 1)
        }
    }

    private fun broadcastLocation(userId: String) {
        val loc = _currentLocation.value ?: return
        val studentLocation = StudentLocation(
            userId = userId,
            latitude = loc.latitude,
            longitude = loc.longitude,
            altitude = currentAltitude,
            floor = _currentFloor.value,
            timestamp = System.currentTimeMillis()
        )
        webSocketManager.sendLocationUpdate(studentLocation)
    }
}
