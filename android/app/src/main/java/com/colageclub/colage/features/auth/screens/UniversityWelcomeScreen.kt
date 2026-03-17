package com.colageclub.colage.features.auth.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.colageclub.colage.core.design.ColageColors
import com.colageclub.colage.core.design.ColageFonts
import com.colageclub.colage.core.design.ColagePrimaryButton
import com.colageclub.colage.features.auth.AuthViewModel

@Composable
fun UniversityWelcomeScreen(
    authViewModel: AuthViewModel,
    onEnter: () -> Unit
) {
    val onboardingData by authViewModel.onboardingData.collectAsState()

    // Derive university name from email domain
    val domain = authViewModel.extractDomain(onboardingData.email) ?: "your university"
    val universityName = domain
        .substringBefore(".")
        .replaceFirstChar { it.uppercase() }

    // Animation
    var animateIn by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (animateIn) 1f else 0.5f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ),
        label = "scale"
    )
    val alpha by animateFloatAsState(
        targetValue = if (animateIn) 1f else 0f,
        animationSpec = tween(durationMillis = 600, delayMillis = 200),
        label = "alpha"
    )

    LaunchedEffect(Unit) {
        animateIn = true
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.linearGradient(
                    listOf(
                        ColageColors.Primary.copy(alpha = 0.3f),
                        ColageColors.Background
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.weight(1f))

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .scale(scale)
                        .clip(CircleShape)
                        .background(ColageColors.Primary.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.School,
                        contentDescription = null,
                        tint = ColageColors.Primary,
                        modifier = Modifier
                            .size(44.dp)
                            .scale(scale)
                    )
                }

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(horizontal = 32.dp)
                ) {
                    Text(
                        text = "Welcome to",
                        style = ColageFonts.Title3.copy(color = ColageColors.TextSecondary),
                        modifier = Modifier.scale(scale)
                    )
                    Text(
                        text = universityName,
                        style = ColageFonts.LargeTitle.copy(color = ColageColors.Primary),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.scale(scale)
                    )
                    Text(
                        text = "on Colage",
                        style = ColageFonts.Title2.copy(color = ColageColors.TextPrimary),
                        modifier = Modifier.scale(scale)
                    )
                }

                // Member count dot (static placeholder)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier
                        .scale(scale)
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(ColageColors.Online)
                    )
                    Text(
                        text = "Students already here",
                        style = ColageFonts.Subheadline.copy(color = ColageColors.TextSecondary)
                    )
                }
            }

            Spacer(Modifier.weight(1f))

            ColagePrimaryButton(
                title = "Enter $universityName",
                onClick = onEnter,
                modifier = Modifier
                    .padding(horizontal = 24.dp)
                    .padding(bottom = 50.dp)
                    .scale(scale)
            )
        }
    }
}
