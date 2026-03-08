import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var universityService: UniversityService
    @Environment(\.dismiss) private var dismiss
    @State private var showLogoutConfirm = false
    @State private var showDeleteConfirm = false

    var body: some View {
        NavigationStack {
            List {
                // Account
                Section("Account") {
                    SettingsRow(icon: "envelope.fill", title: "Email", value: authService.enteredEmail)
                    SettingsRow(icon: "phone.fill", title: "Phone", value: "••••••\(String(authService.enteredPhone.suffix(4)))")
                }

                // Privacy
                Section("Privacy") {
                    Toggle(isOn: $appState.isVisible) {
                        Label("Visible on Map", systemImage: "eye.fill")
                    }
                    .tint(ColageColors.primary)
                }

                // Appearance
                Section("Appearance") {
                    if let themes = universityService.currentUniversity?.brandingThemes {
                        ForEach(themes) { theme in
                            Button {
                                universityService.selectTheme(theme)
                            } label: {
                                HStack {
                                    Circle()
                                        .fill(theme.primary)
                                        .frame(width: 24, height: 24)
                                    Text(theme.name)
                                        .foregroundStyle(ColageColors.textPrimary)
                                    Spacer()
                                    if universityService.currentTheme?.id == theme.id {
                                        Image(systemName: "checkmark")
                                            .foregroundStyle(ColageColors.primary)
                                    }
                                }
                            }
                        }
                    }
                }

                // About
                Section("About") {
                    SettingsRow(icon: "info.circle.fill", title: "Version", value: "1.0.0")
                    Link(destination: URL(string: "https://colage.app/privacy")!) {
                        SettingsRow(icon: "lock.fill", title: "Privacy Policy")
                    }
                    Link(destination: URL(string: "https://colage.app/terms")!) {
                        SettingsRow(icon: "doc.text.fill", title: "Terms of Service")
                    }
                }

                // Danger zone
                Section {
                    Button {
                        showLogoutConfirm = true
                    } label: {
                        Label("Log Out", systemImage: "arrow.right.square")
                            .foregroundStyle(ColageColors.warning)
                    }

                    Button {
                        showDeleteConfirm = true
                    } label: {
                        Label("Delete Account", systemImage: "trash.fill")
                            .foregroundStyle(ColageColors.error)
                    }
                }

                if AppState.devMode {
                    Section("Developer") {
                        SettingsRow(icon: "hammer.fill", title: "Dev Mode", value: "ON")
                        Button("Reset Onboarding") {
                            authService.logout()
                            appState.authState = .onboarding
                            dismiss()
                        }
                        .foregroundStyle(ColageColors.warning)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(ColageColors.background)
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(ColageColors.primary)
                }
            }
            .alert("Log Out", isPresented: $showLogoutConfirm) {
                Button("Log Out", role: .destructive) {
                    authService.logout()
                    appState.authState = .onboarding
                    dismiss()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Are you sure you want to log out?")
            }
            .alert("Delete Account", isPresented: $showDeleteConfirm) {
                Button("Delete", role: .destructive) {
                    // TODO: API call to delete account
                    authService.logout()
                    appState.authState = .onboarding
                    dismiss()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This will permanently delete your account and all data. This cannot be undone.")
            }
        }
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String
    var value: String? = nil

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(ColageColors.primary)
                .frame(width: 24)
            Text(title)
                .foregroundStyle(ColageColors.textPrimary)
            Spacer()
            if let value {
                Text(value)
                    .font(ColageFonts.caption)
                    .foregroundStyle(ColageColors.textTertiary)
            }
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(AppState())
        .environmentObject(AuthService())
        .environmentObject(UniversityService())
}
