package com.colageclub.colage.features.auth.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.colageclub.colage.core.design.ColageColors
import com.colageclub.colage.core.design.LocalThemeColor
import com.colageclub.colage.core.design.ColageFonts
import com.colageclub.colage.core.design.ColagePrimaryButton

@Composable
fun WelcomeScreen(
    onGetStarted: () -> Unit,
    onLogin: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColageColors.Background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.weight(1f))

            // Logo area
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .clip(CircleShape)
                        .background(LocalThemeColor.current.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = LocalThemeColor.current,
                        modifier = Modifier.size(60.dp)
                    )
                }

                Text(
                    text = "colage",
                    style = ColageFonts.LargeTitle.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 42.sp,
                        color = ColageColors.TextPrimary
                    )
                )

                Text(
                    text = "discover your campus",
                    style = ColageFonts.Title3.copy(color = ColageColors.TextSecondary)
                )
            }

            Spacer(Modifier.weight(1f))

            // Feature rows
            Column(
                modifier = Modifier.padding(horizontal = 32.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                FeatureRow(
                    icon = Icons.Default.Map,
                    title = "Live Map",
                    subtitle = "See who's around you in real-time"
                )
                FeatureRow(
                    icon = Icons.Default.Group,
                    title = "Student Profiles",
                    subtitle = "Connect via social links"
                )
                FeatureRow(
                    icon = Icons.Default.ViewInAr,
                    title = "AR Discovery",
                    subtitle = "Find people through your camera"
                )
            }

            Spacer(Modifier.weight(1f))

            // CTAs
            Column(
                modifier = Modifier.padding(horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                ColagePrimaryButton(
                    title = "Get Started",
                    onClick = onGetStarted
                )

                TextButton(onClick = onLogin) {
                    Text(
                        text = buildAnnotatedString {
                            withStyle(SpanStyle(color = ColageColors.TextSecondary)) {
                                append("Already have an account? ")
                            }
                            withStyle(SpanStyle(color = LocalThemeColor.current, fontWeight = FontWeight.SemiBold)) {
                                append("Log In")
                            }
                        },
                        style = ColageFonts.Body
                    )
                }

                Text(
                    text = "For verified .edu students only",
                    style = ColageFonts.Caption.copy(color = ColageColors.TextTertiary)
                )

                Spacer(Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun FeatureRow(
    icon: ImageVector,
    title: String,
    subtitle: String
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(LocalThemeColor.current.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = LocalThemeColor.current,
                modifier = Modifier.size(22.dp)
            )
        }

        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(text = title, style = ColageFonts.BodyBold.copy(color = ColageColors.TextPrimary))
            Text(text = subtitle, style = ColageFonts.Footnote.copy(color = ColageColors.TextSecondary))
        }

        Spacer(Modifier.weight(1f))
    }
}
