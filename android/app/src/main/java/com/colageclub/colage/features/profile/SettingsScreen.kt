package com.colageclub.colage.features.profile

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.colageclub.colage.app.AppViewModel
import com.colageclub.colage.core.design.*
import com.colageclub.colage.core.university.primaryComposeColor

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    appViewModel: AppViewModel,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val isVisible by appViewModel.isVisible.collectAsState()
    val university by appViewModel.currentUniversity.collectAsState()
    val currentTheme by appViewModel.currentTheme.collectAsState()
    val availableThemes by appViewModel.availableThemes.collectAsState()

    var showLogoutDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showAlumniDialog by remember { mutableStateOf(false) }
    val currentProfile by appViewModel.currentProfile.collectAsState()

    Scaffold(
        containerColor = ColageColors.Background,
        topBar = {
            TopAppBar(
                title = { Text("Settings", style = ColageFonts.Title3.copy(color = ColageColors.TextPrimary)) },
                actions = {
                    TextButton(onClick = onDismiss) {
                        Text("Done", style = ColageFonts.Body.copy(color = LocalThemeColor.current))
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
                .verticalScroll(rememberScrollState())
        ) {
            // Server section
            SettingsSection("Server") {
                val serverType = currentProfile?.serverType
                val serverLabel = if (serverType == com.colageclub.colage.data.models.ServerType.ALUMNI) {
                    "Alumni Network"
                } else {
                    university?.name ?: "School"
                }
                val serverIcon = if (serverType == com.colageclub.colage.data.models.ServerType.ALUMNI) {
                    Icons.Default.Public
                } else {
                    Icons.Default.AccountBalance
                }
                SettingsRow(serverIcon, "Server", serverLabel)

                if (serverType == com.colageclub.colage.data.models.ServerType.STUDENT) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { showAlumniDialog = true }
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.School, null, tint = LocalThemeColor.current, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(12.dp))
                        Text("Join Alumni Server", style = ColageFonts.Body.copy(color = LocalThemeColor.current), modifier = Modifier.weight(1f))
                        Icon(Icons.Default.ChevronRight, null, tint = ColageColors.TextTertiary, modifier = Modifier.size(16.dp))
                    }
                }
            }

            // Account section
            SettingsSection("Account") {
                SettingsRow(Icons.Default.Email, "Email", appViewModel.userEmail ?: "—")
            }

            // Privacy section
            SettingsSection("Privacy") {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Visibility, null, tint = LocalThemeColor.current, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(12.dp))
                    Text("Visible on Map", style = ColageFonts.Body.copy(color = ColageColors.TextPrimary), modifier = Modifier.weight(1f))
                    Switch(
                        checked = isVisible,
                        onCheckedChange = { appViewModel.toggleVisibility() },
                        colors = SwitchDefaults.colors(checkedTrackColor = LocalThemeColor.current)
                    )
                }
            }

            // Appearance section
            if (availableThemes.isNotEmpty()) {
                SettingsSection("Appearance") {
                    availableThemes.forEach { theme ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { appViewModel.selectTheme(theme) }
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(24.dp)
                                    .clip(CircleShape)
                                    .background(theme.primaryComposeColor())
                            )
                            Spacer(Modifier.width(12.dp))
                            Text(theme.name, style = ColageFonts.Body.copy(color = ColageColors.TextPrimary), modifier = Modifier.weight(1f))
                            if (currentTheme.id == theme.id) {
                                Icon(Icons.Default.Check, null, tint = LocalThemeColor.current, modifier = Modifier.size(20.dp))
                            }
                        }
                    }
                }
            }

            // About section
            SettingsSection("About") {
                SettingsRow(Icons.Default.Info, "Version", "1.0.0")
                SettingsRowLink(Icons.Default.Lock, "Privacy Policy") {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://colageclub.com/privacy")))
                }
                SettingsRowLink(Icons.Default.Description, "Terms of Service") {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://colageclub.com/terms")))
                }
                SettingsRow(Icons.Default.Map, "Map Data", "© Mapbox, OpenStreetMap")
            }

            // Danger zone
            SettingsSection("") {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showLogoutDialog = true }
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Logout, null, tint = ColageColors.Warning, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(12.dp))
                    Text("Log Out", style = ColageFonts.Body.copy(color = ColageColors.Warning))
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showDeleteDialog = true }
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Delete, null, tint = ColageColors.Error, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(12.dp))
                    Text("Delete Account", style = ColageFonts.Body.copy(color = ColageColors.Error))
                }
            }

            // Dev section
            if (appViewModel.devMode) {
                SettingsSection("Developer") {
                    SettingsRow(Icons.Default.Build, "Dev Mode", "ON")
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                appViewModel.logout()
                                onDismiss()
                            }
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Refresh, null, tint = ColageColors.Warning, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(12.dp))
                        Text("Reset Onboarding", style = ColageFonts.Body.copy(color = ColageColors.Warning))
                    }
                }
            }

            Spacer(Modifier.height(40.dp))
        }
    }

    // Logout dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Log Out") },
            text = { Text("Are you sure you want to log out?") },
            confirmButton = {
                TextButton(onClick = {
                    appViewModel.logout()
                    showLogoutDialog = false
                    onDismiss()
                }) { Text("Log Out", color = ColageColors.Error) }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) { Text("Cancel") }
            }
        )
    }

    // Alumni dialog
    if (showAlumniDialog) {
        AlertDialog(
            onDismissRequest = { showAlumniDialog = false },
            title = { Text("Join Alumni Server?") },
            text = { Text("You're about to leave your school's server and join the Alumni Network. You won't be able to rejoin your school's server unless you show proof of re-enrollment.") },
            confirmButton = {
                TextButton(onClick = {
                    appViewModel.switchServerType(
                        to = com.colageclub.colage.data.models.ServerType.ALUMNI
                    ) { /* result handled internally */ }
                    showAlumniDialog = false
                }) { Text("Join Alumni", color = ColageColors.Error) }
            },
            dismissButton = {
                TextButton(onClick = { showAlumniDialog = false }) { Text("Cancel") }
            }
        )
    }

    // Delete dialog
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Account") },
            text = { Text("This will permanently delete your account and all data. This cannot be undone.") },
            confirmButton = {
                TextButton(onClick = {
                    appViewModel.deleteAccount { _ ->
                        showDeleteDialog = false
                        onDismiss()
                    }
                }) { Text("Delete", color = ColageColors.Error) }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) { Text("Cancel") }
            }
        )
    }
}

@Composable
private fun SettingsSection(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column(modifier = Modifier.padding(vertical = 8.dp)) {
        if (title.isNotEmpty()) {
            Text(
                text = title,
                style = ColageFonts.CaptionBold.copy(color = ColageColors.TextTertiary),
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )
        }
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp)
                .background(ColageColors.Surface, RoundedCornerShape(12.dp))
        ) {
            content()
        }
    }
}

@Composable
private fun SettingsRow(icon: ImageVector, title: String, value: String? = null) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = LocalThemeColor.current, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(12.dp))
        Text(title, style = ColageFonts.Body.copy(color = ColageColors.TextPrimary), modifier = Modifier.weight(1f))
        value?.let {
            Text(it, style = ColageFonts.Caption.copy(color = ColageColors.TextTertiary))
        }
    }
}

@Composable
private fun SettingsRowLink(icon: ImageVector, title: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = LocalThemeColor.current, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(12.dp))
        Text(title, style = ColageFonts.Body.copy(color = ColageColors.TextPrimary), modifier = Modifier.weight(1f))
        Icon(Icons.Default.ChevronRight, null, tint = ColageColors.TextTertiary, modifier = Modifier.size(16.dp))
    }
}
