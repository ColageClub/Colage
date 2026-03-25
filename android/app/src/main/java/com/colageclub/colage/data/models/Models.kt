package com.colageclub.colage.data.models

import com.google.gson.annotations.SerializedName
import java.util.Date

// MARK: - University

data class University(
    val id: String,
    val domain: String,
    val name: String,
    val memberCount: Int = 0,
    val brandingThemes: List<UniversityTheme> = emptyList()
)

// MARK: - University Theme

data class UniversityTheme(
    val id: String,
    val name: String,
    val primaryColor: String,
    val accentColor: String,
    val textColor: String,
    val backgroundAsset: String? = null
) {
    companion object {
        val default = UniversityTheme(
            id = "default",
            name = "Classic",
            primaryColor = "#A51C30",
            accentColor = "#00CEC9",
            textColor = "#FFFFFF",
            backgroundAsset = null
        )
    }
}

// MARK: - User Profile

data class UserProfile(
    val userId: String,
    val universityDomain: String,
    val displayName: String,
    val profilePhotoURL: String? = null,
    val bio: String? = null,
    val major: String? = null,
    val socialLinks: List<SocialLink> = emptyList(),
    val isVisible: Boolean = true,
    val serverType: ServerType = ServerType.STUDENT,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

// MARK: - Social Link

data class SocialLink(
    val platform: SocialPlatform,
    val handle: String
) {
    fun url(): String? {
        return when (platform) {
            SocialPlatform.INSTAGRAM -> "https://instagram.com/${handle.trimStart('@')}"
            SocialPlatform.TIKTOK -> "https://tiktok.com/@${handle.trimStart('@')}"
            SocialPlatform.X -> "https://x.com/${handle.trimStart('@')}"
            SocialPlatform.SNAPCHAT -> "https://snapchat.com/add/$handle"
            SocialPlatform.FACEBOOK -> if (handle.startsWith("http")) handle else "https://facebook.com/$handle"
            SocialPlatform.BEREAL -> "https://bere.al/$handle"
            SocialPlatform.LINKEDIN -> if (handle.startsWith("http")) handle else "https://linkedin.com/in/$handle"
            SocialPlatform.CUSTOM1, SocialPlatform.CUSTOM2, SocialPlatform.CUSTOM3 ->
                if (handle.startsWith("http")) handle else "https://$handle"
        }
    }
}

enum class SocialPlatform(val displayName: String, val iconRes: String) {
    INSTAGRAM("Instagram", "camera"),
    TIKTOK("TikTok", "music_note"),
    X("X", "alternate_email"),
    SNAPCHAT("Snapchat", "bolt"),
    FACEBOOK("Facebook", "group"),
    BEREAL("BeReal", "visibility"),
    LINKEDIN("LinkedIn", "work"),
    CUSTOM1("Link 1", "link"),
    CUSTOM2("Link 2", "link"),
    CUSTOM3("Link 3", "link");

    companion object {
        fun fromString(value: String): SocialPlatform? =
            entries.find { it.name.equals(value, ignoreCase = true) }
    }
}

// MARK: - Server Type

enum class ServerType(val displayName: String) {
    STUDENT("Student"),
    ALUMNI("Alumni");

    companion object {
        fun fromString(value: String): ServerType =
            entries.find { it.name.equals(value, ignoreCase = true) } ?: STUDENT
    }
}

// MARK: - Student Location

data class StudentLocation(
    val userId: String,
    val latitude: Double,
    val longitude: Double,
    val altitude: Double = 0.0,
    val floor: Int = 1,
    val timestamp: Long = System.currentTimeMillis()
)

// MARK: - Nearby Student

data class NearbyStudent(
    val profile: UserProfile,
    val location: StudentLocation,
    val distance: Double // feet
) {
    val id: String get() = profile.userId
}

// MARK: - Ad Data

data class AdData(
    val id: String,
    val businessName: String,
    val bio: String,
    val deal: String,
    val logoEmoji: String,
    val logoUrl: String? = null,
    val distance: String
)

object MockAds {
    val all = listOf(
        AdData("ad-1", "Blue Brew Coffee", "Student-favorite coffee shop since 2019",
            "15% off any drink — show this ad", "☕", null, "0.2 mi"),
        AdData("ad-2", "Campus Pizza Co.", "Late night slices, every night",
            "Free garlic knots with any large pizza", "🍕", null, "0.4 mi"),
        AdData("ad-3", "FitZone Gym", "24/7 gym, 1 block from campus",
            "First month free for students", "🏋️", null, "0.3 mi"),
        AdData("ad-4", "BookStack", "Used textbooks at 60% off retail",
            "Extra 10% off with .edu email", "📚", null, "0.1 mi")
    )
}

// MARK: - API Request/Response Models

data class EmailVerifyRequest(val email: String)
data class EmailConfirmRequest(val email: String, val code: String)
data class EmailConfirmResponse(val verified: Boolean, val universityDomain: String)
data class PhoneVerifyRequest(val phone: String, val email: String)
data class PhoneConfirmRequest(val phone: String, val code: String)
data class PhoneConfirmResponse(val verified: Boolean)
data class LoginRequest(val email: String)

data class TokenResponse(
    @SerializedName("accessToken") val accessToken: String,
    @SerializedName("idToken") val idToken: String,
    @SerializedName("refreshToken") val refreshToken: String?,
    @SerializedName("expiresIn") val expiresIn: Int
)

data class RefreshTokenRequest(val refreshToken: String)

data class CreateProfileRequest(
    val email: String,
    val displayName: String,
    val bio: String?,
    val major: String?,
    val socialLinks: List<SocialLink>,
    val universityDomain: String
)

data class CreateProfileResponse(val profile: ServerProfile) {
    data class ServerProfile(val userId: String)
}

data class UniversityResponse(
    val id: String,
    val domain: String,
    val name: String,
    val memberCount: Int = 0
)
