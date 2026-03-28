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

        if (devMode) {
            saveProfileLocally(profile)
            prefs.edit()
                .putBoolean("onboarding_complete", true)
                .putString("user_email", data.email.lowercase())
                .apply()
            onResult(true)
            return
        }

        _isLoading.value = true
        _errorMessage.value = null

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
                prefs.edit()
                    .putBoolean("onboarding_complete", true)
                    .putString("user_email", data.email.lowercase())
                    .apply()
                _isLoading.value = false
                onResult(true)
            } catch (e: Exception) {
                _isLoading.value = false
                _errorMessage.value = e.message ?: "Failed to create profile"
                onResult(false)
            }
        }
    }

    private fun saveProfileLocally(profile: UserProfile) {
        val json = gson.toJson(profile)
        secureStorage.saveProfile(json)
    }

    fun loadProfileFromStorage(): UserProfile? {
        val json = secureStorage.getProfile() ?: return null
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
                if (result.verified) {
                    fetchAndStoreTokens()
                    // Fetch profile from server using authenticated /auth/me
                    try {
                        val wrapper = apiClient.getMe()
                        val resp = wrapper.profile
                        val serverType = try {
                            ServerType.valueOf((resp.serverType ?: "student").uppercase())
                        } catch (_: Exception) { ServerType.STUDENT }
                        val profile = UserProfile(
                            userId = resp.userId,
                            universityDomain = resp.universityDomain ?: extractDomain(email) ?: "unknown.edu",
                            displayName = resp.displayName ?: email.substringBefore("@"),
                            profilePhotoURL = resp.profilePhotoURL,
                            bio = resp.bio,
                            major = resp.major,
                            socialLinks = resp.socialLinks ?: emptyList(),
                            serverType = serverType
                        )
                        saveProfileLocally(profile)
                    } catch (_: Exception) {
                        // Profile fetch failed — user can still proceed, will sync later
                    }
                    _emailVerified.value = true
                }
                _isLoading.value = false
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

    // MARK: - Server Type Switch

    fun switchServerType(to: ServerType, onResult: (Boolean) -> Unit) {
        val userId = loadProfileFromStorage()?.userId ?: run { onResult(false); return }
        viewModelScope.launch {
            try {
                apiClient.putUpdateProfile(userId, mapOf("serverType" to to.name.lowercase()))
                // Update local
                val profile = loadProfileFromStorage()?.copy(serverType = to)
                if (profile != null) saveProfileLocally(profile)
                onResult(true)
            } catch (e: Exception) {
                onResult(false)
            }
        }
    }

    // MARK: - Account Deletion

    fun deleteAccount(onResult: (Boolean) -> Unit) {
        val userId = loadProfileFromStorage()?.userId ?: run { onResult(false); return }
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

    fun logout() {
        secureStorage.clearAll()
        prefs.edit()
            .remove("onboarding_complete")
            .remove("user_email")
            .remove("token_expiry")
            .apply()
        _emailVerified.value = false
        _onboardingData.value = OnboardingData()
    }

    fun clearError() {
        _errorMessage.value = null
    }
}
