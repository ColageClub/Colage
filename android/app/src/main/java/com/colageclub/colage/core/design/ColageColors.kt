package com.colageclub.colage.core.design

import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.graphics.Color

/** CompositionLocal for university theme color — defaults to Colage crimson */
val LocalThemeColor = compositionLocalOf { Color(0xFFA51C30) }
val LocalThemeAccent = compositionLocalOf { Color(0xFF00CEC9) }

object ColageColors {
    // Base
    val Background = Color(0xFF0A0A0A)
    val Surface = Color(0xFF1A1A1A)
    val SurfaceElevated = Color(0xFF252525)
    val Border = Color(0xFF333333)

    // Brand
    val Primary = Color(0xFFA51C30)
    val PrimaryLight = Color(0xFFD43B50)
    val Secondary = Color(0xFF00CEC9)

    // Text
    val TextPrimary = Color.White
    val TextSecondary = Color(0xFFA0A0A0)
    val TextTertiary = Color(0xFF666666)

    // Status
    val Online = Color(0xFF00E676)
    val Offline = Color(0xFF555555)
    val Error = Color(0xFFFF5252)
    val Warning = Color(0xFFFFD740)

    // University defaults
    val DefaultUniversityPrimary = Color(0xFFA51C30)
    val DefaultUniversityAccent = Color(0xFF00CEC9)
}
