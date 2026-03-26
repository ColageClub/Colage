package com.colageclub.colage.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.colageclub.colage.core.design.*
import com.colageclub.colage.core.university.primaryComposeColor
import com.colageclub.colage.features.ads.AdBannerView
import com.colageclub.colage.features.ar.ARDiscoveryView
import com.colageclub.colage.features.discovery.NearbyStudentsViewModel
import com.colageclub.colage.features.list.ListDiscoveryView
import com.colageclub.colage.features.map.MapDiscoveryView
import com.colageclub.colage.features.profile.EditProfileScreen
import com.colageclub.colage.features.profile.OwnProfileScreen
import com.colageclub.colage.features.profile.SettingsScreen

@Composable
fun HomeScreen(appViewModel: AppViewModel) {
    val discoveryMode by appViewModel.discoveryMode.collectAsState()
    val currentProfile by appViewModel.currentProfile.collectAsState()
    val isVisible by appViewModel.isVisible.collectAsState()
    val currentFloor by appViewModel.currentFloor.collectAsState()
    val university by appViewModel.currentUniversity.collectAsState()
    val theme by appViewModel.currentTheme.collectAsState()
    val themeColor = theme.primaryComposeColor()

    val nearbyVM: NearbyStudentsViewModel = hiltViewModel()

    var showOwnProfile by remember { mutableStateOf(false) }
    var showEditProfile by remember { mutableStateOf(false) }
    var showSettings by remember { mutableStateOf(false) }

    // Load mock data on first appear
    LaunchedEffect(Unit) {
        appViewModel.onHomeReady()
        nearbyVM.loadMockData()
    }

    // Sync floor filter
    LaunchedEffect(currentFloor) {
        nearbyVM.setFilterFloor(currentFloor)
    }

    Box(modifier = Modifier.fillMaxSize().background(ColageColors.Background)) {
                // Discovery views
                when (discoveryMode) {
                    DiscoveryMode.MAP -> {
                        // Add self to map markers using real GPS
                        val mapStudents = nearbyVM.mapStudents().toMutableList()
                        val currentLocation = appViewModel.locationService.currentLocation.collectAsState().value
                        currentProfile?.let { profile ->
                            val selfLat = currentLocation?.latitude ?: 42.2780
                            val selfLng = currentLocation?.longitude ?: -83.7382
                            val selfStudent = com.colageclub.colage.data.models.NearbyStudent(
                                profile = profile,
                                location = com.colageclub.colage.data.models.StudentLocation(
                                    userId = profile.userId,
                                    latitude = selfLat,
                                    longitude = selfLng,
                                    floor = currentFloor
                                ),
                                distance = 0.0
                            )
                            mapStudents.add(0, selfStudent)
                        }
                        MapDiscoveryView(
                            students = mapStudents,
                            themeColor = themeColor,
                            isVisible = isVisible,
                            currentUserId = currentProfile?.userId
                        )
                    }
                    DiscoveryMode.LIST -> ListDiscoveryView(
                        viewModel = nearbyVM,
                        currentFloor = currentFloor,
                        themeColor = themeColor
                    )
                    DiscoveryMode.AR -> ARDiscoveryView(
                        viewModel = nearbyVM,
                        currentFloor = currentFloor,
                        themeColor = themeColor
                    )
                }

                // Top overlay bar
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Visibility toggle — matches iOS: no green tint, just icon color change
                        IconButton(
                            onClick = { appViewModel.toggleVisibility() },
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(ColageColors.Surface.copy(alpha = 0.8f))
                        ) {
                            Icon(
                                if (isVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                contentDescription = "Toggle visibility",
                                tint = if (isVisible) ColageColors.TextPrimary else ColageColors.TextTertiary,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        Spacer(Modifier.weight(1f))

                        // Mode picker
                        DiscoveryModePicker(
                            activeMode = discoveryMode,
                            onModeSelected = { appViewModel.setDiscoveryMode(it) }
                        )

                        Spacer(Modifier.weight(1f))

                        // Profile button
                        IconButton(onClick = { showOwnProfile = true }) {
                            AvatarView(
                                imageUrl = currentProfile?.profilePhotoURL,
                                size = 36.dp,
                                borderColor = themeColor,
                                initials = currentProfile?.displayName?.initials()
                            )
                        }
                    }

                    // University label
                    university?.let { uni ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 4.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                uni.name,
                                style = ColageFonts.CaptionBold.copy(color = ColageColors.TextSecondary)
                            )
                            Spacer(Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(ColageColors.Online)
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                "${nearbyVM.mapStudents().size} nearby",
                                style = ColageFonts.Caption.copy(color = ColageColors.TextTertiary)
                            )
                        }
                    }
                }

                // Floor picker — left side (all modes)
                Column(
                    modifier = Modifier
                        .align(Alignment.CenterStart)
                        .padding(start = 12.dp)
                ) {
                    FloorPicker(
                        selectedFloor = currentFloor,
                        onFloorSelected = { appViewModel.setFloor(it) }
                    )
                }

                // Ad banner at bottom (all modes)
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(horizontal = 12.dp, vertical = 16.dp)
                ) {
                    AdBannerView()
                }
            }

    // Full-screen overlays
    if (showOwnProfile) {
        OwnProfileScreen(
            appViewModel = appViewModel,
            onDismiss = { showOwnProfile = false },
            onEditProfile = {
                showOwnProfile = false
                showEditProfile = true
            },
            onSettings = {
                showOwnProfile = false
                showSettings = true
            }
        )
    }

    if (showEditProfile) {
        EditProfileScreen(
            appViewModel = appViewModel,
            onDismiss = { showEditProfile = false }
        )
    }

    if (showSettings) {
        SettingsScreen(
            appViewModel = appViewModel,
            onDismiss = { showSettings = false }
        )
    }
}

@Composable
fun DiscoveryModePicker(
    activeMode: DiscoveryMode,
    onModeSelected: (DiscoveryMode) -> Unit
) {
    Row(
        modifier = Modifier
            .background(ColageColors.Surface.copy(alpha = 0.6f), RoundedCornerShape(14.dp))
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        DiscoveryMode.entries.forEach { mode ->
            val isSelected = activeMode == mode
            Text(
                text = mode.label,
                style = ColageFonts.CaptionBold.copy(
                    color = if (isSelected) ColageColors.TextPrimary else ColageColors.TextSecondary
                ),
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (isSelected) LocalThemeColor.current else Color.Transparent)
                    .clickable { onModeSelected(mode) }
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            )
        }
    }
}

@Composable
fun FloorPicker(
    selectedFloor: Int,
    onFloorSelected: (Int) -> Unit
) {
    val floors = listOf(6, 5, 4, 3, 2, 1, -1, -2)

    Column(
        modifier = Modifier
            .background(ColageColors.Surface.copy(alpha = 0.9f), RoundedCornerShape(12.dp))
            .padding(vertical = 4.dp, horizontal = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        floors.forEach { floor ->
            val isSelected = selectedFloor == floor
            val label = when {
                floor < 0 -> "B${kotlin.math.abs(floor)}"
                else -> "$floor"
            }
            Text(
                text = label,
                style = ColageFonts.CaptionBold.copy(
                    color = if (isSelected) LocalThemeColor.current else ColageColors.TextSecondary
                ),
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(if (isSelected) LocalThemeColor.current.copy(alpha = 0.15f) else Color.Transparent)
                    .clickable { onFloorSelected(floor) }
                    .padding(horizontal = 10.dp, vertical = 6.dp)
            )
        }
    }
}

// initials() extension is in Components.kt
