package com.colageclub.colage.features.map

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.viewinterop.AndroidView
import com.colageclub.colage.BuildConfig
import com.colageclub.colage.core.design.ColageColors
import com.colageclub.colage.data.models.NearbyStudent
import com.colageclub.colage.features.discovery.MiniProfileSheet
import com.mapbox.geojson.Point
import com.mapbox.maps.MapView
import com.mapbox.maps.Style
import com.mapbox.maps.dsl.cameraOptions
import com.mapbox.maps.plugin.annotation.annotations
import com.mapbox.maps.plugin.annotation.generated.*
import com.mapbox.maps.plugin.locationcomponent.location

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapDiscoveryView(
    students: List<NearbyStudent>,
    themeColor: Color = ColageColors.Primary,
    onStudentTapped: (NearbyStudent) -> Unit = {}
) {
    var selectedStudent by remember { mutableStateOf<NearbyStudent?>(null) }
    val sheetState = rememberModalBottomSheetState()

    Box(modifier = Modifier.fillMaxSize()) {
        // Mapbox map
        AndroidView(
            factory = { context ->
                MapView(context).apply {
                    mapboxMap.loadStyle(Style.DARK)
                    mapboxMap.setCamera(
                        cameraOptions {
                            center(Point.fromLngLat(-83.7382, 42.2780)) // UMich
                            zoom(15.5)
                        }
                    )
                    // Enable user location puck
                    location.enabled = true
                }
            },
            update = { mapView ->
                // Update annotations
                val annotationApi = mapView.annotations
                // Clear and recreate — simple approach for mock data
                val manager = annotationApi.createCircleAnnotationManager()
                manager.deleteAll()

                val studentMap = mutableMapOf<String, NearbyStudent>()
                students.forEach { student ->
                    val options = CircleAnnotationOptions()
                        .withPoint(Point.fromLngLat(student.location.longitude, student.location.latitude))
                        .withCircleRadius(8.0)
                        .withCircleColor(android.graphics.Color.parseColor("#6C5CE7"))
                        .withCircleStrokeWidth(2.0)
                        .withCircleStrokeColor(android.graphics.Color.WHITE)
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

    // Bottom sheet for selected student
    selectedStudent?.let { student ->
        ModalBottomSheet(
            onDismissRequest = { selectedStudent = null },
            sheetState = sheetState,
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
