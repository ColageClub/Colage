package com.colageclub.colage.features.auth.screens

import android.Manifest
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.colageclub.colage.BuildConfig
import com.colageclub.colage.core.design.*
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberPermissionState

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun PermissionsScreen(onContinue: () -> Unit) {
    var locationGranted by remember { mutableStateOf(false) }
    var cameraGranted by remember { mutableStateOf(false) }
    var notificationsGranted by remember { mutableStateOf(false) }
    var currentPermission by remember { mutableIntStateOf(0) }

    val locationPermission = rememberPermissionState(Manifest.permission.ACCESS_FINE_LOCATION) { granted ->
        locationGranted = granted || BuildConfig.DEV_MODE
        if (granted || BuildConfig.DEV_MODE) currentPermission = 1
    }

    val cameraPermission = rememberPermissionState(Manifest.permission.CAMERA) { granted ->
        cameraGranted = granted || BuildConfig.DEV_MODE
        if (granted || BuildConfig.DEV_MODE) currentPermission = 2
    }

    val notificationPermission = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
        rememberPermissionState(Manifest.permission.POST_NOTIFICATIONS) { granted ->
            notificationsGranted = granted || BuildConfig.DEV_MODE
        }
    } else {
        null
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
            OnboardingProgress(currentStep = 5, totalSteps = 8, modifier = Modifier.padding(top = 8.dp))

            Column(
                modifier = Modifier.fillMaxWidth().padding(top = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Enable permissions",
                    style = ColageFonts.Title.copy(color = ColageColors.TextPrimary)
                )
                Text(
                    text = "Required for the full experience",
                    style = ColageFonts.Body.copy(color = ColageColors.TextSecondary)
                )
            }

            Spacer(Modifier.height(48.dp))

            Column(
                modifier = Modifier.padding(horizontal = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                PermissionCard(
                    icon = Icons.Default.LocationOn,
                    title = "Location",
                    description = "See and be seen on the campus map. Your location is never stored permanently.",
                    isGranted = locationGranted,
                    isActive = currentPermission == 0,
                    onClick = {
                        if (BuildConfig.DEV_MODE) {
                            locationGranted = true
                            currentPermission = 1
                        } else {
                            locationPermission.launchPermissionRequest()
                        }
                    }
                )

                PermissionCard(
                    icon = Icons.Default.CameraAlt,
                    title = "Camera",
                    description = "Use AR discovery mode and take a profile photo.",
                    isGranted = cameraGranted,
                    isActive = currentPermission == 1,
                    onClick = {
                        if (BuildConfig.DEV_MODE) {
                            cameraGranted = true
                            currentPermission = 2
                        } else {
                            cameraPermission.launchPermissionRequest()
                        }
                    }
                )

                PermissionCard(
                    icon = Icons.Default.Notifications,
                    title = "Notifications",
                    description = "Get notified when friends are nearby. Optional.",
                    isGranted = notificationsGranted,
                    isActive = currentPermission == 2,
                    onClick = {
                        if (BuildConfig.DEV_MODE) {
                            notificationsGranted = true
                        } else {
                            notificationPermission?.launchPermissionRequest()
                                ?: run { notificationsGranted = true }
                        }
                    }
                )
            }

            Spacer(Modifier.weight(1f))

            Column(
                modifier = Modifier.padding(horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                ColagePrimaryButton(
                    title = if (locationGranted) "Continue" else "Grant Permissions",
                    onClick = {
                        if (locationGranted) {
                            onContinue()
                        } else {
                            if (BuildConfig.DEV_MODE) {
                                locationGranted = true
                                currentPermission = 1
                            } else {
                                locationPermission.launchPermissionRequest()
                            }
                        }
                    }
                )

                if (!locationGranted) {
                    TextButton(onClick = onContinue) {
                        Text(
                            text = "Skip for now",
                            style = ColageFonts.Body.copy(color = ColageColors.TextSecondary)
                        )
                    }
                }

                Spacer(Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun PermissionCard(
    icon: ImageVector,
    title: String,
    description: String,
    isGranted: Boolean,
    isActive: Boolean,
    onClick: () -> Unit
) {
    val containerColor = if (isActive) ColageColors.SurfaceElevated else ColageColors.Surface
    val borderColor = if (isActive) LocalThemeColor.current.copy(alpha = 0.3f) else ColageColors.Border

    TextButton(
        onClick = { if (!isGranted) onClick() },
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(containerColor)
            .border(1.dp, borderColor, RoundedCornerShape(16.dp)),
        contentPadding = PaddingValues(16.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        (if (isGranted) ColageColors.Online else LocalThemeColor.current).copy(alpha = 0.12f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = if (isGranted) ColageColors.Online else LocalThemeColor.current,
                    modifier = Modifier.size(22.dp)
                )
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = title,
                        style = ColageFonts.BodyBold.copy(color = ColageColors.TextPrimary)
                    )
                    if (isGranted) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = ColageColors.Online,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
                Text(
                    text = description,
                    style = ColageFonts.Caption.copy(color = ColageColors.TextSecondary),
                    maxLines = 2
                )
            }
        }
    }
}
