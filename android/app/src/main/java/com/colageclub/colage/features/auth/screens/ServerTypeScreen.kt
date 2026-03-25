package com.colageclub.colage.features.auth.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.colageclub.colage.core.design.*
import com.colageclub.colage.data.models.ServerType
import com.colageclub.colage.features.auth.AuthViewModel

@Composable
fun ServerTypeScreen(
    authViewModel: AuthViewModel,
    onContinue: () -> Unit
) {
    var selected by remember { mutableStateOf<ServerType?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColageColors.Background)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.weight(1f))

            Text(
                text = "Are you a…",
                style = ColageFonts.LargeTitle.copy(color = ColageColors.TextPrimary),
                textAlign = TextAlign.Center
            )

            Spacer(Modifier.height(8.dp))

            Text(
                text = "This determines which server you join",
                style = ColageFonts.Subheadline.copy(color = ColageColors.TextSecondary),
                textAlign = TextAlign.Center
            )

            Spacer(Modifier.height(32.dp))

            ServerTypeCard(
                icon = Icons.Default.MenuBook,
                title = "Current Student",
                description = "Join your school's server with other students on campus",
                isSelected = selected == ServerType.STUDENT,
                onTap = { selected = ServerType.STUDENT },
                modifier = Modifier.padding(horizontal = 24.dp)
            )

            Spacer(Modifier.height(16.dp))

            ServerTypeCard(
                icon = Icons.Default.School,
                title = "Alumni",
                description = "Join the Alumni Network — graduates from all schools, one community",
                isSelected = selected == ServerType.ALUMNI,
                onTap = { selected = ServerType.ALUMNI },
                modifier = Modifier.padding(horizontal = 24.dp)
            )

            Spacer(Modifier.weight(1f))

            Button(
                onClick = {
                    selected?.let { type ->
                        authViewModel.updateServerType(type)
                        onContinue()
                    }
                },
                enabled = selected != null,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp)
                    .padding(bottom = 50.dp)
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = ColageColors.Primary,
                    disabledContainerColor = ColageColors.Primary.copy(alpha = 0.3f)
                )
            ) {
                Text(
                    "Continue",
                    style = ColageFonts.BodyBold.copy(color = Color.White)
                )
            }
        }
    }
}

@Composable
private fun ServerTypeCard(
    icon: ImageVector,
    title: String,
    description: String,
    isSelected: Boolean,
    onTap: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(ColageColors.Surface)
            .then(
                if (isSelected) Modifier.border(2.dp, ColageColors.Primary, RoundedCornerShape(16.dp))
                else Modifier
            )
            .clickable(onClick = onTap)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(CircleShape)
                .background(if (isSelected) ColageColors.Primary.copy(alpha = 0.2f) else ColageColors.Surface),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = if (isSelected) ColageColors.Primary else ColageColors.TextSecondary,
                modifier = Modifier.size(28.dp)
            )
        }

        Spacer(Modifier.width(16.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = ColageFonts.BodyBold.copy(color = ColageColors.TextPrimary))
            Spacer(Modifier.height(4.dp))
            Text(description, style = ColageFonts.Caption.copy(color = ColageColors.TextSecondary))
        }

        Spacer(Modifier.width(12.dp))

        Icon(
            if (isSelected) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
            contentDescription = null,
            tint = if (isSelected) ColageColors.Primary else ColageColors.TextTertiary,
            modifier = Modifier.size(24.dp)
        )
    }
}
