package com.colageclub.colage.app

import android.content.SharedPreferences
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.colageclub.colage.BuildConfig
import android.content.Context
import android.net.Uri
import com.colageclub.colage.core.networking.ApiClient
import com.colageclub.colage.core.networking.WebSocketManager
import com.colageclub.colage.core.storage.SecureStorage
import com.colageclub.colage.core.university.UniversityService
import com.colageclub.colage.data.models.*
import com.google.gson.Gson
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
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
    @ApplicationContext private val appContext: Context,
    private val secureStorage: SecureStorage,
    private val prefs: SharedPreferences,
    val universityService: UniversityService,
    private val webSocketManager: WebSocketManager,
    val locationService: com.colageclub.colage.core.location.LocationService,
    private val apiClient: ApiClient,
    val adService: com.colageclub.colage.features.ads.AdService
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

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    fun clearError() { _error.value = null }

    // University state proxied from UniversityService
    val currentUniversity = universityService.currentUniversity
    val currentTheme = universityService.currentTheme
    val availableThemes = universityService.availableThemes

    val devMode: Boolean get() = BuildConfig.DEV_MODE

    val userEmail: String? get() = prefs.getString("user_email", null)

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
            val profileJson = secureStorage.getProfile()
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
        val json = secureStorage.getProfile() ?: return
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
        // Use id_token — backend needs email claim which is only in Cognito ID tokens
        val token = secureStorage.get(SecureStorage.KEY_ID_TOKEN) ?: secureStorage.get(SecureStorage.KEY_ACCESS_TOKEN)
        webSocketManager.connect(domain, profile.userId, token)
        viewModelScope.launch {
            universityService.resolveUniversity(domain)
        }
        // Sync profile from server (matches iOS refreshProfileFromServer)
        refreshProfileFromServer()
    }

    fun logout() {
        webSocketManager.disconnect()
        secureStorage.clearAll()
        prefs.edit()
            .remove("onboarding_complete")
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
        secureStorage.saveProfile(json)
    }

    fun selectTheme(theme: UniversityTheme) {
        universityService.selectTheme(theme)
    }

    fun updateProfileOnServer(
        updatedProfile: UserProfile,
        newPhotoUri: Uri? = null,
        onComplete: () -> Unit = {}
    ) {
        // Update locally immediately
        updateProfile(updatedProfile)

        if (devMode) {
            onComplete()
            return
        }

        viewModelScope.launch {
            try {
                var photoUrl = updatedProfile.profilePhotoURL

                // Upload photo if changed
                if (newPhotoUri != null) {
                    val contentType = "image/jpeg"
                    val uploadUrlResp = apiClient.getPhotoUploadUrl(updatedProfile.userId, contentType)

                    val inputStream = appContext.contentResolver.openInputStream(newPhotoUri)
                    val bytes = inputStream?.readBytes()
                    inputStream?.close()

                    if (bytes != null) {
                        apiClient.uploadToS3(uploadUrlResp.uploadUrl, bytes, contentType)
                        photoUrl = uploadUrlResp.publicUrl
                    }
                }

                // Update profile on server
                apiClient.updateProfile(
                    updatedProfile.userId,
                    UpdateProfileRequest(
                        displayName = updatedProfile.displayName,
                        bio = updatedProfile.bio,
                        major = updatedProfile.major,
                        profilePhotoURL = photoUrl,
                        socialLinks = updatedProfile.socialLinks
                    )
                )

                // Update local with server photo URL
                if (photoUrl != updatedProfile.profilePhotoURL) {
                    updateProfile(updatedProfile.copy(profilePhotoURL = photoUrl))
                }
            } catch (_: Exception) {
                _error.value = "Failed to save profile"
            }
            onComplete()
        }
    }

    fun deleteAccount(onResult: (Boolean) -> Unit) {
        val userId = _currentProfile.value?.userId ?: run { onResult(false); return }
        viewModelScope.launch {
            try {
                apiClient.deleteProfile(userId)
            } catch (_: Exception) {
                // Continue with local cleanup even if server fails
            }
            logout()
            onResult(true)
        }
    }

    fun switchServerType(to: ServerType, onResult: (Boolean) -> Unit) {
        val userId = _currentProfile.value?.userId ?: run { onResult(false); return }
        viewModelScope.launch {
            try {
                apiClient.putUpdateProfile(userId, mapOf("serverType" to to.name.lowercase()))
                val profile = _currentProfile.value?.copy(serverType = to)
                if (profile != null) updateProfile(profile)
                onResult(true)
            } catch (_: Exception) {
                onResult(false)
            }
        }
    }

    fun refreshProfileFromServer() {
        val profile = _currentProfile.value ?: return
        if (devMode) return

        viewModelScope.launch {
            try {
                val wrapper = apiClient.getMe()
                val resp = wrapper.profile
                val updated = profile.copy(
                    userId = resp.userId,
                    displayName = resp.displayName ?: profile.displayName,
                    profilePhotoURL = resp.profilePhotoURL ?: profile.profilePhotoURL,
                    bio = resp.bio ?: profile.bio,
                    major = resp.major ?: profile.major,
                    socialLinks = resp.socialLinks ?: profile.socialLinks,
                    universityDomain = resp.universityDomain ?: profile.universityDomain
                )
                updateProfile(updated)
            } catch (_: Exception) {
                // Silently fail
            }
        }
    }
}
