package com.colageclub.colage.features.discovery

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.colageclub.colage.BuildConfig
import com.colageclub.colage.core.networking.ApiClient
import com.colageclub.colage.core.networking.WebSocketManager
import com.colageclub.colage.data.models.NearbyStudent
import com.colageclub.colage.data.models.SocialLink
import com.colageclub.colage.data.models.SocialPlatform
import com.colageclub.colage.data.models.StudentLocation
import com.colageclub.colage.data.models.UserProfile
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import kotlin.math.abs
import kotlin.math.pow
import kotlin.random.Random

@HiltViewModel
class NearbyStudentsViewModel @Inject constructor(
    private val apiClient: ApiClient,
    private val webSocketManager: WebSocketManager
) : ViewModel() {

    private val _students = MutableStateFlow<List<NearbyStudent>>(emptyList())
    val students: StateFlow<List<NearbyStudent>> = _students.asStateFlow()

    private val _maxDistance = MutableStateFlow(0.5f) // list slider 0..1
    val maxDistance: StateFlow<Float> = _maxDistance.asStateFlow()

    private val _arMaxDistance = MutableStateFlow(0.5f) // AR slider 0..1
    val arMaxDistance: StateFlow<Float> = _arMaxDistance.asStateFlow()

    private val _filterFloor = MutableStateFlow<Int?>(null)
    val filterFloor: StateFlow<Int?> = _filterFloor.asStateFlow()

    fun setMaxDistance(value: Float) { _maxDistance.value = value }
    fun setArMaxDistance(value: Float) { _arMaxDistance.value = value }
    fun setFilterFloor(floor: Int?) { _filterFloor.value = floor }

    val listDistanceFeet: Double get() = sliderToFeet(_maxDistance.value.toDouble())
    val arDistanceFeet: Double get() = sliderToFeet(_arMaxDistance.value.toDouble())

    /** Map students — all on selected floor, no distance limit */
    fun mapStudents(): List<NearbyStudent> {
        val floor = _filterFloor.value
        return _students.value
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

    // MARK: - Real Data

    private var currentUserId: String? = null

    fun fetchNearbyStudents(latitude: Double, longitude: Double, domain: String, selfUserId: String?) {
        currentUserId = selfUserId
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
                                floor = s.location.floor ?: 1
                            ),
                            distance = s.distance
                        )
                    }
            } catch (e: Exception) {
                // Silently fail — keep showing whatever we have
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
    }

    fun stopListening() {
        webSocketManager.onStudentJoined = null
        webSocketManager.onStudentLeft = null
        webSocketManager.onLocationUpdate = null
    }

    private fun handleLocationUpdate(location: StudentLocation) {
        if (location.userId == currentUserId) return

        val current = _students.value.toMutableList()
        val index = current.indexOfFirst { it.profile.userId == location.userId }

        if (index >= 0) {
            current[index] = current[index].copy(location = location)
        } else {
            // New student from WebSocket — create with broadcast profile data
            val profile = UserProfile(
                userId = location.userId,
                universityDomain = "",
                displayName = location.displayName ?: "Student",
                profilePhotoURL = location.profilePhotoURL,
                major = location.major
            )
            current.add(NearbyStudent(profile = profile, location = location, distance = 0.0))
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
