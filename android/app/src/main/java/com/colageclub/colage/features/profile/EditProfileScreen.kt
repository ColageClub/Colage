package com.colageclub.colage.features.profile

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.colageclub.colage.app.AppViewModel
import com.colageclub.colage.core.design.*
import com.colageclub.colage.data.models.SocialLink
import com.colageclub.colage.data.models.SocialPlatform
import com.colageclub.colage.data.models.UserProfile
import com.colageclub.colage.features.discovery.icon

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditProfileScreen(
    appViewModel: AppViewModel,
    onDismiss: () -> Unit
) {
    val profile by appViewModel.currentProfile.collectAsState()

    var displayName by remember { mutableStateOf(profile?.displayName ?: "") }
    var bio by remember { mutableStateOf(profile?.bio ?: "") }
    var major by remember { mutableStateOf(profile?.major ?: "") }
    var socialLinks by remember {
        mutableStateOf<Map<SocialPlatform, String>>(
            profile?.socialLinks?.associate { it.platform to it.handle } ?: emptyMap()
        )
    }
    var isSaving by remember { mutableStateOf(false) }
    var selectedPhotoUri by remember { mutableStateOf<Uri?>(null) }
    val appError by appViewModel.error.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(appError) {
        appError?.let {
            snackbarHostState.showSnackbar(it)
            appViewModel.clearError()
        }
    }

    val photoPicker = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        uri?.let { selectedPhotoUri = it }
    }

    val editablePlatforms = listOf(
        SocialPlatform.INSTAGRAM, SocialPlatform.TIKTOK, SocialPlatform.X,
        SocialPlatform.SNAPCHAT, SocialPlatform.FACEBOOK, SocialPlatform.BEREAL,
        SocialPlatform.LINKEDIN
    )

    Scaffold(
        containerColor = ColageColors.Background,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Edit Profile", style = ColageFonts.Title3.copy(color = ColageColors.TextPrimary)) },
                navigationIcon = {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel", style = ColageFonts.Body.copy(color = ColageColors.TextSecondary))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(Modifier.height(24.dp))

                // Avatar
                AvatarView(
                    imageUrl = selectedPhotoUri?.toString() ?: profile?.profilePhotoURL,
                    size = 120.dp,
                    initials = profile?.displayName?.initials()
                )

                Spacer(Modifier.height(12.dp))

                TextButton(onClick = {
                    photoPicker.launch(
                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                    )
                }) {
                    Text("Change Photo", style = ColageFonts.CaptionBold.copy(color = LocalThemeColor.current))
                }

                Spacer(Modifier.height(24.dp))

                // Fields
                Column(
                    modifier = Modifier.padding(horizontal = 24.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    // Name
                    Column {
                        Text("Name", style = ColageFonts.CaptionBold.copy(color = ColageColors.TextSecondary))
                        Spacer(Modifier.height(8.dp))
                        ColageTextField(
                            placeholder = "Your name",
                            value = displayName,
                            onValueChange = { displayName = it }
                        )
                    }

                    // Bio
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Bio", style = ColageFonts.CaptionBold.copy(color = ColageColors.TextSecondary))
                            Text(
                                "${bio.length}/160",
                                style = ColageFonts.Caption.copy(
                                    color = if (bio.length > 160) ColageColors.Error else ColageColors.TextTertiary
                                )
                            )
                        }
                        Spacer(Modifier.height(8.dp))
                        OutlinedTextField(
                            value = bio,
                            onValueChange = { if (it.length <= 160) bio = it },
                            placeholder = { Text("Something about you...", style = ColageFonts.Body.copy(color = ColageColors.TextTertiary)) },
                            modifier = Modifier.fillMaxWidth(),
                            textStyle = ColageFonts.Body.copy(color = ColageColors.TextPrimary),
                            minLines = 3,
                            maxLines = 5,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = LocalThemeColor.current,
                                unfocusedBorderColor = ColageColors.Border,
                                focusedContainerColor = ColageColors.Surface,
                                unfocusedContainerColor = ColageColors.Surface,
                                cursorColor = LocalThemeColor.current
                            ),
                            shape = RoundedCornerShape(16.dp)
                        )
                    }

                    // Major
                    Column {
                        Text("Major", style = ColageFonts.CaptionBold.copy(color = ColageColors.TextSecondary))
                        Spacer(Modifier.height(8.dp))
                        ColageTextField(
                            placeholder = "Your major",
                            value = major,
                            onValueChange = { major = it }
                        )
                    }
                }

                Spacer(Modifier.height(24.dp))

                // Social links
                Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                    Text("Social Links", style = ColageFonts.CaptionBold.copy(color = ColageColors.TextSecondary))
                    Spacer(Modifier.height(12.dp))

                    editablePlatforms.forEach { platform ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .background(ColageColors.Surface, RoundedCornerShape(12.dp))
                                .padding(horizontal = 16.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Icon(
                                platform.icon(),
                                null,
                                tint = LocalThemeColor.current,
                                modifier = Modifier.size(16.dp)
                            )
                            OutlinedTextField(
                                value = socialLinks.getOrDefault(platform, ""),
                                onValueChange = { newVal -> socialLinks = socialLinks.toMutableMap().apply { put(platform, newVal) } },
                                placeholder = { Text(platform.displayName, style = ColageFonts.Body.copy(color = ColageColors.TextTertiary)) },
                                modifier = Modifier.weight(1f),
                                textStyle = ColageFonts.Body.copy(color = ColageColors.TextPrimary),
                                singleLine = true,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color.Transparent,
                                    unfocusedBorderColor = Color.Transparent,
                                    focusedContainerColor = Color.Transparent,
                                    unfocusedContainerColor = Color.Transparent,
                                    cursorColor = LocalThemeColor.current
                                )
                            )
                        }
                    }
                }

                Spacer(Modifier.height(120.dp))
            }

            // Save button
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .background(ColageColors.Background)
                    .padding(horizontal = 24.dp, vertical = 24.dp)
            ) {
                ColagePrimaryButton(
                    title = "Save",
                    onClick = {
                        isSaving = true
                        val links = socialLinks.entries.mapNotNull { (platform, handle) ->
                            if (handle.isNotEmpty()) SocialLink(platform, handle) else null
                        }
                        val updated = (profile ?: return@ColagePrimaryButton).copy(
                            displayName = displayName.trim(),
                            bio = bio.ifBlank { null },
                            major = major.ifBlank { null },
                            socialLinks = links,
                            updatedAt = java.time.Instant.now().toString()
                        )
                        appViewModel.updateProfileOnServer(
                            updatedProfile = updated,
                            newPhotoUri = selectedPhotoUri,
                            onComplete = {
                                isSaving = false
                                onDismiss()
                            }
                        )
                    },
                    isLoading = isSaving,
                    isDisabled = displayName.isBlank()
                )
            }
        }
    }
}
