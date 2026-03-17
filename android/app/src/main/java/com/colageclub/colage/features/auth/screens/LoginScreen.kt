package com.colageclub.colage.features.auth.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBackIosNew
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.colageclub.colage.BuildConfig
import com.colageclub.colage.core.design.*
import com.colageclub.colage.features.auth.AuthViewModel
import kotlinx.coroutines.delay

enum class LoginStep { EMAIL, OTP }

@Composable
fun LoginScreen(
    authViewModel: AuthViewModel,
    onAuthenticated: () -> Unit,
    onBack: () -> Unit
) {
    val isLoading by authViewModel.isLoading.collectAsState()
    val errorMessage by authViewModel.errorMessage.collectAsState()

    var step by remember { mutableStateOf(LoginStep.EMAIL) }
    var email by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var resendCountdown by remember { mutableIntStateOf(60) }
    var canResend by remember { mutableStateOf(false) }
    var countdownActive by remember { mutableStateOf(false) }

    val isValidEmail = email.contains("@") && email.lowercase().endsWith(".edu")

    LaunchedEffect(countdownActive) {
        if (countdownActive) {
            while (resendCountdown > 0) {
                delay(1000)
                resendCountdown--
            }
            canResend = true
            countdownActive = false
        }
    }

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
            // Toolbar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = {
                    if (step == LoginStep.OTP) {
                        step = LoginStep.EMAIL
                        code = ""
                        authViewModel.clearError()
                    } else {
                        onBack()
                    }
                }) {
                    Icon(
                        imageVector = if (step == LoginStep.OTP) Icons.Default.ArrowBackIosNew else Icons.Default.Close,
                        contentDescription = "Back",
                        tint = ColageColors.TextSecondary
                    )
                }
            }

            // Header
            Column(
                modifier = Modifier.padding(top = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(
                    imageVector = if (step == LoginStep.EMAIL) Icons.Default.Person else Icons.Default.Lock,
                    contentDescription = null,
                    tint = ColageColors.Primary,
                    modifier = Modifier.size(44.dp).padding(bottom = 8.dp)
                )
                Text(
                    text = if (step == LoginStep.EMAIL) "Welcome back" else "Enter your code",
                    style = ColageFonts.Title.copy(color = ColageColors.TextPrimary)
                )
                Text(
                    text = if (step == LoginStep.EMAIL) "Log in with your .edu email" else "We sent a 6-digit code to",
                    style = ColageFonts.Body.copy(color = ColageColors.TextSecondary)
                )
                if (step == LoginStep.OTP) {
                    Text(
                        text = email,
                        style = ColageFonts.BodyBold.copy(color = ColageColors.Primary)
                    )
                }
            }

            Spacer(Modifier.height(48.dp))

            // Content
            when (step) {
                LoginStep.EMAIL -> {
                    Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                        ColageTextField(
                            placeholder = "you@university.edu",
                            value = email,
                            onValueChange = {
                                email = it
                                authViewModel.clearError()
                            },
                            keyboardType = KeyboardType.Email,
                            capitalization = KeyboardCapitalization.None
                        )

                        val domain = if (isValidEmail) authViewModel.extractDomain(email) else null
                        AnimatedVisibility(
                            visible = isValidEmail && domain != null,
                            enter = fadeIn() + slideInVertically()
                        ) {
                            Row(
                                modifier = Modifier.padding(top = 12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    Icons.Default.CheckCircle,
                                    null,
                                    tint = ColageColors.Online,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = domain ?: "",
                                    style = ColageFonts.Footnote.copy(color = ColageColors.TextSecondary)
                                )
                            }
                        }

                        if (BuildConfig.DEV_MODE) {
                            Row(
                                modifier = Modifier.padding(top = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(Icons.Default.Build, null, tint = ColageColors.Warning, modifier = Modifier.size(14.dp))
                                Text(
                                    "Dev mode — any 6-digit code will work",
                                    style = ColageFonts.Caption.copy(color = ColageColors.Warning)
                                )
                            }
                        }
                    }
                }

                LoginStep.OTP -> {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        OTPCodeField(
                            code = code,
                            onCodeChange = {
                                code = it
                                authViewModel.clearError()
                            },
                            length = 6,
                            onComplete = { completedCode ->
                                authViewModel.confirmLoginOTP(email, completedCode) { success ->
                                    if (success) onAuthenticated()
                                    else code = ""
                                }
                            }
                        )

                        TextButton(
                            onClick = {
                                canResend = false
                                resendCountdown = 60
                                countdownActive = true
                                authViewModel.sendLoginOTP(email) {}
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
                    }
                }
            }

            Spacer(Modifier.weight(1f))

            errorMessage?.let {
                Text(
                    text = it,
                    style = ColageFonts.Footnote.copy(color = ColageColors.Error),
                    modifier = Modifier
                        .padding(bottom = 16.dp)
                        .align(Alignment.CenterHorizontally)
                )
            }

            if (step == LoginStep.EMAIL) {
                ColagePrimaryButton(
                    title = "Send Login Code",
                    onClick = {
                        authViewModel.sendLoginOTP(email) { success ->
                            if (success) {
                                if (BuildConfig.DEV_MODE) {
                                    authViewModel.confirmLoginOTP(email, "000000") { loginSuccess ->
                                        if (loginSuccess) onAuthenticated()
                                    }
                                } else {
                                    step = LoginStep.OTP
                                    resendCountdown = 60
                                    canResend = false
                                    countdownActive = true
                                }
                            }
                        }
                    },
                    modifier = Modifier
                        .padding(horizontal = 24.dp)
                        .padding(bottom = 40.dp),
                    isLoading = isLoading,
                    isDisabled = !isValidEmail
                )
            } else if (isLoading) {
                CircularProgressIndicator(
                    color = ColageColors.Primary,
                    modifier = Modifier
                        .align(Alignment.CenterHorizontally)
                        .padding(bottom = 40.dp)
                        .size(28.dp)
                )
            }
        }
    }
}
