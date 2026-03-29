package com.colageclub.colage.core.design

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest

// MARK: - Primary Button
@Composable
fun ColagePrimaryButton(
    title: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isLoading: Boolean = false,
    isDisabled: Boolean = false
) {
    Button(
        onClick = { if (!isLoading && !isDisabled) onClick() },
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp),
        enabled = !isDisabled && !isLoading,
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = LocalThemeColor.current,
            disabledContainerColor = ColageColors.SurfaceElevated
        ),
        contentPadding = PaddingValues(horizontal = 24.dp)
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                color = Color.White,
                strokeWidth = 2.dp
            )
            Spacer(Modifier.width(8.dp))
        }
        Text(
            text = title,
            style = ColageFonts.BodyBold,
            color = if (isDisabled) ColageColors.TextTertiary else Color.White
        )
    }
}

// MARK: - Text Field
@Composable
fun ColageTextField(
    placeholder: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    keyboardType: KeyboardType = KeyboardType.Text,
    capitalization: KeyboardCapitalization = KeyboardCapitalization.Sentences,
    imeAction: ImeAction = ImeAction.Done,
    onImeAction: () -> Unit = {}
) {
    val focusManager = LocalFocusManager.current
    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp)
            .background(ColageColors.Surface, RoundedCornerShape(16.dp))
            .border(1.dp, ColageColors.Border, RoundedCornerShape(16.dp)),
        textStyle = ColageFonts.Body.copy(color = ColageColors.TextPrimary),
        cursorBrush = SolidColor(LocalThemeColor.current),
        keyboardOptions = KeyboardOptions(
            keyboardType = keyboardType,
            capitalization = capitalization,
            imeAction = imeAction
        ),
        keyboardActions = KeyboardActions(
            onDone = {
                focusManager.clearFocus()
                onImeAction()
            },
            onNext = { onImeAction() },
            onGo = { onImeAction() }
        ),
        singleLine = true,
        decorationBox = { innerTextField ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                if (value.isEmpty()) {
                    Text(
                        text = placeholder,
                        style = ColageFonts.Body.copy(color = ColageColors.TextTertiary)
                    )
                }
                innerTextField()
            }
        }
    )
}

// MARK: - OTP Code Field
@Composable
fun OTPCodeField(
    code: String,
    onCodeChange: (String) -> Unit,
    length: Int = 6,
    onComplete: (String) -> Unit = {}
) {
    val focusRequester = remember { FocusRequester() }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.semantics {
            contentDescription = "Verification code, ${code.length} of $length digits entered"
        }
    ) {
        // Visual boxes
        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier
                .padding(horizontal = 24.dp)
                .clickable { focusRequester.requestFocus() }
        ) {
            repeat(length) { index ->
                val char = if (index < code.length) code[index].toString() else ""
                val isFilled = index < code.length
                Box(
                    modifier = Modifier
                        .size(width = 48.dp, height = 60.dp)
                        .background(ColageColors.Surface, RoundedCornerShape(12.dp))
                        .border(
                            width = if (isFilled) 2.dp else 1.dp,
                            color = if (isFilled) LocalThemeColor.current else ColageColors.Border,
                            shape = RoundedCornerShape(12.dp)
                        )
                        .clickable { focusRequester.requestFocus() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = char,
                        style = ColageFonts.Title.copy(color = ColageColors.TextPrimary),
                        textAlign = TextAlign.Center
                    )
                }
            }
        }

        // Hidden text field that captures input
        BasicTextField(
            value = code,
            onValueChange = { newValue ->
                val filtered = newValue.filter { it.isDigit() }.take(length)
                onCodeChange(filtered)
                if (filtered.length == length) {
                    onComplete(filtered)
                }
            },
            modifier = Modifier
                .size(0.dp)
                .alpha(0f)
                .focusRequester(focusRequester),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.NumberPassword,
                imeAction = ImeAction.Done
            ),
            textStyle = ColageFonts.Mono.copy(
                color = ColageColors.TextPrimary,
                textAlign = TextAlign.Center
            ),
            cursorBrush = SolidColor(LocalThemeColor.current),
            singleLine = true,
            decorationBox = { innerTextField ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    innerTextField()
                }
            }
        )
    }

    // Auto-focus removed — BringIntoViewRequester crashes on some devices
    // User taps the digit row to focus instead
}

// MARK: - Avatar View
@Composable
fun AvatarView(
    imageUrl: String?,
    size: Dp,
    modifier: Modifier = Modifier,
    borderColor: Color = LocalThemeColor.current,
    showBorder: Boolean = true,
    initials: String? = null,
    name: String? = null
) {
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .then(
                if (showBorder) Modifier.border(2.dp, borderColor, CircleShape)
                else Modifier
            ),
        contentAlignment = Alignment.Center
    ) {
        if (imageUrl != null) {
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(imageUrl)
                    .crossfade(true)
                    .build(),
                contentDescription = if (name != null) "Profile photo for $name" else "Profile photo",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(ColageColors.SurfaceElevated),
                contentAlignment = Alignment.Center
            ) {
                if (!initials.isNullOrEmpty()) {
                    Text(
                        text = initials,
                        style = ColageFonts.Body.copy(
                            fontWeight = FontWeight.SemiBold,
                            fontSize = (size.value * 0.35).sp,
                            color = LocalThemeColor.current
                        )
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = ColageColors.TextTertiary,
                        modifier = Modifier.size(size * 0.4f)
                    )
                }
            }
        }
    }
}

// MARK: - Onboarding Progress
@Composable
fun OnboardingProgress(
    currentStep: Int,
    totalSteps: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        repeat(totalSteps) { step ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(3.dp)
                    .background(
                        color = if (step <= currentStep) LocalThemeColor.current else ColageColors.Border,
                        shape = RoundedCornerShape(2.dp)
                    )
            )
        }
    }
}

// MARK: - String Extensions
fun String.initials(): String {
    val parts = this.trim().split(" ").filter { it.isNotEmpty() }
    return if (parts.size >= 2) {
        "${parts[0].first()}${parts[1].first()}".uppercase()
    } else {
        this.take(2).uppercase()
    }
}

// MARK: - Distance Formatting
fun Double.formattedDistance(): String {
    return when {
        this < 50 -> "nearby"
        this < 5280 -> "${this.toInt()} ft"
        else -> String.format("%.1f mi", this / 5280.0)
    }
}
