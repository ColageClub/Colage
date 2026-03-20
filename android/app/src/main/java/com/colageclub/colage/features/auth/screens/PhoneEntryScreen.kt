package com.colageclub.colage.features.auth.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.colageclub.colage.BuildConfig
import com.colageclub.colage.core.design.*
import com.colageclub.colage.features.auth.AuthViewModel

@Composable
fun PhoneEntryScreen(
    authViewModel: AuthViewModel,
    onContinue: () -> Unit
) {
    val isLoading by authViewModel.isLoading.collectAsState()
    val errorMessage by authViewModel.errorMessage.collectAsState()
    var phoneNumber by remember { mutableStateOf("") }
    val countryCode = "+1"

    val isValidPhone = phoneNumber.filter { it.isDigit() }.length >= 10

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
            OnboardingProgress(currentStep = 2, totalSteps = 10, modifier = Modifier.padding(top = 8.dp))

            Column(
                modifier = Modifier.fillMaxWidth().padding(top = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Verify your phone",
                    style = ColageFonts.Title.copy(color = ColageColors.TextPrimary)
                )
                Text(
                    text = "For account recovery only — never shared",
                    style = ColageFonts.Body.copy(color = ColageColors.TextSecondary)
                )
            }

            Spacer(Modifier.height(48.dp))

            Row(
                modifier = Modifier.padding(horizontal = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(width = 56.dp, height = 56.dp)
                        .background(ColageColors.Surface, RoundedCornerShape(16.dp))
                        .border(1.dp, ColageColors.Border, RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = countryCode,
                        style = ColageFonts.Body.copy(color = ColageColors.TextPrimary)
                    )
                }

                ColageTextField(
                    placeholder = "(555) 555-5555",
                    value = phoneNumber,
                    onValueChange = {
                        phoneNumber = it
                        authViewModel.clearError()
                    },
                    modifier = Modifier.weight(1f),
                    keyboardType = KeyboardType.Phone
                )
            }

            errorMessage?.let {
                Text(
                    text = it,
                    style = ColageFonts.Footnote.copy(color = ColageColors.Error),
                    modifier = Modifier.padding(top = 8.dp, start = 24.dp)
                )
            }

            if (BuildConfig.DEV_MODE) {
                Row(
                    modifier = Modifier.padding(top = 16.dp, start = 24.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Build,
                        contentDescription = null,
                        tint = ColageColors.Warning,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = "Dev mode — verification will be skipped",
                        style = ColageFonts.Caption.copy(color = ColageColors.Warning)
                    )
                }
            }

            Spacer(Modifier.weight(1f))

            ColagePrimaryButton(
                title = "Send Code",
                onClick = {
                    val fullNumber = countryCode + phoneNumber.filter { it.isDigit() }
                    authViewModel.sendPhoneOTP(fullNumber) { success ->
                        if (success) onContinue()
                    }
                },
                modifier = Modifier
                    .padding(horizontal = 24.dp)
                    .padding(bottom = 40.dp),
                isLoading = isLoading,
                isDisabled = !isValidPhone
            )
        }
    }
}
