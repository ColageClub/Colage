package com.colageclub.colage.features.auth.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Photo
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.colageclub.colage.core.design.*
import com.colageclub.colage.features.auth.AuthViewModel

@Composable
fun PhotoUploadScreen(
    authViewModel: AuthViewModel,
    onContinue: () -> Unit
) {
    val onboardingData by authViewModel.onboardingData.collectAsState()
    var selectedUri by remember { mutableStateOf<Uri?>(onboardingData.profilePhotoUri) }

    val photoPicker = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        uri?.let {
            selectedUri = it
            authViewModel.updateOnboardingPhoto(it)
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
                .systemBarsPadding(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            OnboardingProgress(currentStep = 4, totalSteps = 10, modifier = Modifier.padding(top = 8.dp))

            Column(
                modifier = Modifier.padding(top = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Add a profile photo",
                    style = ColageFonts.Title.copy(color = ColageColors.TextPrimary)
                )
                Text(
                    text = "This is how people will find you",
                    style = ColageFonts.Body.copy(color = ColageColors.TextSecondary)
                )
            }

            Spacer(Modifier.height(48.dp))

            // Photo preview
            Box(modifier = Modifier.size(160.dp)) {
                if (selectedUri != null) {
                    AsyncImage(
                        model = selectedUri,
                        contentDescription = "Profile photo",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                            .border(3.dp, ColageColors.Primary, CircleShape)
                    )
                    // Edit button overlay
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(ColageColors.Primary),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Change photo",
                            tint = ColageColors.TextPrimary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                            .background(ColageColors.Surface)
                            .border(2.dp, ColageColors.Border, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.CameraAlt,
                                contentDescription = null,
                                tint = ColageColors.TextTertiary,
                                modifier = Modifier.size(36.dp)
                            )
                            Text(
                                text = "Add Photo",
                                style = ColageFonts.Caption.copy(color = ColageColors.TextTertiary)
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(32.dp))

            // Source buttons
            Row(
                modifier = Modifier.padding(horizontal = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        photoPicker.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                        )
                    },
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = ColageColors.Primary,
                        containerColor = ColageColors.Primary.copy(alpha = 0.12f)
                    ),
                    border = null
                ) {
                    Icon(Icons.Default.Photo, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Library", style = ColageFonts.BodyBold)
                }

                OutlinedButton(
                    onClick = {
                        photoPicker.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                        )
                    },
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = ColageColors.Primary,
                        containerColor = ColageColors.Primary.copy(alpha = 0.12f)
                    ),
                    border = null
                ) {
                    Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Camera", style = ColageFonts.BodyBold)
                }
            }

            Spacer(Modifier.weight(1f))

            Column(
                modifier = Modifier.padding(horizontal = 24.dp, vertical = 40.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                ColagePrimaryButton(
                    title = "Continue",
                    onClick = onContinue
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
