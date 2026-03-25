package com.colageclub.colage.features.ar

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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.colageclub.colage.core.design.*
import com.colageclub.colage.data.models.NearbyStudent
import com.colageclub.colage.features.discovery.MiniProfileSheet
import com.colageclub.colage.features.discovery.NearbyStudentsViewModel
import kotlin.random.Random

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ARDiscoveryView(
    viewModel: NearbyStudentsViewModel,
    currentFloor: Int,
    themeColor: Color = LocalThemeColor.current
) {
    val arMaxDistance by viewModel.arMaxDistance.collectAsState()
    val students = viewModel.arFilteredStudents()
    var selectedStudent by remember { mutableStateOf<NearbyStudent?>(null) }

    Box(modifier = Modifier.fillMaxSize()) {
        // Simulated AR background (no ARCore in emulator)
        SimulatedARBackground(
            students = students.take(10),
            themeColor = themeColor,
            onStudentTapped = { selectedStudent = it }
        )

        // Overlay UI
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Bottom
        ) {
            // AR Range slider
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(ColageColors.Surface.copy(alpha = 0.85f))
                    .padding(horizontal = 20.dp, vertical = 12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("AR Range", style = ColageFonts.Caption.copy(color = ColageColors.TextSecondary))
                    Text(
                        viewModel.arDistanceFeet.formattedDistance(),
                        style = ColageFonts.MonoSmall.copy(color = themeColor)
                    )
                }
                Slider(
                    value = arMaxDistance,
                    onValueChange = { viewModel.setArMaxDistance(it) },
                    valueRange = 0f..1f,
                    colors = SliderDefaults.colors(thumbColor = themeColor, activeTrackColor = themeColor)
                )
            }

            Spacer(Modifier.height(8.dp))

            // Bottom info bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(ColageColors.Surface.copy(alpha = 0.85f))
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(ColageColors.Online)
                    )
                    Text("${students.size} visible", style = ColageFonts.CaptionBold.copy(color = ColageColors.TextPrimary))
                }
                Text("Floor $currentFloor", style = ColageFonts.MonoSmall.copy(color = ColageColors.TextSecondary))
            }

            Spacer(Modifier.height(100.dp))
        }
    }

    // Bottom sheet
    selectedStudent?.let { student ->
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)
        ModalBottomSheet(
            onDismissRequest = { selectedStudent = null },
            sheetState = sheetState,
            containerColor = ColageColors.Background,
            dragHandle = { BottomSheetDefaults.DragHandle(color = ColageColors.Border) }
        ) {
            MiniProfileSheet(student = student, themeColor = themeColor)
        }
    }
}

@Composable
fun SimulatedARBackground(
    students: List<NearbyStudent>,
    themeColor: Color,
    onStudentTapped: (NearbyStudent) -> Unit
) {
    // Generate stable random positions
    val positions = remember(students.map { it.id }) {
        students.associate { student ->
            student.id to Pair(
                Random.nextFloat() * 0.7f + 0.1f, // x: 10-80% of width
                Random.nextFloat() * 0.5f + 0.15f  // y: 15-65% of height
            )
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFF1A1A2E), Color(0xFF0A0A1A))
                )
            )
    ) {
        // Grid lines for AR effect
        repeat(8) { i ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .offset(y = (i * 100).dp)
                    .background(Color.White.copy(alpha = 0.03f))
            )
        }

        // SIMULATOR label
        Row(
            modifier = Modifier
                .padding(start = 16.dp, top = 90.dp)
                .background(ColageColors.Surface.copy(alpha = 0.6f), RoundedCornerShape(50))
                .padding(horizontal = 12.dp, vertical = 6.dp)
        ) {
            Icon(Icons.Default.CameraAlt, null, tint = ColageColors.TextTertiary, modifier = Modifier.size(12.dp))
            Spacer(Modifier.width(4.dp))
            Text("SIMULATOR", style = ColageFonts.CaptionBold.copy(color = ColageColors.TextTertiary))
        }

        // Floating bubbles
        BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
            students.forEach { student ->
                val pos = positions[student.id] ?: return@forEach
                val x = maxWidth * pos.first
                val y = maxHeight * pos.second

                ARBubble(
                    student = student,
                    themeColor = themeColor,
                    modifier = Modifier
                        .offset(x = x, y = y)
                        .clickable { onStudentTapped(student) }
                )
            }
        }
    }
}

@Composable
fun ARBubble(
    student: NearbyStudent,
    themeColor: Color,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        AvatarView(
            imageUrl = student.profile.profilePhotoURL,
            size = 48.dp,
            borderColor = themeColor,
            initials = student.profile.displayName.initials()
        )

        Spacer(Modifier.height(4.dp))

        Column(
            modifier = Modifier
                .background(ColageColors.Surface.copy(alpha = 0.8f), RoundedCornerShape(10.dp))
                .padding(horizontal = 10.dp, vertical = 6.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                student.profile.displayName.split(" ").first(),
                style = ColageFonts.CaptionBold.copy(color = Color.White)
            )
            Text(
                student.distance.formattedDistance(),
                style = ColageFonts.MonoSmall.copy(color = themeColor)
            )
        }
    }
}
