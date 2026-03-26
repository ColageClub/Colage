package com.colageclub.colage.features.ads

import com.colageclub.colage.BuildConfig
import com.colageclub.colage.core.networking.ApiClient
import com.colageclub.colage.data.models.AdData
import com.colageclub.colage.data.models.MockAds
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AdService @Inject constructor(
    private val apiClient: ApiClient
) {
    private val _currentAd = MutableStateFlow<AdData?>(null)
    val currentAd: StateFlow<AdData?> = _currentAd.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private var ads = mutableListOf<AdData>()
    private var currentIndex = 0

    /** Fetch an ad from the server for the given school */
    suspend fun fetchAd(school: String, studentId: String) {
        if (BuildConfig.DEV_MODE) {
            if (ads.isEmpty()) ads.addAll(MockAds.all)
            _currentAd.value = ads.firstOrNull()
            return
        }

        _isLoading.value = true
        try {
            val response = apiClient.request(
                method = "GET",
                path = "/api/ads/serve?school=$school&student_id=$studentId",
                responseClass = AdServeResponse::class.java
            )
            response.ad?.let { ad ->
                _currentAd.value = ad
                if (ads.none { it.id == ad.id }) ads.add(ad)
            }
        } catch (e: Exception) {
            // Fallback to mock
            if (ads.isEmpty()) ads.addAll(MockAds.all)
            _currentAd.value = ads.firstOrNull()
        } finally {
            _isLoading.value = false
        }
    }

    /** Track a tap on an ad */
    suspend fun trackTap(adId: String, studentId: String) {
        if (BuildConfig.DEV_MODE) return
        try {
            apiClient.request(
                method = "POST",
                path = "/api/ads/serve",
                body = mapOf("adId" to adId, "studentId" to studentId, "action" to "tap"),
                responseClass = Map::class.java
            )
        } catch (_: Exception) {}
    }

    /** Rotate to next ad */
    fun rotateAd() {
        if (ads.isEmpty()) return
        currentIndex = (currentIndex + 1) % ads.size
        _currentAd.value = ads[currentIndex]
    }

    data class AdServeResponse(
        val ad: AdData?
    )
}
