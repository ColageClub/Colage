import SwiftUI
import CoreLocation
import AVFoundation

struct PermissionsScreen: View {
    let onContinue: () -> Void
    @Environment(.themeColor) private var themeColor
    @EnvironmentObject var locationService: LocationService
    @State private var locationGranted = false
    @State private var cameraGranted = false
    @State private var notificationsGranted = false
    @State private var currentPermission = 0

    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                OnboardingProgress(currentStep: 7, totalSteps: 10)
                    .padding(.top, 8)

                VStack(spacing: 12) {
                    Text("Enable permissions")
                        .font(ColageFonts.title)
                        .foregroundStyle(ColageColors.textPrimary)
                    Text("Required for the full experience")
                        .font(ColageFonts.body)
                        .foregroundStyle(ColageColors.textSecondary)
                }
                .padding(.top, 48)

                Spacer().frame(height: 48)

                VStack(spacing: 16) {
                    PermissionCard(
                        icon: "location.fill",
                        title: "Location",
                        description: "See and be seen on the campus map. Your location is never stored permanently.",
                        isGranted: locationGranted,
                        isActive: currentPermission == 0,
                        action: requestLocation
                    )

                    PermissionCard(
                        icon: "camera.fill",
                        title: "Camera",
                        description: "Use AR discovery mode and take a profile photo.",
                        isGranted: cameraGranted,
                        isActive: currentPermission == 1,
                        action: requestCamera
                    )

                    PermissionCard(
                        icon: "bell.fill",
                        title: "Notifications",
                        description: "Get notified when friends are nearby. Optional.",
                        isGranted: notificationsGranted,
                        isActive: currentPermission == 2,
                        action: requestNotifications
                    )
                }
                .padding(.horizontal, 24)

                Spacer()

                ColagePrimaryButton(
                    title: locationGranted ? "Continue" : "Grant Permissions",
                    action: {
                        if locationGranted {
                            onContinue()
                        } else {
                            requestLocation()
                        }
                    }
                )
                .padding(.horizontal, 24)

                if !locationGranted {
                    Button("Skip for now") {
                        onContinue()
                    }
                    .font(ColageFonts.body)
                    .foregroundStyle(ColageColors.textSecondary)
                    .padding(.top, 12)
                }

                Spacer().frame(height: 40)
            }
        }
    }

    private func requestLocation() {
        locationService.requestPermission()
        // In dev mode, simulate grant
        if AppState.devMode {
            withAnimation {
                locationGranted = true
                currentPermission = 1
            }
        }
    }

    private func requestCamera() {
        AVCaptureDevice.requestAccess(for: .video) { granted in
            DispatchQueue.main.async {
                withAnimation {
                    cameraGranted = granted || AppState.devMode
                    currentPermission = 2
                }
            }
        }
    }

    private func requestNotifications() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            DispatchQueue.main.async {
                withAnimation {
                    notificationsGranted = granted || AppState.devMode
                }
            }
        }
    }
}

struct PermissionCard: View {
    let icon: String
    let title: String
    let description: String
    let isGranted: Bool
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.system(size: 22))
                    .foregroundStyle(isGranted ? ColageColors.online : themeColor)
                    .frame(width: 48, height: 48)
                    .background(
                        (isGranted ? ColageColors.online : themeColor).opacity(0.12)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(title)
                            .font(ColageFonts.bodyBold)
                            .foregroundStyle(ColageColors.textPrimary)
                        if isGranted {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(ColageColors.online)
                                .font(.system(size: 14))
                        }
                    }
                    Text(description)
                        .font(ColageFonts.caption)
                        .foregroundStyle(ColageColors.textSecondary)
                        .lineLimit(2)
                }

                Spacer()
            }
            .padding(16)
            .background(isActive ? ColageColors.surfaceElevated : ColageColors.surface)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .strokeBorder(isActive ? themeColor.opacity(0.3) : Color.clear, lineWidth: 1)
            )
        }
        .disabled(isGranted)
    }
}

#Preview {
    NavigationStack {
        PermissionsScreen(onContinue: {})
            .environmentObject(LocationService())
    }
}
