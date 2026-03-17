package com.colageclub.colage.features.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.colageclub.colage.app.AppViewModel
import com.colageclub.colage.core.design.*
import com.colageclub.colage.core.university.primaryComposeColor

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OwnProfileScreen(
    appViewModel: AppViewModel,
    onDismiss: () -> Unit,
    onEditProfile: () -> Unit,
    onSettings: () -> Unit
) {
    val profile by appViewModel.currentProfile.collectAsState()
    val isVisible by appViewModel.isVisible.collectAsState()
    val university by appViewModel.currentUniversity.collectAsState()
    val theme by appViewModel.currentTheme.collectAsState()
    val themeColor = theme.primaryComposeColor()

    Scaffold(
        containerColor = ColageColors.Background,
        topBar = {
            TopAppBar(
                title = {},
                navigationIcon = {
                    IconButton(onClick = onDismiss) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(ColageColors.Surface),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Close, "Close", tint = ColageColors.TextSecondary, modifier = Modifier.size(14.dp))
                        }
                    }
                },
                actions = {
                    IconButton(onClick = onSettings) {
                        Icon(Icons.Default.Settings, "Settings", tint = ColageColors.TextSecondary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(16.dp))

            // Avatar
            AvatarView(
                imageUrl = profile?.profilePhotoURL,
                size = 100.dp,
                borderColor = themeColor,
                initials = profile?.displayName?.initials()
            )

            Spacer(Modifier.height(16.dp))

            // Name
            Text(
                text = profile?.displayName ?: "Your Name",
                style = ColageFonts.Title.copy(color = ColageColors.TextPrimary)
            )

            // Major
            profile?.major?.let {
                Text(text = it, style = ColageFonts.Subheadline.copy(color = ColageColors.TextSecondary))
            }

            // Visibility + university
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(top = 6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(if (isVisible) ColageColors.Online else ColageColors.Offline)
                )
                Text(
                    text = if (isVisible) "Visible" else "Hidden",
                    style = ColageFonts.Caption.copy(color = ColageColors.TextTertiary)
                )
                university?.let {
                    Text("·", style = ColageFonts.Caption.copy(color = ColageColors.TextTertiary))
                    Text(it.name, style = ColageFonts.Caption.copy(color = ColageColors.TextTertiary))
                }
            }

            Spacer(Modifier.height(16.dp))

            // Edit button
            Button(
                onClick = onEditProfile,
                shape = RoundedCornerShape(50),
                colors = ButtonDefaults.buttonColors(containerColor = themeColor.copy(alpha = 0.12f)),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 10.dp)
            ) {
                Icon(Icons.Default.Edit, null, tint = themeColor, modifier = Modifier.size(14.dp))
                Spacer(Modifier.width(6.dp))
                Text("Edit Profile", style = ColageFonts.CaptionBold.copy(color = themeColor))
            }

            Spacer(Modifier.height(24.dp))

            // Bio
            profile?.bio?.takeIf { it.isNotEmpty() }?.let { bio ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    horizontalAlignment = Alignment.Start
                ) {
                    SectionHeader("About")
                    Spacer(Modifier.height(8.dp))
                    Text(bio, style = ColageFonts.Body.copy(color = ColageColors.TextPrimary))
                }
                Spacer(Modifier.height(24.dp))
            }

            // Social links
            profile?.socialLinks?.takeIf { it.isNotEmpty() }?.let { links ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    horizontalAlignment = Alignment.Start
                ) {
                    SectionHeader("Social Links")
                    Spacer(Modifier.height(12.dp))
                    links.forEach { link ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .background(themeColor.copy(alpha = 0.1f), RoundedCornerShape(8.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    link.platform.icon(),
                                    null,
                                    tint = themeColor,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                            Column {
                                Text(link.platform.displayName, style = ColageFonts.CaptionBold.copy(color = ColageColors.TextSecondary))
                                Text(link.handle, style = ColageFonts.Body.copy(color = ColageColors.TextPrimary))
                            }
                        }
                    }
                }
                Spacer(Modifier.height(24.dp))
            }

            // Visibility toggle
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalAlignment = Alignment.Start
            ) {
                SectionHeader("Visibility")
                Spacer(Modifier.height(12.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(ColageColors.Surface, RoundedCornerShape(16.dp))
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        if (isVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                        null,
                        tint = themeColor,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Show on Map", style = ColageFonts.BodyBold.copy(color = ColageColors.TextPrimary))
                        Text(
                            if (isVisible) "Others can see you nearby" else "You're hidden from everyone",
                            style = ColageFonts.Caption.copy(color = ColageColors.TextSecondary)
                        )
                    }
                    Switch(
                        checked = isVisible,
                        onCheckedChange = { appViewModel.toggleVisibility() },
                        colors = SwitchDefaults.colors(checkedTrackColor = themeColor)
                    )
                }
            }

            Spacer(Modifier.height(40.dp))
        }
    }
}

@Composable
fun SectionHeader(title: String) {
    Text(
        text = title.uppercase(),
        style = ColageFonts.CaptionBold.copy(
            color = ColageColors.TextTertiary,
            letterSpacing = androidx.compose.ui.unit.TextUnit(1.2f, androidx.compose.ui.unit.TextUnitType.Sp)
        )
    )
}

// Extension to get icon for SocialPlatform
private fun com.colageclub.colage.data.models.SocialPlatform.icon(): androidx.compose.ui.graphics.vector.ImageVector {
    return com.colageclub.colage.features.discovery.icon()
}
