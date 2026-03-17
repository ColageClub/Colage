package com.colageclub.colage.features.discovery

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.colageclub.colage.core.design.*
import com.colageclub.colage.data.models.NearbyStudent
import com.colageclub.colage.data.models.SocialLink
import kotlin.math.abs

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MiniProfileSheet(
    student: NearbyStudent,
    themeColor: androidx.compose.ui.graphics.Color = ColageColors.Primary,
    onDismiss: () -> Unit = {}
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(ColageColors.Background)
            .verticalScroll(scrollState)
            .padding(horizontal = 20.dp)
            .padding(bottom = 40.dp)
    ) {
        // Drag handle
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .width(40.dp)
                    .height(4.dp)
                    .background(ColageColors.Border, RoundedCornerShape(2.dp))
            )
        }

        // Mini content — avatar + info
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AvatarView(
                imageUrl = student.profile.profilePhotoURL,
                size = 72.dp,
                borderColor = themeColor,
                initials = student.profile.displayName.initials()
            )

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = student.profile.displayName,
                    style = ColageFonts.Title3.copy(color = ColageColors.TextPrimary)
                )

                student.profile.major?.let { major ->
                    Text(
                        text = major,
                        style = ColageFonts.Subheadline.copy(color = ColageColors.TextSecondary)
                    )
                }

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(top = 2.dp)
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(
                            Icons.Default.LocationOn,
                            contentDescription = null,
                            tint = themeColor,
                            modifier = Modifier.size(12.dp)
                        )
                        Text(
                            text = student.distance.formattedDistance(),
                            style = ColageFonts.MonoSmall.copy(color = ColageColors.TextSecondary)
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(
                            Icons.Default.Business,
                            contentDescription = null,
                            tint = ColageColors.TextTertiary,
                            modifier = Modifier.size(12.dp)
                        )
                        Text(
                            text = if (student.location.floor < 0) "B${abs(student.location.floor)}" else "Floor ${student.location.floor}",
                            style = ColageFonts.MonoSmall.copy(color = ColageColors.TextTertiary)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Bio
        student.profile.bio?.takeIf { it.isNotEmpty() }?.let { bio ->
            Text(
                text = "About",
                style = ColageFonts.CaptionBold.copy(color = ColageColors.TextTertiary)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = bio,
                style = ColageFonts.Body.copy(color = ColageColors.TextPrimary)
            )
            Spacer(modifier = Modifier.height(20.dp))
        }

        // Social links
        if (student.profile.socialLinks.isNotEmpty()) {
            Text(
                text = "Connect",
                style = ColageFonts.CaptionBold.copy(color = ColageColors.TextTertiary)
            )
            Spacer(modifier = Modifier.height(12.dp))
            student.profile.socialLinks.forEach { link ->
                SocialLinkButton(link = link, themeColor = themeColor)
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
fun SocialLinkButton(
    link: SocialLink,
    themeColor: androidx.compose.ui.graphics.Color
) {
    val context = LocalContext.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(ColageColors.Surface, RoundedCornerShape(14.dp))
            .clickable {
                link.url()?.let { url ->
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                }
            }
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .background(themeColor.copy(alpha = 0.12f), RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = link.platform.icon(),
                contentDescription = null,
                tint = themeColor,
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

// Icon mapping for SocialPlatform
fun com.colageclub.colage.data.models.SocialPlatform.icon(): androidx.compose.ui.graphics.vector.ImageVector {
    return when (this) {
        com.colageclub.colage.data.models.SocialPlatform.INSTAGRAM -> Icons.Default.CameraAlt
        com.colageclub.colage.data.models.SocialPlatform.TIKTOK -> Icons.Default.MusicNote
        com.colageclub.colage.data.models.SocialPlatform.X -> Icons.Default.AlternateEmail
        com.colageclub.colage.data.models.SocialPlatform.SNAPCHAT -> Icons.Default.Bolt
        com.colageclub.colage.data.models.SocialPlatform.FACEBOOK -> Icons.Default.Group
        com.colageclub.colage.data.models.SocialPlatform.BEREAL -> Icons.Default.Visibility
        com.colageclub.colage.data.models.SocialPlatform.LINKEDIN -> Icons.Default.Work
        else -> Icons.Default.Link
    }
}
