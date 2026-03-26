package com.colageclub.colage.features.map

import android.graphics.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.colageclub.colage.core.design.ColageColors
import com.colageclub.colage.core.design.LocalThemeColor
import com.colageclub.colage.data.models.NearbyStudent
import com.colageclub.colage.features.discovery.MiniProfileSheet
import com.mapbox.geojson.Point
import com.mapbox.maps.MapView
import com.mapbox.maps.Style
import com.mapbox.maps.dsl.cameraOptions
import com.mapbox.maps.plugin.annotation.annotations
import com.mapbox.maps.plugin.annotation.generated.*
import com.mapbox.maps.plugin.locationcomponent.location
import kotlinx.coroutines.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapDiscoveryView(
    students: List<NearbyStudent>,
    themeColor: Color = LocalThemeColor.current,
    isVisible: Boolean = true,
    currentUserId: String? = null,
    onStudentTapped: (NearbyStudent) -> Unit = {}
) {
    var selectedStudent by remember { mutableStateOf<NearbyStudent?>(null) }
    val themeArgb = themeColor.toArgb()
    val puckArgb = if (isVisible) themeArgb else ColageColors.Offline.toArgb()

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { context ->
                MapView(context).apply {
                    mapboxMap.loadStyle(Style.DARK)
                    mapboxMap.setCamera(
                        cameraOptions {
                            center(Point.fromLngLat(-83.7382, 42.2780))
                            zoom(15.5)
                        }
                    )
                    location.enabled = true
                    // Set puck bearing tint to theme/grey
                    location.pulsingEnabled = isVisible
                    location.puckBearingEnabled = true
                }
            },
            update = { mapView ->
                // Update puck visibility color
                mapView.location.pulsingEnabled = isVisible
                val annotationApi = mapView.annotations
                val manager = annotationApi.createPointAnnotationManager()
                manager.deleteAll()

                val studentMap = mutableMapOf<String, NearbyStudent>()
                students.forEach { student ->
                    val isSelf = currentUserId != null && student.profile.userId == currentUserId
                    val dotColor = if (isSelf) puckArgb else themeArgb
                    val bitmap = createAvatarBitmap(
                        initials = student.profile.displayName.initials(),
                        borderColor = dotColor,
                        size = 28
                    )
                    val options = PointAnnotationOptions()
                        .withPoint(Point.fromLngLat(student.location.longitude, student.location.latitude))
                        .withIconImage(bitmap)
                        .withIconSize(1.0)
                        .withIconAnchor(com.mapbox.maps.extension.style.layers.properties.generated.IconAnchor.CENTER)
                        .withTextField(student.profile.displayName.split(" ").first())
                        .withTextSize(9.0)
                        .withTextColor(android.graphics.Color.WHITE)
                        .withTextOffset(listOf(0.0, 1.8))
                        .withTextHaloColor(android.graphics.Color.BLACK)
                        .withTextHaloWidth(1.5)
                    val annotation = manager.create(options)
                    studentMap[annotation.id] = student
                }

                manager.addClickListener { annotation ->
                    studentMap[annotation.id]?.let {
                        selectedStudent = it
                    }
                    true
                }
            },
            modifier = Modifier.fillMaxSize()
        )
    }

    selectedStudent?.let { student ->
        val studentSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)
        ModalBottomSheet(
            onDismissRequest = { selectedStudent = null },
            sheetState = studentSheetState,
            containerColor = ColageColors.Background,
            dragHandle = { BottomSheetDefaults.DragHandle(color = ColageColors.Border) }
        ) {
            MiniProfileSheet(
                student = student,
                themeColor = themeColor,
                onDismiss = { selectedStudent = null }
            )
        }
    }
}

/** Create a circular avatar bitmap with initials and a colored border */
private fun createAvatarBitmap(initials: String, borderColor: Int, size: Int): Bitmap {
    val sizePx = (size * 2.5f).toInt() // Higher res for retina
    val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val borderWidth = sizePx * 0.06f

    // Border circle
    val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = borderColor
        style = Paint.Style.FILL
    }
    canvas.drawCircle(sizePx / 2f, sizePx / 2f, sizePx / 2f, borderPaint)

    // Inner background
    val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = android.graphics.Color.argb(255, 38, 38, 50)
        style = Paint.Style.FILL
    }
    canvas.drawCircle(sizePx / 2f, sizePx / 2f, sizePx / 2f - borderWidth, bgPaint)

    // Initials text
    val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = android.graphics.Color.WHITE
        textSize = sizePx * 0.32f
        typeface = Typeface.DEFAULT_BOLD
        textAlign = Paint.Align.CENTER
    }
    val textY = sizePx / 2f - (textPaint.descent() + textPaint.ascent()) / 2f
    canvas.drawText(initials, sizePx / 2f, textY, textPaint)

    return bitmap
}

private fun String.initials(): String {
    val parts = this.trim().split(" ").filter { it.isNotEmpty() }
    return if (parts.size >= 2) "${parts[0].first()}${parts[1].first()}".uppercase()
    else this.take(2).uppercase()
}
