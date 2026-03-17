package com.colageclub.colage.app

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.colageclub.colage.features.auth.AuthViewModel
import com.colageclub.colage.features.auth.screens.*

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Welcome : Screen("welcome")
    object EmailEntry : Screen("email_entry")
    object EmailOTP : Screen("email_otp")
    object PhoneEntry : Screen("phone_entry")
    object PhoneOTP : Screen("phone_otp")
    object PhotoUpload : Screen("photo_upload")
    object ProfileInfo : Screen("profile_info")
    object SocialLinks : Screen("social_links")
    object Permissions : Screen("permissions")
    object UniversityWelcome : Screen("university_welcome")
    object Login : Screen("login")
    object Home : Screen("home")
}

@Composable
fun ColageApp() {
    val appViewModel: AppViewModel = hiltViewModel()
    val authState by appViewModel.authState.collectAsState()

    LaunchedEffect(Unit) {
        appViewModel.checkExistingSession()
    }

    val navController = rememberNavController()

    when (authState) {
        AuthState.LOADING -> SplashScreen()
        AuthState.ONBOARDING -> OnboardingNavHost(
            navController = navController,
            appViewModel = appViewModel
        )
        AuthState.AUTHENTICATED -> HomeScreen(
            appViewModel = appViewModel
        )
    }
}

@Composable
fun OnboardingNavHost(
    navController: NavHostController,
    appViewModel: AppViewModel
) {
    val authViewModel: AuthViewModel = hiltViewModel()

    NavHost(
        navController = navController,
        startDestination = Screen.Welcome.route
    ) {
        composable(Screen.Welcome.route) {
            WelcomeScreen(
                onGetStarted = { navController.navigate(Screen.EmailEntry.route) },
                onLogin = { navController.navigate(Screen.Login.route) }
            )
        }

        composable(Screen.EmailEntry.route) {
            EmailEntryScreen(
                authViewModel = authViewModel,
                onContinue = { navController.navigate(Screen.EmailOTP.route) }
            )
        }

        composable(Screen.EmailOTP.route) {
            EmailOTPScreen(
                authViewModel = authViewModel,
                onVerified = { navController.navigate(Screen.PhoneEntry.route) }
            )
        }

        composable(Screen.PhoneEntry.route) {
            PhoneEntryScreen(
                authViewModel = authViewModel,
                onContinue = { navController.navigate(Screen.PhoneOTP.route) }
            )
        }

        composable(Screen.PhoneOTP.route) {
            PhoneOTPScreen(
                authViewModel = authViewModel,
                onVerified = { navController.navigate(Screen.PhotoUpload.route) }
            )
        }

        composable(Screen.PhotoUpload.route) {
            PhotoUploadScreen(
                authViewModel = authViewModel,
                onContinue = { navController.navigate(Screen.ProfileInfo.route) }
            )
        }

        composable(Screen.ProfileInfo.route) {
            ProfileInfoScreen(
                authViewModel = authViewModel,
                onContinue = { navController.navigate(Screen.SocialLinks.route) }
            )
        }

        composable(Screen.SocialLinks.route) {
            SocialLinksScreen(
                authViewModel = authViewModel,
                onContinue = { navController.navigate(Screen.Permissions.route) }
            )
        }

        composable(Screen.Permissions.route) {
            PermissionsScreen(
                onContinue = { navController.navigate(Screen.UniversityWelcome.route) }
            )
        }

        composable(Screen.UniversityWelcome.route) {
            UniversityWelcomeScreen(
                authViewModel = authViewModel,
                onEnter = {
                    authViewModel.createProfile {
                        appViewModel.setAuthenticated()
                    }
                }
            )
        }

        composable(Screen.Login.route) {
            LoginScreen(
                authViewModel = authViewModel,
                onAuthenticated = {
                    appViewModel.setAuthenticated()
                },
                onBack = { navController.popBackStack() }
            )
        }
    }
}
