package com.colageclub.colage.features.map

import android.graphics.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import kotlinx.coroutines.launch
import coil.imageLoader
import coil.request.ImageRequest
import coil.request.SuccessResult
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
    val context = LocalContext.current
    var mapViewRef by remember { mutableStateOf<MapView?>(null) }
    // Cache downloaded avatar bitmaps by userId
    val avatarCache = remember { mutableMapOf<String, Bitmap>() }
    val pendingDownloads = remember { mutableSetOf<String>() }
    // Trigger recomposition when a photo finishes downloading
    var photoRevision by remember { mutableIntStateOf(0) }
    val coroutineScope = rememberCoroutineScope()

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                MapView(ctx).apply {
                    mapboxMap.loadStyle(Style.DARK)
                    mapboxMap.setCamera(
                        cameraOptions {
                            center(Point.fromLngLat(-83.7382, 42.2780))
                            zoom(15.5)
                        }
                    )
                    location.enabled = true
                    location.pulsingEnabled = isVisible
                    location.puckBearingEnabled = true
                    mapViewRef = this
                }
            },
            update = { mapView ->
                // Force recomposition dependency on photoRevision
                photoRevision.let { _ -> }

                mapView.location.pulsingEnabled = isVisible
                val annotationApi = mapView.annotations
                val manager = annotationApi.createPointAnnotationManager()
                manager.deleteAll()

                val studentMap = mutableMapOf<String, NearbyStudent>()
                students.forEach { student ->
                    val isSelf = currentUserId != null && student.profile.userId == currentUserId
                    val dotColor = if (isSelf) puckArgb else themeArgb
                    val userId = student.profile.userId

                    // Use cached photo bitmap, or initials placeholder
                    val bitmap = avatarCache[userId] ?: run {
                        // Start async photo download if we haven't already
                        val photoUrl = student.profile.profilePhotoURL
                        if (photoUrl != null && userId !in pendingDownloads) {
                            pendingDownloads.add(userId)
                            coroutineScope.launch {
                                val downloaded = downloadAvatarBitmap(context, photoUrl, dotColor, 28)
                                if (downloaded != null) {
                                    avatarCache[userId] = downloaded
                                    photoRevision++ // trigger map update
                                }
                                pendingDownloads.remove(userId)
                            }
                        }
                        // Return initials placeholder for now
                        createAvatarBitmap(
                            initials = student.profile.displayName.initials(),
                            borderColor = dotColor,
                            size = 28
                        )
                    }

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

        // Recenter button (like Google Maps location FAB)
        IconButton(
            onClick = {
                // Recenter on first student (self) or default
                val self = students.firstOrNull { it.distance == 0.0 }
                val lat = self?.location?.latitude ?: 42.2780
                val lng = self?.location?.longitude ?: -83.7382
                mapViewRef?.mapboxMap?.setCamera(
                    cameraOptions {
                        center(Point.fromLngLat(lng, lat))
                        zoom(15.5)
                    }
                )
            },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = 120.dp)
                .size(44.dp)
                .clip(CircleShape)
                .background(ColageColors.Surface.copy(alpha = 0.9f))
        ) {
            Icon(
                Icons.Default.MyLocation,
                contentDescription = "Recenter",
                tint = ColageColors.TextPrimary,
                modifier = Modifier.size(20.dp)
            )
        }
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

/** Download a profile photo and return a circular bitmap with colored border */
private suspend fun downloadAvatarBitmap(
    context: android.content.Context,
    url: String,
    borderColor: Int,
    size: Int
): Bitmap? {
    return try {
        val request = ImageRequest.Builder(context)
            .data(url)
            .size(size * 3) // High-res
            .build()
        val result = context.imageLoader.execute(request)
        if (result is SuccessResult) {
            val photo = (result.drawable as? android.graphics.drawable.BitmapDrawable)?.bitmap
                ?: return null
            createCircularPhotoBitmap(photo, borderColor, size)
        } else null
    } catch (_: Exception) {
        null
    }
}

/** Crop a photo into a circle with a colored border — matches iOS createCircularImage */
private fun createCircularPhotoBitmap(photo: Bitmap, borderColor: Int, size: Int): Bitmap {
    val sizePx = (size * 2.5f).toInt()
    val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val borderWidth = sizePx * 0.06f

    // Border circle
    val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = borderColor
        style = Paint.Style.FILL
    }
    canvas.drawCircle(sizePx / 2f, sizePx / 2f, sizePx / 2f, borderPaint)

    // Clip to inner circle and draw photo
    val innerRadius = sizePx / 2f - borderWidth
    val path = android.graphics.Path().apply {
        addCircle(sizePx / 2f, sizePx / 2f, innerRadius, android.graphics.Path.Direction.CW)
    }
    canvas.save()
    canvas.clipPath(path)

    // Scale photo to fill the inner circle
    val scaled = Bitmap.createScaledBitmap(photo, (innerRadius * 2).toInt(), (innerRadius * 2).toInt(), true)
    canvas.drawBitmap(scaled, borderWidth, borderWidth, null)
    canvas.restore()

    return bitmap
}

/** Create a circular avatar bitmap with initials and a colored border (placeholder) */
private fun createAvatarBitmap(initials: String, borderColor: Int, size: Int): Bitmap {
    val sizePx = (size * 2.5f).toInt()
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
