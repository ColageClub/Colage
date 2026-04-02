package com.colageclub.colage.features.discovery

import android.location.Location
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.colageclub.colage.BuildConfig
import com.colageclub.colage.core.location.LocationService
import com.colageclub.colage.core.networking.ApiClient
import com.colageclub.colage.core.networking.WebSocketManager
import com.colageclub.colage.data.models.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import javax.inject.Inject
import kotlin.math.abs
import kotlin.math.pow
import kotlin.random.Random

@HiltViewModel
class NearbyStudentsViewModel @Inject constructor(
    private val apiClient: ApiClient,
    private val webSocketManager: WebSocketManager,
    private val locationService: LocationService
) : ViewModel() {

    private val _students = MutableStateFlow<List<NearbyStudent>>(emptyList())
    val students: StateFlow<List<NearbyStudent>> = _students.asStateFlow()

    private val _mapViewportStudents = MutableStateFlow<List<NearbyStudent>>(emptyList())
    val mapViewportStudents: StateFlow<List<NearbyStudent>> = _mapViewportStudents.asStateFlow()

    private val _totalInViewport = MutableStateFlow(0)
    val totalInViewport: StateFlow<Int> = _totalInViewport.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun clearError() { _error.value = null }

    private val _maxDistance = MutableStateFlow(0.5f) // list slider 0..1
    val maxDistance: StateFlow<Float> = _maxDistance.asStateFlow()

    private val _arMaxDistance = MutableStateFlow(0.5f) // AR slider 0..1
    val arMaxDistance: StateFlow<Float> = _arMaxDistance.asStateFlow()

    private val _filterFloor = MutableStateFlow<Int?>(null)
    val filterFloor: StateFlow<Int?> = _filterFloor.asStateFlow()

    private val _lastFetchTime = MutableStateFlow(0L)
    val lastFetchTime: StateFlow<Long> = _lastFetchTime.asStateFlow()

    val isWebSocketConnected: StateFlow<Boolean> get() = webSocketManager.isConnected

    // Stored viewport bounds for map refresh
    var currentViewportSW: Pair<Double, Double>? = null
    var currentViewportNE: Pair<Double, Double>? = null

    fun setMaxDistance(value: Float) { _maxDistance.value = value }
    fun setArMaxDistance(value: Float) { _arMaxDistance.value = value }
    fun setFilterFloor(floor: Int?) { _filterFloor.value = floor }

    val listDistanceFeet: Double get() = sliderToFeet(_maxDistance.value.toDouble())
    val arDistanceFeet: Double get() = sliderToFeet(_arMaxDistance.value.toDouble())

    /** Map students — uses viewport data when available, falls back to full list */
    fun mapStudents(): List<NearbyStudent> {
        val floor = _filterFloor.value
        val source = _mapViewportStudents.value.ifEmpty { _students.value }
        return source
            .filter { floor == null || it.location.floor == floor }
            .sortedBy { it.distance }
    }

    /** List students — distance + floor filtered */
    fun filteredStudents(): List<NearbyStudent> {
        val floor = _filterFloor.value
        val maxDist = listDistanceFeet
        return _students.value
            .filter { it.distance <= maxDist && (floor == null || it.location.floor == floor) }
            .sortedBy { it.distance }
    }

    /** AR students — own radius + floor */
    fun arFilteredStudents(): List<NearbyStudent> {
        val floor = _filterFloor.value
        val maxDist = arDistanceFeet
        return _students.value
            .filter { it.distance <= maxDist && (floor == null || it.location.floor == floor) }
            .sortedBy { it.distance }
    }

    fun loadMockData() {
        if (!BuildConfig.DEV_MODE) return
        val baseLat = 42.2780
        val baseLng = -83.7382
        _students.value = (0 until 20).map { mockStudent(it, baseLat, baseLng) }
    }

    // MARK: - Periodic Refresh

    private var refreshJob: Job? = null
    private var mapRefreshJob: Job? = null
    private var listRefreshJob: Job? = null
    private var lastFetchLat: Double = 0.0
    private var lastFetchLng: Double = 0.0
    private var lastFetchDomain: String = ""

    /** Start periodic list refresh (every 15s) */
    fun startListRefresh() {
        listRefreshJob?.cancel()
        listRefreshJob = viewModelScope.launch {
            while (isActive) {
                delay(15_000)
                val location = locationService.currentLocation.value
                val lat = location?.latitude ?: lastFetchLat
                val lng = location?.longitude ?: lastFetchLng
                if (lastFetchDomain.isNotEmpty()) {
                    fetchNearbyStudents(lat, lng, lastFetchDomain, currentUserId)
                }
            }
        }
    }

    /** Start periodic map viewport refresh (every 20s) */
    fun startMapRefresh() {
        mapRefreshJob?.cancel()
        mapRefreshJob = viewModelScope.launch {
            while (isActive) {
                delay(20_000)
                refreshViewport()
            }
        }
    }

    fun stopPeriodicRefresh() {
        refreshJob?.cancel()
        refreshJob = null
        mapRefreshJob?.cancel()
        mapRefreshJob = null
        listRefreshJob?.cancel()
        listRefreshJob = null
    }

    // MARK: - Viewport API

    fun fetchViewportStudents(
        swLat: Double, swLng: Double, neLat: Double, neLng: Double,
        myLat: Double, myLng: Double, floor: Int? = null
    ) {
        if (BuildConfig.DEV_MODE) return
        val domain = lastFetchDomain.ifEmpty { return }
        viewModelScope.launch {
            try {
                val resp = apiClient.getNearbyViewport(
                    domain = domain,
                    swLat = swLat, swLng = swLng,
                    neLat = neLat, neLng = neLng,
                    myLat = myLat, myLng = myLng,
                    floor = floor
                )
                _mapViewportStudents.value = resp.students
                    .filter { it.userId != currentUserId }
                    .map { s ->
                        NearbyStudent(
                            profile = UserProfile(
                                userId = s.userId,
                                universityDomain = domain,
                                displayName = s.displayName ?: "Student",
                                profilePhotoURL = s.profilePhotoURL,
                                bio = s.bio,
                                major = s.major
                            ),
                            location = StudentLocation(
                                userId = s.userId,
                                latitude = s.latitude,
                                longitude = s.longitude,
                                floor = s.floor ?: 1,
                                lastSeen = s.lastSeen
                            ),
                            distance = s.distance ?: 0.0
                        )
                    }
                _totalInViewport.value = resp.totalInViewport
            } catch (e: Exception) {
                // Non-fatal — map just shows stale data
            }
        }
    }

    private fun refreshViewport() {
        val sw = currentViewportSW ?: return
        val ne = currentViewportNE ?: return
        val location = locationService.currentLocation.value ?: return
        fetchViewportStudents(
            swLat = sw.first, swLng = sw.second,
            neLat = ne.first, neLng = ne.second,
            myLat = location.latitude, myLng = location.longitude
        )
    }

    // MARK: - Real Data

    private var currentUserId: String? = null

    fun fetchNearbyStudents(latitude: Double, longitude: Double, domain: String, selfUserId: String?) {
        currentUserId = selfUserId
        lastFetchLat = latitude
        lastFetchLng = longitude
        lastFetchDomain = domain
        if (BuildConfig.DEV_MODE) return

        viewModelScope.launch {
            try {
                val resp: NearbyResponse = apiClient.request(
                    method = "GET",
                    path = "/nearby?domain=$domain&lat=$latitude&lng=$longitude&maxDistance=5000",
                    responseClass = NearbyResponse::class.java
                )
                _students.value = resp.students
                    .filter { it.profile.userId != selfUserId }
                    .map { s ->
                        NearbyStudent(
                            profile = UserProfile(
                                userId = s.profile.userId,
                                universityDomain = domain,
                                displayName = s.profile.displayName ?: "Student",
                                profilePhotoURL = s.profile.profilePhotoURL,
                                bio = s.profile.bio,
                                major = s.profile.major,
                                socialLinks = s.profile.socialLinks ?: emptyList()
                            ),
                            location = StudentLocation(
                                userId = s.profile.userId,
                                latitude = s.location.latitude,
                                longitude = s.location.longitude,
                                floor = s.location.floor ?: 1,
                                lastSeen = s.location.lastSeen
                            ),
                            distance = s.distance
                        )
                    }
                _lastFetchTime.value = System.currentTimeMillis()
            } catch (e: Exception) {
                _error.value = "Failed to load nearby students"
            }
        }
    }

    fun startListeningForUpdates() {
        webSocketManager.onStudentJoined = { location ->
            handleLocationUpdate(location)
        }
        webSocketManager.onStudentLeft = { userId ->
            _students.value = _students.value.filter { it.profile.userId != userId }
        }
        webSocketManager.onLocationUpdate = { locations ->
            locations.forEach { handleLocationUpdate(it) }
        }
        webSocketManager.onReconnected = {
            // Re-fetch nearby students after WebSocket reconnection
            val location = locationService.currentLocation.value
            if (location != null && lastFetchDomain.isNotEmpty()) {
                fetchNearbyStudents(location.latitude, location.longitude, lastFetchDomain, currentUserId)
            }
        }
    }

    fun stopListening() {
        webSocketManager.onStudentJoined = null
        webSocketManager.onStudentLeft = null
        webSocketManager.onLocationUpdate = null
        webSocketManager.onReconnected = null
        stopPeriodicRefresh()
    }

    private fun calculateDistanceFeet(studentLocation: StudentLocation): Double {
        val userLoc = locationService.currentLocation.value ?: return 0.0
        val from = Location("").apply {
            latitude = userLoc.latitude
            longitude = userLoc.longitude
        }
        val to = Location("").apply {
            latitude = studentLocation.latitude
            longitude = studentLocation.longitude
        }
        val distanceMeters = from.distanceTo(to)
        return distanceMeters * 3.28084
    }

    private fun handleLocationUpdate(location: StudentLocation) {
        if (location.userId == currentUserId) return

        val distanceFeet = calculateDistanceFeet(location)
        val current = _students.value.toMutableList()
        val index = current.indexOfFirst { it.profile.userId == location.userId }

        if (index >= 0) {
            current[index] = current[index].copy(location = location, distance = distanceFeet)
        } else {
            // New student from WebSocket — create with broadcast profile data
            val profile = UserProfile(
                userId = location.userId,
                universityDomain = "",
                displayName = location.displayName ?: "Student",
                profilePhotoURL = location.profilePhotoURL,
                major = location.major
            )
            current.add(NearbyStudent(profile = profile, location = location, distance = distanceFeet))
        }
        _students.value = current
    }

    companion object {
        fun sliderToFeet(value: Double): Double {
            val minFeet = 10.0
            val maxFeet = 500.0
            return minFeet * (maxFeet / minFeet).pow(value)
        }

        private val names = listOf(
            "Emma Wilson", "James Chen", "Sofia Rodriguez", "Liam O'Brien",
            "Aisha Johnson", "Noah Kim", "Olivia Park", "Ethan Davis",
            "Maya Patel", "Lucas Martinez", "Zoe Thompson", "Kai Nakamura"
        )
        private val majors = listOf(
            "Computer Science", "Psychology", "Biology", "Engineering",
            "English", "Business", "Art History", "Mathematics",
            "Political Science", "Chemistry", "Music", "Economics"
        )

        fun mockStudent(index: Int, baseLat: Double, baseLng: Double): NearbyStudent {
            val name = names[index % names.size]
            val major = majors[index % majors.size]
            val latOffset = Random.nextDouble(-0.002, 0.002)
            val lngOffset = Random.nextDouble(-0.002, 0.002)
            val dist = Random.nextDouble(10.0, 2000.0)
            val allFloors = listOf(-2, -1, 1, 2, 3, 4, 5, 6)
            val floor = if (index < 6) 1 else allFloors[(index - 6) % allFloors.size]

            return NearbyStudent(
                profile = UserProfile(
                    userId = "mock-$index",
                    universityDomain = "umich.edu",
                    displayName = name,
                    bio = "Just a $major student ✌️",
                    major = major,
                    socialLinks = listOf(
                        SocialLink(SocialPlatform.INSTAGRAM, "@${name.lowercase().replace(" ", "")}"),
                        SocialLink(SocialPlatform.SNAPCHAT, name.lowercase().replace(" ", "_"))
                    )
                ),
                location = StudentLocation(
                    userId = "mock-$index",
                    latitude = baseLat + latOffset,
                    longitude = baseLng + lngOffset,
                    floor = floor
                ),
                distance = dist
            )
        }
    }
}
