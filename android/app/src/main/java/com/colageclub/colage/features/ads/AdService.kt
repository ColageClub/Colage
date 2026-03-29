package com.colageclub.colage.features.ads

import android.location.Location
import com.colageclub.colage.data.models.AdData
import com.google.gson.Gson
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.Timer
import java.util.TimerTask
import com.colageclub.colage.BuildConfig
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AdService @Inject constructor(
    private val locationService: com.colageclub.colage.core.location.LocationService
) {
    private val baseUrl = BuildConfig.AD_BASE_URL
    private val httpClient = OkHttpClient()
    private val gson = Gson()

    private val _currentAd = MutableStateFlow<AdData?>(null)
    val currentAd: StateFlow<AdData?> = _currentAd.asStateFlow()

    private var rotationTimer: Timer? = null
    private var rotationSchool: String = ""
    private var rotationStudentId: String = ""
    var userLocation: Location? = null

    /** Fetch an ad from the server */
    suspend fun fetchAd(school: String, studentId: String, location: Location? = null) {
        withContext(Dispatchers.IO) {
            try {
                val url = "$baseUrl/api/ads/serve?school=$school&student_id=$studentId"
                val request = Request.Builder().url(url).get().build()
                val response = httpClient.newCall(request).execute()
                val body = response.body?.string() ?: return@withContext
                val parsed = gson.fromJson(body, AdServeResponse::class.java)

                parsed.ad?.let { ad ->
                    // Calculate distance — use provided location, cached, or from LocationService
                    val loc = location ?: userLocation ?: locationService.currentLocation.value
                    if (loc != null && (ad.lat ?: 0.0) != 0.0 && (ad.lng ?: 0.0) != 0.0) {
                        val adLoc = Location("ad").apply {
                            latitude = ad.lat ?: 0.0
                            longitude = ad.lng ?: 0.0
                        }
                        val meters = loc.distanceTo(adLoc)
                        val miles = meters / 1609.34f
                        ad.distance = String.format("%.1f mi", miles)
                    }
                    _currentAd.value = ad
                } // If null, keep showing current ad
            } catch (e: Exception) {
                // Keep current ad on failure
            }
        }
    }

    /** Track a tap */
    suspend fun trackTap(adId: String, studentId: String) {
        withContext(Dispatchers.IO) {
            try {
                val json = gson.toJson(mapOf("adId" to adId, "studentId" to studentId, "action" to "tap"))
                val request = Request.Builder()
                    .url("$baseUrl/api/ads/serve")
                    .post(json.toRequestBody("application/json".toMediaType()))
                    .build()
                httpClient.newCall(request).execute()
            } catch (_: Exception) {}
        }
    }

    /** Start auto-rotation */
    fun startRotation(school: String, studentId: String, location: Location? = null) {
        rotationSchool = school
        rotationStudentId = studentId
        userLocation = location

        rotationTimer?.cancel()
        rotationTimer = Timer().apply {
            scheduleAtFixedRate(object : TimerTask() {
                override fun run() {
                    CoroutineScope(Dispatchers.IO).launch {
                        fetchAd(rotationSchool, rotationStudentId, userLocation)
                    }
                }
            }, 30_000L, 30_000L)
        }
    }

    fun stopRotation() {
        rotationTimer?.cancel()
        rotationTimer = null
    }

    data class AdServeResponse(val ad: AdData?)
}
