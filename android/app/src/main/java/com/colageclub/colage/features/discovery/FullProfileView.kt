package com.colageclub.colage.features.discovery

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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.colageclub.colage.core.design.*
import com.colageclub.colage.data.models.NearbyStudent

@Composable
fun FullProfileView(
    student: NearbyStudent,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColageColors.Background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(40.dp))

            // Large avatar
            AvatarView(
                imageUrl = student.profile.profilePhotoURL,
                size = 120.dp,
                initials = student.profile.displayName.initials()
            )

            Spacer(Modifier.height(16.dp))

            Text(
                text = student.profile.displayName,
                style = ColageFonts.Title.copy(color = ColageColors.TextPrimary)
            )

            Spacer(Modifier.height(12.dp))

            // University badge + distance
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // University badge
                Row(
                    modifier = Modifier
                        .background(ColageColors.Primary.copy(alpha = 0.12f), RoundedCornerShape(50))
                        .padding(horizontal = 10.dp, vertical = 5.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.School,
                        contentDescription = null,
                        tint = ColageColors.Primary,
                        modifier = Modifier.size(12.dp)
                    )
                    Text(
                        text = student.profile.universityDomain.removeSuffix(".edu").uppercase(),
                        style = ColageFonts.CaptionBold.copy(color = ColageColors.Primary)
                    )
                }

                // Distance
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(
                        Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = ColageColors.TextSecondary,
                        modifier = Modifier.size(12.dp)
                    )
                    Text(
                        text = student.distance.formattedDistance(),
                        style = ColageFonts.CaptionBold.copy(color = ColageColors.TextSecondary)
                    )
                }
            }

            // Major
            student.profile.major?.let { major ->
                Spacer(Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(
                        Icons.Default.MenuBook,
                        contentDescription = null,
                        tint = ColageColors.TextSecondary,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = major,
                        style = ColageFonts.Body.copy(color = ColageColors.TextSecondary)
                    )
                }
            }

            // Bio
            student.profile.bio?.takeIf { it.isNotEmpty() }?.let { bio ->
                Spacer(Modifier.height(16.dp))
                Text(
                    text = bio,
                    style = ColageFonts.Body.copy(color = ColageColors.TextPrimary),
                    modifier = Modifier.padding(horizontal = 32.dp)
                )
            }

            // Social links
            if (student.profile.socialLinks.isNotEmpty()) {
                Spacer(Modifier.height(24.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp)
                ) {
                    Text(
                        text = "Connect",
                        style = ColageFonts.CaptionBold.copy(color = ColageColors.TextTertiary)
                    )
                    Spacer(Modifier.height(10.dp))
                    student.profile.socialLinks.forEach { link ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .background(ColageColors.Surface, RoundedCornerShape(14.dp))
                                .clickable {
                                    link.url()?.let { url ->
                                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                                    }
                                }
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(ColageColors.Primary.copy(alpha = 0.12f), RoundedCornerShape(10.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    link.platform.icon(),
                                    contentDescription = null,
                                    tint = ColageColors.Primary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = link.platform.displayName,
                                    style = ColageFonts.BodyBold.copy(color = ColageColors.TextPrimary)
                                )
                                Text(
                                    text = link.handle,
                                    style = ColageFonts.Caption.copy(color = ColageColors.TextSecondary)
                                )
                            }
                            Icon(
                                Icons.Default.OpenInNew,
                                contentDescription = null,
                                tint = ColageColors.TextTertiary,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(40.dp))
        }

        // Close button
        IconButton(
            onClick = onDismiss,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
                .size(32.dp)
                .clip(CircleShape)
                .background(ColageColors.SurfaceElevated)
        ) {
            Icon(
                Icons.Default.Close,
                contentDescription = "Close",
                tint = ColageColors.TextSecondary,
                modifier = Modifier.size(14.dp)
            )
        }
    }
}
