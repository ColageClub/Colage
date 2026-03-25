import SwiftUI

/// Own profile view — shown when tapping your avatar
struct OwnProfileView: View {
    @Environment(.themeColor) private var themeColor
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var universityService: UniversityService
    @Environment(\.dismiss) private var dismiss
    @State private var showEditProfile = false
    @State private var showSettings = false

    private var profile: UserProfile? { UserProfile.current }
    private var themeColor: Color {
        themeColor
    }

    var body: some View {
        NavigationStack {
            ZStack {
                ColageColors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Header card
                        VStack(spacing: 16) {
                            // Avatar
                            AvatarView(
                                imageURL: profile?.profilePhotoURL,
                                size: 100,
                                borderColor: themeColor,
                                initials: profile?.displayName.initials
                            )

                            // Name + university
                            VStack(spacing: 6) {
                                Text(profile?.displayName ?? "Your Name")
                                    .font(ColageFonts.title)
                                    .foregroundStyle(ColageColors.textPrimary)

                                if let major = profile?.major {
                                    Text(major)
                                        .font(ColageFonts.subheadline)
                                        .foregroundStyle(ColageColors.textSecondary)
                                }

                                HStack(spacing: 6) {
                                    Circle()
                                        .fill(appState.isVisible ? ColageColors.online : ColageColors.offline)
                                        .frame(width: 8, height: 8)
                                    Text(appState.isVisible ? "Visible" : "Hidden")
                                        .font(ColageFonts.caption)
                                        .foregroundStyle(ColageColors.textTertiary)

                                    if let uni = universityService.currentUniversity {
                                        Text("·")
                                            .foregroundStyle(ColageColors.textTertiary)
                                        Text(uni.name)
                                            .font(ColageFonts.caption)
                                            .foregroundStyle(ColageColors.textTertiary)
                                    }
                                }
                            }

                            // Edit button
                            Button {
                                showEditProfile = true
                            } label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "pencil")
                                    Text("Edit Profile")
                                }
                                .font(ColageFonts.captionBold)
                                .foregroundStyle(themeColor)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 10)
                                .background(themeColor.opacity(0.12))
                                .clipShape(Capsule())
                            }
                        }
                        .padding(.top, 16)

                        // Bio section
                        if let bio = profile?.bio, !bio.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                SectionHeader(title: "About")
                                Text(bio)
                                    .font(ColageFonts.body)
                                    .foregroundStyle(ColageColors.textPrimary)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .padding(.horizontal, 20)
                        }

                        // Social links
                        if let links = profile?.socialLinks, !links.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                SectionHeader(title: "Social Links")
                                    .padding(.horizontal, 20)

                                ForEach(links) { link in
                                    OwnSocialLinkRow(link: link, themeColor: themeColor)
                                        .padding(.horizontal, 20)
                                }
                            }
                        }

                        // Visibility toggle
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "Visibility")
                                .padding(.horizontal, 20)

                            Toggle(isOn: $appState.isVisible) {
                                HStack(spacing: 12) {
                                    Image(systemName: appState.isVisible ? "eye.fill" : "eye.slash.fill")
                                        .foregroundStyle(themeColor)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("Show on Map")
                                            .font(ColageFonts.bodyBold)
                                            .foregroundStyle(ColageColors.textPrimary)
                                        Text(appState.isVisible ? "Others can see you nearby" : "You're hidden from everyone")
                                            .font(ColageFonts.caption)
                                            .foregroundStyle(ColageColors.textSecondary)
                                    }
                                }
                            }
                            .tint(themeColor)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 14)
                            .background(ColageColors.surface)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .padding(.horizontal, 16)
                        }

                        Spacer().frame(height: 40)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(ColageColors.textSecondary)
                            .frame(width: 32, height: 32)
                            .background(ColageColors.surface)
                            .clipShape(Circle())
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(ColageColors.textSecondary)
                    }
                }
            }
            .sheet(isPresented: $showEditProfile) {
                EditProfileView()
                    .environmentObject(authService)
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
        }
    }
}

// MARK: - Section Header

struct SectionHeader: View {
    let title: String

    var body: some View {
        Text(title.uppercased())
            .font(ColageFonts.captionBold)
            .foregroundStyle(ColageColors.textTertiary)
            .tracking(1.2)
    }
}

// MARK: - Own Social Link Row

struct OwnSocialLinkRow: View {
    let link: SocialLink
    let themeColor: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: link.platform.iconName)
                .font(.system(size: 16))
                .foregroundStyle(themeColor)
                .frame(width: 32, height: 32)
                .background(themeColor.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 1) {
                Text(link.platform.displayName)
                    .font(ColageFonts.captionBold)
                    .foregroundStyle(ColageColors.textSecondary)
                Text(link.handle)
                    .font(ColageFonts.body)
                    .foregroundStyle(ColageColors.textPrimary)
            }

            Spacer()
        }
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let value: String
    let label: String
    let icon: String

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundStyle(ColageColors.textTertiary)
            Text(value)
                .font(ColageFonts.title3)
                .foregroundStyle(ColageColors.textPrimary)
            Text(label)
                .font(ColageFonts.caption)
                .foregroundStyle(ColageColors.textTertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(ColageColors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .padding(.horizontal, 4)
    }
}

#Preview {
    OwnProfileView()
        .environmentObject(AppState())
        .environmentObject(AuthService())
        .environmentObject(UniversityService())
}
