import SwiftUI

/// Own profile view — mirrors full profile but with edit + settings
struct OwnProfileView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var universityService: UniversityService
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) private var dismiss
    @State private var showSettings = false
    @State private var showEditProfile = false

    private var profile: UserProfile? { UserProfile.current }

    var body: some View {
        NavigationStack {
            ZStack {
                // University-themed background
                LinearGradient(
                    colors: [
                        (universityService.currentTheme?.primary ?? ColageColors.primary).opacity(0.15),
                        ColageColors.background
                    ],
                    startPoint: .top,
                    endPoint: .center
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Profile photo
                        AvatarView(
                            imageURL: profile?.profilePhotoURL,
                            size: 120,
                            borderColor: universityService.currentTheme?.primary ?? ColageColors.primary
                        )
                        .padding(.top, 24)

                        // Name + university
                        VStack(spacing: 8) {
                            Text(profile?.displayName ?? "Student")
                                .font(ColageFonts.title)
                                .foregroundStyle(ColageColors.textPrimary)

                            if let uni = universityService.currentUniversity {
                                HStack(spacing: 4) {
                                    Image(systemName: "graduationcap.fill")
                                        .font(.system(size: 12))
                                    Text(uni.name)
                                        .font(ColageFonts.captionBold)
                                }
                                .foregroundStyle(universityService.currentTheme?.primary ?? ColageColors.primary)
                            }
                        }

                        // Major
                        if let major = profile?.major, !major.isEmpty {
                            HStack(spacing: 6) {
                                Image(systemName: "book.fill")
                                Text(major)
                            }
                            .font(ColageFonts.body)
                            .foregroundStyle(ColageColors.textSecondary)
                        }

                        // Bio
                        if let bio = profile?.bio, !bio.isEmpty {
                            Text(bio)
                                .font(ColageFonts.body)
                                .foregroundStyle(ColageColors.textPrimary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 32)
                        }

                        // Social links
                        if let links = profile?.socialLinks, !links.isEmpty {
                            VStack(spacing: 10) {
                                ForEach(links) { link in
                                    HStack(spacing: 14) {
                                        Image(systemName: link.platform.iconName)
                                            .font(.system(size: 18))
                                            .foregroundStyle(ColageColors.primary)
                                            .frame(width: 40, height: 40)
                                            .background(ColageColors.primary.opacity(0.12))
                                            .clipShape(RoundedRectangle(cornerRadius: 10))

                                        VStack(alignment: .leading) {
                                            Text(link.platform.displayName)
                                                .font(ColageFonts.bodyBold)
                                                .foregroundStyle(ColageColors.textPrimary)
                                            Text(link.handle)
                                                .font(ColageFonts.caption)
                                                .foregroundStyle(ColageColors.textSecondary)
                                        }

                                        Spacer()
                                    }
                                    .padding(12)
                                    .background(ColageColors.surface)
                                    .clipShape(RoundedRectangle(cornerRadius: 14))
                                }
                            }
                            .padding(.horizontal, 24)
                        }

                        // Edit button
                        Button {
                            showEditProfile = true
                        } label: {
                            Label("Edit Profile", systemImage: "pencil")
                                .font(ColageFonts.bodyBold)
                                .foregroundStyle(ColageColors.primary)
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .background(ColageColors.primary.opacity(0.12))
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                        }
                        .padding(.horizontal, 24)

                        Spacer().frame(height: 40)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(ColageColors.primary)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape.fill")
                            .foregroundStyle(ColageColors.textSecondary)
                    }
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
            .sheet(isPresented: $showEditProfile) {
                EditProfileView()
            }
        }
    }
}

#Preview {
    OwnProfileView()
        .environmentObject(AppState())
        .environmentObject(UniversityService())
        .environmentObject(AuthService())
}
