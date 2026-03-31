package com.colageclub.colage.features.ads

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.colageclub.colage.core.design.*
import com.colageclub.colage.data.models.AdData
import com.colageclub.colage.data.models.UserProfile

@Composable
fun AdBannerView(
    adService: AdService,
    userProfile: UserProfile? = null
) {
    val currentAd by adService.currentAd.collectAsState()
    var showDetail by remember { mutableStateOf(false) }
    val school = userProfile?.universityDomain ?: "umich.edu"
    val studentId = userProfile?.userId ?: "anonymous"

    // Initial fetch + start rotation
    LaunchedEffect(school, studentId) {
        adService.fetchAd(school, studentId)
        adService.startRotation(school, studentId)
    }

    DisposableEffect(Unit) {
        onDispose { adService.stopRotation() }
    }

    currentAd?.let { ad ->
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(ColageColors.Surface.copy(alpha = 0.9f))
                .border(0.5.dp, ColageColors.Border.copy(alpha = 0.5f), RoundedCornerShape(18.dp))
                .clickable { showDetail = true }
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Emoji logo
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(LocalThemeColor.current.copy(alpha = 0.15f), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(ad.displayEmoji, fontSize = 22.sp)
                }

                // Info
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        ad.businessName,
                        style = ColageFonts.BodyBold.copy(color = ColageColors.TextPrimary),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        ad.deal,
                        style = ColageFonts.Caption.copy(color = ColageColors.Online),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                // Distance + Ad badge
                Column(horizontalAlignment = Alignment.End) {
                    Text(ad.displayDistance, style = ColageFonts.MonoSmall.copy(color = ColageColors.TextTertiary))
                    Text(
                        "Ad",
                        fontSize = 8.sp,
                        color = ColageColors.TextTertiary,
                        modifier = Modifier
                            .background(ColageColors.TextTertiary.copy(alpha = 0.15f), RoundedCornerShape(50))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }
            // Subtle emoji watermark — drawn on top of Row content with low alpha
            Text(
                ad.displayEmoji,
                fontSize = 60.sp,
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .offset(x = (-10).dp)
                    .graphicsLayer { alpha = 0.04f }
            )
        }

        if (showDetail) {
            AdDetailSheet(ad = ad, onDismiss = { showDetail = false })
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdDetailSheet(ad: AdData, onDismiss: () -> Unit) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)
    val context = LocalContext.current

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = ColageColors.Background,
        dragHandle = { BottomSheetDefaults.DragHandle(color = ColageColors.Border) }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
        ) {
            // Header gradient
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(LocalThemeColor.current.copy(alpha = 0.15f), ColageColors.Background)
                        )
                    ),
                contentAlignment = Alignment.BottomCenter
            ) {
                // Large emoji watermark in header background
                Text(
                    ad.displayEmoji,
                    fontSize = 100.sp,
                    modifier = Modifier
                        .align(Alignment.Center)
                        .graphicsLayer { alpha = 0.08f }
                )
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .offset(y = 36.dp)
                        .background(LocalThemeColor.current.copy(alpha = 0.15f), RoundedCornerShape(20.dp))
                        .border(2.dp, LocalThemeColor.current.copy(alpha = 0.3f), RoundedCornerShape(20.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(ad.displayEmoji, fontSize = 36.sp)
                }
            }

            Spacer(Modifier.height(44.dp))

            Column(
                modifier = Modifier.padding(horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(ad.businessName, style = ColageFonts.Title.copy(color = ColageColors.TextPrimary, textAlign = TextAlign.Center))
                if (ad.bio.isNotEmpty()) {
                    Spacer(Modifier.height(6.dp))
                    Text(ad.bio, style = ColageFonts.Body.copy(color = ColageColors.TextSecondary, textAlign = TextAlign.Center))
                }

                Spacer(Modifier.height(20.dp))

                // Deal card
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(ColageColors.Online.copy(alpha = 0.08f), RoundedCornerShape(16.dp))
                        .border(1.dp, ColageColors.Online.copy(alpha = 0.15f), RoundedCornerShape(16.dp))
                        .padding(vertical = 16.dp, horizontal = 20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("🎉")
                        Text(ad.deal, style = ColageFonts.BodyBold.copy(color = ColageColors.Online))
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Screenshot this ad and show it at checkout",
                        style = ColageFonts.Caption.copy(color = ColageColors.TextTertiary)
                    )
                }

                Spacer(Modifier.height(20.dp))

                // Info badges
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    InfoBadge(Icons.Default.LocationOn, ad.displayDistance)
                    InfoBadge(Icons.Default.Schedule, "Open now")
                    InfoBadge(Icons.Default.CameraAlt, "Screenshot")
                }

                Spacer(Modifier.height(24.dp))

                // Buttons
                ColagePrimaryButton(
                    title = "Get Directions",
                    onClick = {
                        ad.lat?.let { lat -> ad.lng?.let { lng ->
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("google.navigation:q=$lat,$lng"))
                            intent.setPackage("com.google.android.apps.maps")
                            try {
                                context.startActivity(intent)
                            } catch (e: Exception) {
                                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/dir/?api=1&destination=$lat,$lng")))
                            }
                        }}
                    }
                )
                Spacer(Modifier.height(10.dp))
                Button(
                    onClick = { /* Screenshot */ },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = LocalThemeColor.current.copy(alpha = 0.1f))
                ) {
                    Icon(Icons.Default.CameraAlt, null, tint = LocalThemeColor.current, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Save Screenshot", style = ColageFonts.BodyBold.copy(color = LocalThemeColor.current))
                }

                Spacer(Modifier.height(40.dp))
            }
        }
    }
}

@Composable
private fun InfoBadge(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(icon, null, tint = ColageColors.TextTertiary, modifier = Modifier.size(16.dp))
        Spacer(Modifier.height(4.dp))
        Text(text, style = ColageFonts.Caption.copy(color = ColageColors.TextSecondary))
    }
}
