package com.colageclub.colage.core.design

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// MARK: - Loading State

@Composable
fun LoadingStateView(
    message: String = "Loading...",
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(ColageColors.Background),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(
                color = LocalThemeColor.current,
                modifier = Modifier.size(36.dp),
                strokeWidth = 3.dp
            )
            Spacer(Modifier.height(16.dp))
            Text(message, style = ColageFonts.Body.copy(color = ColageColors.TextSecondary))
        }
    }
}

// MARK: - Error State with Retry

@Composable
fun ErrorStateView(
    title: String,
    message: String,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(ColageColors.Background),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(horizontal = 40.dp)
        ) {
            Icon(
                Icons.Default.WifiOff,
                contentDescription = null,
                tint = ColageColors.TextTertiary,
                modifier = Modifier.size(44.dp)
            )
            Spacer(Modifier.height(16.dp))
            Text(title, style = ColageFonts.Title3.copy(color = ColageColors.TextPrimary))
            Spacer(Modifier.height(8.dp))
            Text(
                message,
                style = ColageFonts.Body.copy(color = ColageColors.TextSecondary),
                textAlign = TextAlign.Center
            )
            if (onRetry != null) {
                Spacer(Modifier.height(20.dp))
                Button(
                    onClick = onRetry,
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(containerColor = LocalThemeColor.current)
                ) {
                    Icon(Icons.Default.Refresh, null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Try Again", style = ColageFonts.BodyBold)
                }
            }
        }
    }
}

// MARK: - Empty State with Illustration

@Composable
fun EmptyStateView(
    title: String,
    subtitle: String,
    emoji: String? = null,
    icon: @Composable (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(ColageColors.Background),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(horizontal = 40.dp)
        ) {
            if (emoji != null) {
                Text(emoji, fontSize = 56.sp)
            } else {
                icon?.invoke() ?: Icon(
                    Icons.Default.PersonOff,
                    contentDescription = null,
                    tint = LocalThemeColor.current.copy(alpha = 0.6f),
                    modifier = Modifier.size(44.dp)
                )
            }
            Spacer(Modifier.height(16.dp))
            Text(title, style = ColageFonts.Title3.copy(color = ColageColors.TextPrimary))
            Spacer(Modifier.height(8.dp))
            Text(
                subtitle,
                style = ColageFonts.Body.copy(color = ColageColors.TextSecondary),
                textAlign = TextAlign.Center
            )
        }
    }
}

// MARK: - Stale Data Banner

@Composable
fun StaleDataBanner(
    lastUpdatedMs: Long,
    modifier: Modifier = Modifier
) {
    val agoText = timeAgoDisplay(lastUpdatedMs)
    Row(
        modifier = modifier
            .background(ColageColors.Warning.copy(alpha = 0.1f), RoundedCornerShape(50))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Icon(Icons.Default.Schedule, null, tint = ColageColors.Warning, modifier = Modifier.size(12.dp))
        Text(
            "Last updated $agoText",
            style = ColageFonts.Caption.copy(color = ColageColors.Warning)
        )
    }
}

private fun timeAgoDisplay(timestampMs: Long): String {
    val seconds = ((System.currentTimeMillis() - timestampMs) / 1000).toInt()
    return when {
        seconds < 60 -> "just now"
        seconds < 3600 -> "${seconds / 60}m ago"
        else -> "${seconds / 3600}h ago"
    }
}
