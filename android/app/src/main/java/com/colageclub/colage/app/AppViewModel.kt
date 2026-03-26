package com.colageclub.colage.app

import android.content.SharedPreferences
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.colageclub.colage.BuildConfig
import com.colageclub.colage.core.networking.WebSocketManager
import com.colageclub.colage.core.storage.SecureStorage
import com.colageclub.colage.core.university.UniversityService
import com.colageclub.colage.data.models.University
import com.colageclub.colage.data.models.UniversityTheme
import com.colageclub.colage.data.models.UserProfile
import com.google.gson.Gson
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class AuthState { LOADING, ONBOARDING, AUTHENTICATED }

enum class DiscoveryMode(val label: String) {
    MAP("Map"),
    LIST("List"),
    AR("AR")
}

@HiltViewModel
class AppViewModel @Inject constructor(
    private val secureStorage: SecureStorage,
    private val prefs: SharedPreferences,
    val universityService: UniversityService,
    private val webSocketManager: WebSocketManager,
    val locationService: com.colageclub.colage.core.location.LocationService
) : ViewModel() {

    private val gson = Gson()

    private val _authState = MutableStateFlow(AuthState.LOADING)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    private val _discoveryMode = MutableStateFlow(DiscoveryMode.MAP)
    val discoveryMode: StateFlow<DiscoveryMode> = _discoveryMode.asStateFlow()

    private val _isVisible = MutableStateFlow(true)
    val isVisible: StateFlow<Boolean> = _isVisible.asStateFlow()

    private val _currentFloor = MutableStateFlow(1)
    val currentFloor: StateFlow<Int> = _currentFloor.asStateFlow()

    private val _currentProfile = MutableStateFlow<UserProfile?>(null)
    val currentProfile: StateFlow<UserProfile?> = _currentProfile.asStateFlow()

    // University state proxied from UniversityService
    val currentUniversity = universityService.currentUniversity
    val currentTheme = universityService.currentTheme
    val availableThemes = universityService.availableThemes

    val devMode: Boolean get() = BuildConfig.DEV_MODE

    fun checkExistingSession() {
        if (devMode) {
            val onboardingComplete = prefs.getBoolean("onboarding_complete", false)
            if (onboardingComplete) {
                loadProfileFromStorage()
                _authState.value = AuthState.AUTHENTICATED
            } else {
                _authState.value = AuthState.ONBOARDING
            }
        } else {
            val profileJson = prefs.getString("user_profile", null)
            if (profileJson != null) {
                try {
                    val profile = gson.fromJson(profileJson, UserProfile::class.java)
                    _currentProfile.value = profile
                    _authState.value = AuthState.AUTHENTICATED
                    return
                } catch (_: Exception) {}
            }
            if (secureStorage.get(SecureStorage.KEY_ACCESS_TOKEN) != null) {
                _authState.value = AuthState.AUTHENTICATED
            } else {
                _authState.value = AuthState.ONBOARDING
            }
        }
    }

    private fun loadProfileFromStorage() {
        val json = prefs.getString("user_profile", null) ?: return
        try {
            _currentProfile.value = gson.fromJson(json, UserProfile::class.java)
        } catch (_: Exception) {}
    }

    fun setAuthenticated() {
        loadProfileFromStorage()
        _authState.value = AuthState.AUTHENTICATED
        // Resolve university after login
        _currentProfile.value?.universityDomain?.let { domain ->
            viewModelScope.launch {
                universityService.resolveUniversity(domain)
            }
        }
    }

    fun onHomeReady() {
        // Connect WebSocket + resolve university when home screen appears
        val profile = _currentProfile.value ?: return
        val domain = profile.universityDomain
        val token = secureStorage.get(SecureStorage.KEY_ACCESS_TOKEN)
        webSocketManager.connect(domain, profile.userId, token)
        viewModelScope.launch {
            universityService.resolveUniversity(domain)
        }
    }

    fun logout() {
        webSocketManager.disconnect()
        secureStorage.clearAll()
        prefs.edit()
            .remove("onboarding_complete")
            .remove("user_profile")
            .remove("token_expiry")
            .apply()
        _currentProfile.value = null
        _authState.value = AuthState.ONBOARDING
    }

    fun setOnboarding() {
        _authState.value = AuthState.ONBOARDING
    }

    fun setDiscoveryMode(mode: DiscoveryMode) {
        _discoveryMode.value = mode
    }

    fun toggleVisibility() {
        _isVisible.value = !_isVisible.value
    }

    fun setFloor(floor: Int) {
        _currentFloor.value = floor
    }

    fun updateProfile(profile: UserProfile) {
        _currentProfile.value = profile
        val json = gson.toJson(profile)
        prefs.edit().putString("user_profile", json).apply()
    }

    fun selectTheme(theme: UniversityTheme) {
        universityService.selectTheme(theme)
    }
}
