package com.colageclub.colage.features.auth.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.colageclub.colage.core.design.*
import com.colageclub.colage.features.auth.AuthViewModel

@Composable
fun EmailEntryScreen(
    authViewModel: AuthViewModel,
    onContinue: () -> Unit
) {
    val isLoading by authViewModel.isLoading.collectAsState()
    val errorMessage by authViewModel.errorMessage.collectAsState()
    var email by remember { mutableStateOf("") }

    val isValidEmail = email.contains("@") && email.lowercase().endsWith(".edu")
    val domain = if (isValidEmail) authViewModel.extractDomain(email) else null

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
            OnboardingProgress(currentStep = 0, totalSteps = 10, modifier = Modifier.padding(top = 8.dp))

            Column(
                modifier = Modifier.fillMaxWidth().padding(top = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Enter your .edu email",
                    style = ColageFonts.Title.copy(color = ColageColors.TextPrimary)
                )
                Text(
                    text = "We'll verify you're a real student",
                    style = ColageFonts.Body.copy(color = ColageColors.TextSecondary)
                )
            }

            Spacer(Modifier.height(48.dp))

            ColageTextField(
                placeholder = "you@university.edu",
                value = email,
                onValueChange = {
                    email = it
                    authViewModel.clearError()
                },
                modifier = Modifier.padding(horizontal = 24.dp),
                keyboardType = KeyboardType.Email,
                capitalization = KeyboardCapitalization.None
            )

            errorMessage?.let {
                Text(
                    text = it,
                    style = ColageFonts.Footnote.copy(color = ColageColors.Error),
                    modifier = Modifier.padding(top = 8.dp, start = 24.dp)
                )
            }

            AnimatedVisibility(
                visible = isValidEmail && domain != null,
                enter = fadeIn() + slideInVertically()
            ) {
                Row(
                    modifier = Modifier.padding(top = 12.dp, start = 24.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = ColageColors.Online,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = domain ?: "",
                        style = ColageFonts.Footnote.copy(color = ColageColors.TextSecondary)
                    )
                }
            }

            Spacer(Modifier.weight(1f))

            ColagePrimaryButton(
                title = "Continue",
                onClick = {
                    authViewModel.sendEmailOTP(email) { success ->
                        if (success) onContinue()
                    }
                },
                modifier = Modifier
                    .padding(horizontal = 24.dp)
                    .padding(bottom = 40.dp),
                isLoading = isLoading,
                isDisabled = !isValidEmail
            )
        }
    }
}
