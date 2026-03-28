package com.colageclub.colage.features.auth

import android.net.Uri
import com.colageclub.colage.data.models.ServerType
import com.colageclub.colage.data.models.SocialLink
import com.colageclub.colage.data.models.SocialPlatform
import com.colageclub.colage.data.models.UserProfile

data class OnboardingData(
    val email: String = "",
    val displayName: String = "",
    val bio: String = "",
    val major: String = "",
    val profilePhotoUri: Uri? = null,
    val socialLinks: Map<SocialPlatform, String> = emptyMap(),
    val serverType: ServerType = ServerType.STUDENT
) {
    fun buildProfile(domain: String): UserProfile {
        val links = socialLinks
            .filter { it.value.isNotEmpty() }
            .map { SocialLink(platform = it.key, handle = it.value) }

        return UserProfile(
            userId = java.util.UUID.randomUUID().toString(),
            universityDomain = domain,
            displayName = displayName,
            profilePhotoURL = null,
            bio = bio.ifEmpty { null },
            major = major.ifEmpty { null },
            socialLinks = links,
            isVisible = true,
            serverType = serverType,
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )
    }
}
