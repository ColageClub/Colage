package com.colageclub.colage.features.auth.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Divider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import com.colageclub.colage.core.design.*
import com.colageclub.colage.features.auth.AuthViewModel

private val COMMON_MAJORS = listOf(
    "Computer Science", "Business", "Engineering", "Biology",
    "Psychology", "Economics", "Political Science", "English",
    "Mathematics", "Chemistry", "Physics", "Art",
    "Communications", "Nursing", "Finance", "Marketing",
    "History", "Sociology", "Music", "Philosophy",
    "Pre-Med", "Pre-Law", "Architecture", "Education"
)

@Composable
fun ProfileInfoScreen(
    authViewModel: AuthViewModel,
    onContinue: () -> Unit
) {
    val onboardingData by authViewModel.onboardingData.collectAsState()
    var displayName by remember { mutableStateOf(onboardingData.displayName) }
    var bio by remember { mutableStateOf(onboardingData.bio) }
    var major by remember { mutableStateOf(onboardingData.major) }
    var filteredMajors by remember { mutableStateOf(emptyList<String>()) }

    val isValid = displayName.trim().isNotEmpty()

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
            OnboardingProgress(currentStep = 5, totalSteps = 10, modifier = Modifier.padding(top = 8.dp))

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
                        text = "About you",
                        style = ColageFonts.Title.copy(color = ColageColors.TextPrimary)
                    )
                    Text(
                        text = "Only your name is required",
                        style = ColageFonts.Body.copy(color = ColageColors.TextSecondary)
                    )
                }

                Column(
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 40.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    // Name
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Name *",
                            style = ColageFonts.CaptionBold.copy(color = ColageColors.TextSecondary)
                        )
                        ColageTextField(
                            placeholder = "Your name",
                            value = displayName,
                            onValueChange = { displayName = it },
                            capitalization = KeyboardCapitalization.Words
                        )
                    }

                    // Bio
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row {
                            Text(
                                text = "Bio",
                                style = ColageFonts.CaptionBold.copy(color = ColageColors.TextSecondary),
                                modifier = Modifier.weight(1f)
                            )
                            Text(
                                text = "${bio.length}/160",
                                style = ColageFonts.Caption.copy(
                                    color = if (bio.length > 160) ColageColors.Error else ColageColors.TextTertiary
                                )
                            )
                        }
                        androidx.compose.foundation.text.BasicTextField(
                            value = bio,
                            onValueChange = { if (it.length <= 160) bio = it },
                            modifier = Modifier
                                .fillMaxWidth()
                                .defaultMinSize(minHeight = 96.dp)
                                .background(ColageColors.Surface, RoundedCornerShape(16.dp))
                                .border(1.dp, ColageColors.Border, RoundedCornerShape(16.dp))
                                .padding(horizontal = 20.dp, vertical = 16.dp),
                            textStyle = ColageFonts.Body.copy(color = ColageColors.TextPrimary),
                            cursorBrush = androidx.compose.ui.graphics.SolidColor(ColageColors.Primary),
                            decorationBox = { innerTextField ->
                                if (bio.isEmpty()) {
                                    Text(
                                        "Something about you...",
                                        style = ColageFonts.Body.copy(color = ColageColors.TextTertiary)
                                    )
                                }
                                innerTextField()
                            }
                        )
                    }

                    // Major
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Major",
                            style = ColageFonts.CaptionBold.copy(color = ColageColors.TextSecondary)
                        )
                        ColageTextField(
                            placeholder = "Search or type your major",
                            value = major,
                            onValueChange = { v ->
                                major = v
                                filteredMajors = if (v.isEmpty()) emptyList()
                                else COMMON_MAJORS.filter { it.contains(v, ignoreCase = true) }
                            }
                        )

                        if (filteredMajors.isNotEmpty()) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(ColageColors.Surface, RoundedCornerShape(12.dp))
                            ) {
                                filteredMajors.take(5).forEachIndexed { index, suggestion ->
                                    TextButton(
                                        onClick = {
                                            major = suggestion
                                            filteredMajors = emptyList()
                                        },
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = suggestion,
                                            style = ColageFonts.Body.copy(color = ColageColors.TextPrimary),
                                            modifier = Modifier.fillMaxWidth()
                                        )
                                    }
                                    if (index < filteredMajors.take(5).lastIndex) {
                                        Divider(color = ColageColors.Border, thickness = 0.5.dp)
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(Modifier.height(100.dp))
            }

            // Fixed bottom button with gradient
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color.Transparent, ColageColors.Background)
                        )
                    )
                    .padding(horizontal = 24.dp, vertical = 40.dp)
            ) {
                ColagePrimaryButton(
                    title = "Continue",
                    onClick = {
                        authViewModel.updateOnboardingName(displayName.trim())
                        authViewModel.updateOnboardingBio(bio)
                        authViewModel.updateOnboardingMajor(major)
                        onContinue()
                    },
                    isDisabled = !isValid
                )
            }
        }
    }
}
