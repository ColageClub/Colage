package com.colageclub.colage.features.list

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.colageclub.colage.core.design.*
import com.colageclub.colage.data.models.NearbyStudent
import com.colageclub.colage.features.discovery.MiniProfileSheet
import com.colageclub.colage.features.discovery.NearbyStudentsViewModel
import kotlin.math.abs

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ListDiscoveryView(
    viewModel: NearbyStudentsViewModel,
    currentFloor: Int,
    themeColor: Color = ColageColors.Primary
) {
    val maxDistance by viewModel.maxDistance.collectAsState()
    val filterFloor by viewModel.filterFloor.collectAsState()
    val students = viewModel.filteredStudents()
    var selectedStudent by remember { mutableStateOf<NearbyStudent?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ColageColors.Background)
    ) {
        Spacer(Modifier.height(80.dp))

        // Distance slider
        Column(modifier = Modifier.padding(horizontal = 20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Within", style = ColageFonts.Caption.copy(color = ColageColors.TextSecondary))
                Text(
                    viewModel.listDistanceFeet.formattedDistance(),
                    style = ColageFonts.MonoSmall.copy(color = themeColor)
                )
            }
            Slider(
                value = maxDistance,
                onValueChange = { viewModel.setMaxDistance(it) },
                valueRange = 0f..1f,
                colors = SliderDefaults.colors(
                    thumbColor = themeColor,
                    activeTrackColor = themeColor
                )
            )
        }

        // Floor filter chips
        Row(
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            FloorChip("All Floors", filterFloor == null) { viewModel.setFilterFloor(null) }
            FloorChip("Floor $currentFloor", filterFloor == currentFloor) { viewModel.setFilterFloor(currentFloor) }
            Spacer(Modifier.weight(1f))
            Text("${students.size} nearby", style = ColageFonts.Caption.copy(color = ColageColors.TextTertiary))
        }

        Spacer(Modifier.height(12.dp))

        if (students.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.PersonOff, null, tint = ColageColors.TextTertiary, modifier = Modifier.size(40.dp))
                    Spacer(Modifier.height(12.dp))
                    Text("No students within range", style = ColageFonts.Body.copy(color = ColageColors.TextSecondary))
                    Text("Try increasing the distance", style = ColageFonts.Caption.copy(color = ColageColors.TextTertiary))
                }
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(students, key = { it.id }) { student ->
                    StudentCard(
                        student = student,
                        themeColor = themeColor,
                        onClick = { selectedStudent = student }
                    )
                }
            }
        }
    }

    // Bottom sheet
    selectedStudent?.let { student ->
        val sheetState = rememberModalBottomSheetState()
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
fun StudentCard(
    student: NearbyStudent,
    themeColor: Color,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(ColageColors.Surface, RoundedCornerShape(16.dp))
            .border(0.5.dp, ColageColors.Border, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 16.dp, horizontal = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        AvatarView(
            imageUrl = student.profile.profilePhotoURL,
            size = 72.dp,
            borderColor = themeColor,
            initials = student.profile.displayName.initials()
        )
        Spacer(Modifier.height(10.dp))
        Text(
            student.profile.displayName,
            style = ColageFonts.BodyBold.copy(color = ColageColors.TextPrimary),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        student.profile.major?.let {
            Text(it, style = ColageFonts.Caption.copy(color = ColageColors.TextSecondary), maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Spacer(Modifier.height(4.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.LocationOn, null, tint = themeColor, modifier = Modifier.size(10.dp))
            Text(student.distance.formattedDistance(), style = ColageFonts.MonoSmall.copy(color = ColageColors.TextSecondary))
            if (student.location.floor != 1) {
                Text(
                    "· ${if (student.location.floor < 0) "B${abs(student.location.floor)}" else "F${student.location.floor}"}",
                    style = ColageFonts.MonoSmall.copy(color = ColageColors.TextTertiary)
                )
            }
        }
    }
}

@Composable
fun FloorChip(label: String, isSelected: Boolean, onClick: () -> Unit) {
    Text(
        text = label,
        style = ColageFonts.CaptionBold.copy(
            color = if (isSelected) ColageColors.TextPrimary else ColageColors.TextTertiary
        ),
        modifier = Modifier
            .background(
                if (isSelected) ColageColors.Primary.copy(alpha = 0.2f) else ColageColors.Surface,
                RoundedCornerShape(50)
            )
            .border(
                1.dp,
                if (isSelected) ColageColors.Primary.copy(alpha = 0.4f) else ColageColors.Border,
                RoundedCornerShape(50)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 6.dp)
    )
}
