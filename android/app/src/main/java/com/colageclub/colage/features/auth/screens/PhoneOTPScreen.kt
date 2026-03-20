package com.colageclub.colage.features.auth.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.colageclub.colage.core.design.*
import com.colageclub.colage.features.auth.AuthViewModel
import kotlinx.coroutines.delay

@Composable
fun PhoneOTPScreen(
    authViewModel: AuthViewModel,
    onVerified: () -> Unit
) {
    val isLoading by authViewModel.isLoading.collectAsState()
    val errorMessage by authViewModel.errorMessage.collectAsState()
    val onboardingData by authViewModel.onboardingData.collectAsState()

    var code by remember { mutableStateOf("") }
    var resendCountdown by remember { mutableStateOf(60) }
    var canResend by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        while (resendCountdown > 0) {
            delay(1000)
            resendCountdown--
        }
        canResend = true
    }

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
            OnboardingProgress(currentStep = 3, totalSteps = 10, modifier = Modifier.padding(top = 8.dp))

            Column(
                modifier = Modifier.fillMaxWidth().padding(top = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Enter SMS code",
                    style = ColageFonts.Title.copy(color = ColageColors.TextPrimary)
                )
                Text(
                    text = "Sent to ${onboardingData.phone}",
                    style = ColageFonts.Body.copy(color = ColageColors.TextSecondary)
                )
            }

            Spacer(Modifier.height(48.dp))

            OTPCodeField(
                code = code,
                onCodeChange = {
                    code = it
                    authViewModel.clearError()
                },
                length = 6,
                onComplete = { completedCode ->
                    authViewModel.confirmPhoneOTP(completedCode) { success ->
                        if (success) onVerified()
                        else code = ""
                    }
                }
            )

            errorMessage?.let {
                Text(
                    text = it,
                    style = ColageFonts.Footnote.copy(color = ColageColors.Error),
                    modifier = Modifier.padding(top = 16.dp)
                )
            }

            TextButton(
                onClick = {
                    canResend = false
                    resendCountdown = 60
                    authViewModel.sendPhoneOTP(onboardingData.phone) {}
                },
                enabled = canResend,
                modifier = Modifier.padding(top = 24.dp)
            ) {
                Text(
                    text = if (canResend) "Resend code" else "Resend in ${resendCountdown}s",
                    style = if (canResend) ColageFonts.BodyBold.copy(color = ColageColors.Primary)
                           else ColageFonts.Body.copy(color = ColageColors.TextTertiary)
                )
            }

            Spacer(Modifier.weight(1f))

            if (isLoading) {
                CircularProgressIndicator(
                    color = ColageColors.Primary,
                    modifier = Modifier
                        .padding(bottom = 40.dp)
                        .size(28.dp)
                )
            }
        }
    }
}
