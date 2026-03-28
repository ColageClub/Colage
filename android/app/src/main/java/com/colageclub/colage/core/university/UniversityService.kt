package com.colageclub.colage.core.university

import androidx.compose.ui.graphics.Color
import com.colageclub.colage.BuildConfig
import com.colageclub.colage.core.networking.ApiClient
import com.colageclub.colage.data.models.University
import com.colageclub.colage.data.models.UniversityTheme
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UniversityService @Inject constructor(
    private val apiClient: ApiClient
) {
    private val _currentUniversity = MutableStateFlow<University?>(null)
    val currentUniversity: StateFlow<University?> = _currentUniversity.asStateFlow()

    private val _currentTheme = MutableStateFlow(UniversityTheme.default)
    val currentTheme: StateFlow<UniversityTheme> = _currentTheme.asStateFlow()

    private val _availableThemes = MutableStateFlow<List<UniversityTheme>>(emptyList())
    val availableThemes: StateFlow<List<UniversityTheme>> = _availableThemes.asStateFlow()

    suspend fun resolveUniversity(domain: String): University {
        if (BuildConfig.DEV_MODE) {
            return mockUniversity(domain).also { setUniversity(it) }
        }
        return try {
            val response = apiClient.getUniversity(domain)
            val uni = University(
                id = response.id,
                domain = response.domain,
                name = response.name,
                memberCount = response.memberCount
            )
            setUniversity(uni)
            uni
        } catch (_: Exception) {
            Log.w("UniversityService", "API failed, using mock data")
            mockUniversity(domain).also { setUniversity(it) }
        }
    }

    fun setUniversity(university: University) {
        _currentUniversity.value = university
        val themes = university.brandingThemes.ifEmpty { listOf(UniversityTheme.default) }
        _availableThemes.value = themes
        _currentTheme.value = themes.first()
    }

    fun selectTheme(theme: UniversityTheme) {
        _currentTheme.value = theme
    }

    // MARK: - Mock Data (Dev Mode)

    private fun mockUniversity(domain: String): University {
        return when (domain) {
            "umich.edu" -> University(
                id = "umich",
                domain = "umich.edu",
                name = "University of Michigan",
                memberCount = 847,
                brandingThemes = listOf(
                    UniversityTheme(
                        id = "umich-maize-blue",
                        name = "Maize & Blue",
                        primaryColor = "#FFCB05",
                        accentColor = "#00274C",
                        textColor = "#FFFFFF"
                    ),
                    UniversityTheme(
                        id = "umich-block-m",
                        name = "Block M Classic",
                        primaryColor = "#FFCB05",
                        accentColor = "#00274C",
                        textColor = "#FFFFFF"
                    )
                )
            )
            "harvard.edu" -> University(
                id = "harvard",
                domain = "harvard.edu",
                name = "Harvard University",
                memberCount = 512,
                brandingThemes = listOf(
                    UniversityTheme(
                        id = "harvard-crimson",
                        name = "Crimson",
                        primaryColor = "#A51C30",
                        accentColor = "#F5F0E1",
                        textColor = "#FFFFFF"
                    )
                )
            )
            "stanford.edu" -> University(
                id = "stanford",
                domain = "stanford.edu",
                name = "Stanford University",
                memberCount = 623,
                brandingThemes = listOf(
                    UniversityTheme(
                        id = "stanford-cardinal",
                        name = "Cardinal",
                        primaryColor = "#8C1515",
                        accentColor = "#D2C295",
                        textColor = "#FFFFFF"
                    )
                )
            )
            else -> {
                val shortName = domain.removeSuffix(".edu").uppercase()
                University(
                    id = domain,
                    domain = domain,
                    name = shortName,
                    memberCount = 0,
                    brandingThemes = listOf(UniversityTheme.default)
                )
            }
        }
    }
}

// Extension to parse hex color string to Compose Color
fun UniversityTheme.primaryComposeColor(): Color {
    return try {
        val hex = primaryColor.trimStart('#')
        Color(android.graphics.Color.parseColor("#$hex"))
    } catch (_: Exception) {
        Color(0xFFA51C30)
    }
}

fun UniversityTheme.accentComposeColor(): Color {
    return try {
        val hex = accentColor.trimStart('#')
        Color(android.graphics.Color.parseColor("#$hex"))
    } catch (_: Exception) {
        Color(0xFF00CEC9)
    }
}
