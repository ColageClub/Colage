package com.colageclub.colage.features.auth.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AlternateEmail
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import com.colageclub.colage.core.design.*
import com.colageclub.colage.data.models.SocialPlatform
import com.colageclub.colage.features.auth.AuthViewModel

private val PLATFORMS = listOf(
    SocialPlatform.INSTAGRAM,
    SocialPlatform.TIKTOK,
    SocialPlatform.X,
    SocialPlatform.SNAPCHAT,
    SocialPlatform.FACEBOOK,
    SocialPlatform.BEREAL,
    SocialPlatform.LINKEDIN
)

@Composable
fun SocialLinksScreen(
    authViewModel: AuthViewModel,
    onContinue: () -> Unit
) {
    val onboardingData by authViewModel.onboardingData.collectAsState()
    var links by remember { mutableStateOf(onboardingData.socialLinks.toMutableMap()) }
    var expandedPlatform by remember { mutableStateOf<SocialPlatform?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColageColors.Background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding()
        ) {
            OnboardingProgress(currentStep = 6, totalSteps = 10, modifier = Modifier.padding(top = 8.dp))

            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
            ) {
                Column(
                    modifier = Modifier.padding(top = 48.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Add social links",
                        style = ColageFonts.Title.copy(color = ColageColors.TextPrimary)
                    )
                    Text(
                        text = "This is how people connect with you",
                        style = ColageFonts.Body.copy(color = ColageColors.TextSecondary)
                    )
                }

                Column(
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 32.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    PLATFORMS.forEach { platform ->
                        SocialLinkRow(
                            platform = platform,
                            handle = links[platform] ?: "",
                            onHandleChange = { links = links.toMutableMap().also { m -> m[platform] = it } },
                            isExpanded = expandedPlatform == platform,
                            onTap = {
                                expandedPlatform = if (expandedPlatform == platform) null else platform
                            }
                        )
                    }
                }

                Spacer(Modifier.height(120.dp))
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(listOf(Color.Transparent, ColageColors.Background))
                    )
                    .padding(horizontal = 24.dp, vertical = 40.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    ColagePrimaryButton(
                        title = "Continue",
                        onClick = {
                            authViewModel.updateSocialLinks(links)
                            onContinue()
                        }
                    )
                    TextButton(onClick = onContinue) {
                        Text(
                            text = "Skip for now",
                            style = ColageFonts.Body.copy(color = ColageColors.TextSecondary)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SocialLinkRow(
    platform: SocialPlatform,
    handle: String,
    onHandleChange: (String) -> Unit,
    isExpanded: Boolean,
    onTap: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(ColageColors.Surface)
    ) {
        TextButton(
            onClick = onTap,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(ColageColors.Primary.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = platformIcon(platform),
                        contentDescription = null,
                        tint = ColageColors.Primary,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Text(
                    text = platform.displayName,
                    style = ColageFonts.Body.copy(color = ColageColors.TextPrimary),
                    modifier = Modifier.weight(1f)
                )

                if (handle.isNotEmpty()) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = ColageColors.Online,
                        modifier = Modifier.size(18.dp)
                    )
                }

                Icon(
                    imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                    contentDescription = null,
                    tint = ColageColors.TextTertiary,
                    modifier = Modifier.size(18.dp)
                )
            }
        }

        AnimatedVisibility(
            visible = isExpanded,
            enter = expandVertically(),
            exit = shrinkVertically()
        ) {
            ColageTextField(
                placeholder = platformPlaceholder(platform),
                value = handle,
                onValueChange = onHandleChange,
                modifier = Modifier.padding(start = 16.dp, end = 16.dp, bottom = 12.dp),
                capitalization = KeyboardCapitalization.None
            )
        }
    }
}

private fun platformIcon(platform: SocialPlatform): ImageVector = when (platform) {
    SocialPlatform.INSTAGRAM -> Icons.Default.CameraAlt
    SocialPlatform.TIKTOK -> Icons.Default.MusicNote
    SocialPlatform.X -> Icons.Default.AlternateEmail
    SocialPlatform.SNAPCHAT -> Icons.Default.FlashOn
    SocialPlatform.FACEBOOK -> Icons.Default.Group
    SocialPlatform.BEREAL -> Icons.Default.Visibility
    SocialPlatform.LINKEDIN -> Icons.Default.Work
    else -> Icons.Default.Link
}

private fun platformPlaceholder(platform: SocialPlatform): String = when (platform) {
    SocialPlatform.INSTAGRAM, SocialPlatform.TIKTOK, SocialPlatform.X -> "@username"
    SocialPlatform.SNAPCHAT, SocialPlatform.BEREAL -> "username"
    SocialPlatform.FACEBOOK, SocialPlatform.LINKEDIN -> "Profile URL"
    else -> "https://..."
}
