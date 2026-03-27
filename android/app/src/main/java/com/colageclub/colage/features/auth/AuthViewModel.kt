package com.colageclub.colage.features.auth

import android.content.SharedPreferences
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.colageclub.colage.BuildConfig
import com.colageclub.colage.core.networking.ApiClient
import com.colageclub.colage.core.storage.SecureStorage
import com.colageclub.colage.data.models.*
import com.colageclub.colage.data.models.ServerType
import com.google.gson.Gson
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val apiClient: ApiClient,
    private val secureStorage: SecureStorage,
    private val prefs: SharedPreferences
) : ViewModel() {

    private val gson = Gson()

    // Onboarding state
    private val _onboardingData = MutableStateFlow(OnboardingData())
    val onboardingData: StateFlow<OnboardingData> = _onboardingData.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _emailVerified = MutableStateFlow(false)
    val emailVerified: StateFlow<Boolean> = _emailVerified.asStateFlow()

    private val _phoneVerified = MutableStateFlow(false)
    val phoneVerified: StateFlow<Boolean> = _phoneVerified.asStateFlow()

    var resolvedUniversity: University? = null

    // Dev mode — true in debug builds
    val devMode: Boolean get() = BuildConfig.DEV_MODE

    // MARK: - Domain Extraction

    fun extractDomain(email: String): String? {
        val atIndex = email.indexOf('@')
        if (atIndex < 0) return null
        val fullDomain = email.substring(atIndex + 1).lowercase()
        if (!fullDomain.endsWith(".edu")) return null
        val parts = fullDomain.split(".")
        if (parts.size < 2) return null
        return parts.takeLast(2).joinToString(".")
    }

    // MARK: - Email OTP

    fun sendEmailOTP(email: String, onResult: (Boolean) -> Unit) {
        _onboardingData.update { it.copy(email = email) }
        _isLoading.value = true
        _errorMessage.value = null

        viewModelScope.launch {
            if (devMode) {
                delay(800)
                _isLoading.value = false
                onResult(true)
                return@launch
            }
            try {
                apiClient.postEmailVerify(email.lowercase())
                _isLoading.value = false
                onResult(true)
            } catch (e: Exception) {
                _isLoading.value = false
                _errorMessage.value = e.message
                onResult(false)
            }
        }
    }

    fun confirmEmailOTP(code: String, onResult: (Boolean) -> Unit) {
        _isLoading.value = true
        _errorMessage.value = null

        viewModelScope.launch {
            if (devMode) {
                delay(500)
                _isLoading.value = false
                if (code.length == 6) {
                    _emailVerified.value = true
                    onResult(true)
                } else {
                    _errorMessage.value = "Invalid code"
                    onResult(false)
                }
                return@launch
            }
            try {
                val email = _onboardingData.value.email
                val result = apiClient.postEmailConfirm(email.lowercase(), code)
                _isLoading.value = false
                if (result.verified) {
                    _emailVerified.value = true
                }
                onResult(result.verified)
            } catch (e: Exception) {
                _isLoading.value = false
                _errorMessage.value = e.message
                onResult(false)
            }
        }
    }

    // MARK: - Phone OTP

    fun sendPhoneOTP(phone: String, onResult: (Boolean) -> Unit) {
        _onboardingData.update { it.copy(phone = phone) }
        _isLoading.value = true
        _errorMessage.value = null

        viewModelScope.launch {
            if (devMode) {
                delay(800)
                _isLoading.value = false
                onResult(true)
                return@launch
            }
            try {
                val email = _onboardingData.value.email
                apiClient.postPhoneVerify(phone, email.lowercase())
                _isLoading.value = false
                onResult(true)
            } catch (e: Exception) {
                _isLoading.value = false
                _errorMessage.value = e.message
                onResult(false)
            }
        }
    }

    fun confirmPhoneOTP(code: String, onResult: (Boolean) -> Unit) {
        _isLoading.value = true
        _errorMessage.value = null

        viewModelScope.launch {
            if (devMode) {
                delay(500)
                _isLoading.value = false
                if (code.length == 6) {
                    _phoneVerified.value = true
                    onResult(true)
                } else {
                    _errorMessage.value = "Invalid code"
                    onResult(false)
                }
                return@launch
            }
            try {
                val phone = _onboardingData.value.phone
                val result = apiClient.postPhoneConfirm(phone, code)
                _isLoading.value = false
                if (result.verified) _phoneVerified.value = true
                onResult(result.verified)
            } catch (e: Exception) {
                _isLoading.value = false
                _errorMessage.value = e.message
                onResult(false)
            }
        }
    }

    // MARK: - Profile

    fun updateOnboardingName(name: String) = _onboardingData.update { it.copy(displayName = name) }
    fun updateOnboardingBio(bio: String) = _onboardingData.update { it.copy(bio = bio) }
    fun updateOnboardingMajor(major: String) = _onboardingData.update { it.copy(major = major) }
    fun updateOnboardingPhoto(uri: Uri?) = _onboardingData.update { it.copy(profilePhotoUri = uri) }
    fun updateSocialLinks(links: Map<SocialPlatform, String>) = _onboardingData.update { it.copy(socialLinks = links) }
    fun updateServerType(type: ServerType) = _onboardingData.update { it.copy(serverType = type) }

    fun createProfile(onResult: (Boolean) -> Unit) {
        val data = _onboardingData.value
        val domain = extractDomain(data.email) ?: "unknown.edu"

        val profile = data.buildProfile(domain)
        saveProfileLocally(profile)
        prefs.edit()
            .putBoolean("onboarding_complete", true)
            .putString("user_email", data.email.lowercase())
            .apply()

        if (!devMode) {
            viewModelScope.launch {
                try {
                    val links = data.socialLinks
                        .filter { it.value.isNotEmpty() }
                        .map { SocialLink(platform = it.key, handle = it.value) }
                    val result = apiClient.postCreateProfile(
                        CreateProfileRequest(
                            email = data.email.lowercase(),
                            displayName = data.displayName,
                            bio = data.bio.ifEmpty { null },
                            major = data.major.ifEmpty { null },
                            socialLinks = links,
                            universityDomain = domain
                        )
                    )
                    // Update local profile with server-assigned userId
                    val updated = profile.copy(userId = result.profile.userId)
                    saveProfileLocally(updated)
                } catch (e: Exception) {
                    // Fire-and-forget — silently fail
                }
            }
        }

        onResult(true)
    }

    private fun saveProfileLocally(profile: UserProfile) {
        val json = gson.toJson(profile)
        prefs.edit().putString("user_profile", json).apply()
    }

    fun loadProfileFromStorage(): UserProfile? {
        val json = prefs.getString("user_profile", null) ?: return null
        return try {
            gson.fromJson(json, UserProfile::class.java)
        } catch (_: Exception) { null }
    }

    // MARK: - Login

    fun sendLoginOTP(email: String, onResult: (Boolean) -> Unit) {
        _onboardingData.update { it.copy(email = email) }
        _isLoading.value = true
        _errorMessage.value = null

        viewModelScope.launch {
            if (devMode) {
                delay(500)
                _isLoading.value = false
                onResult(true)
                return@launch
            }
            try {
                apiClient.postEmailVerify(email.lowercase())
                _isLoading.value = false
                onResult(true)
            } catch (e: Exception) {
                _isLoading.value = false
                _errorMessage.value = e.message
                onResult(false)
            }
        }
    }

    fun confirmLoginOTP(email: String, code: String, onResult: (Boolean) -> Unit) {
        _isLoading.value = true
        _errorMessage.value = null

        viewModelScope.launch {
            if (devMode) {
                delay(500)
                _isLoading.value = false
                if (code.length == 6) {
                    _emailVerified.value = true
                    _phoneVerified.value = true
                    // Restore or create profile
                    val existing = loadProfileFromStorage()
                    if (existing == null) {
                        _onboardingData.update { it.copy(email = email) }
                        val domain = extractDomain(email) ?: "unknown.edu"
                        val name = email.substringBefore("@").replaceFirstChar { it.uppercase() }
                        _onboardingData.update { it.copy(displayName = name) }
                        createProfile {}
                    }
                    prefs.edit().putBoolean("onboarding_complete", true).apply()
                    onResult(true)
                } else {
                    _errorMessage.value = "Invalid code"
                    onResult(false)
                }
                return@launch
            }
            try {
                val result = apiClient.postEmailConfirm(email.lowercase(), code)
                _isLoading.value = false
                if (result.verified) {
                    fetchAndStoreTokens()
                    _emailVerified.value = true
                    _phoneVerified.value = true
                }
                onResult(result.verified)
            } catch (e: Exception) {
                _isLoading.value = false
                _errorMessage.value = e.message
                onResult(false)
            }
        }
    }

    // MARK: - Token Management

    suspend fun completeOnboarding() {
        fetchAndStoreTokens()
    }

    private suspend fun fetchAndStoreTokens() {
        try {
            val email = _onboardingData.value.email
            val deviceId = secureStorage.getOrCreateDeviceId()
            val tokens = apiClient.postLogin(email.lowercase(), deviceId)
            secureStorage.set(SecureStorage.KEY_ACCESS_TOKEN, tokens.accessToken)
            secureStorage.set(SecureStorage.KEY_ID_TOKEN, tokens.idToken)
            tokens.refreshToken?.let {
                secureStorage.set(SecureStorage.KEY_REFRESH_TOKEN, it)
            }
            val expiry = System.currentTimeMillis() + tokens.expiresIn * 1000L
            prefs.edit().putLong("token_expiry", expiry).apply()
        } catch (e: Exception) {
            // Silently fail token fetch
        }
    }

    fun logout() {
        secureStorage.clearAll()
        prefs.edit()
            .remove("onboarding_complete")
            .remove("user_profile")
            .remove("token_expiry")
            .apply()
        _emailVerified.value = false
        _phoneVerified.value = false
        _onboardingData.value = OnboardingData()
    }

    fun clearError() {
        _errorMessage.value = null
    }
}
