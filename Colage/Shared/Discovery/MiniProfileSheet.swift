import SwiftUI

/// Mini profile sheet — appears as a 35% bottom sheet, expandable to full
struct MiniProfileSheet: View {
    let student: NearbyStudent
    @EnvironmentObject var universityService: UniversityService
    @State private var isFullExpanded = false

    private var themeColor: Color {
        universityService.currentTheme?.primary ?? ColageColors.primary
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // MARK: - Mini View (always visible)
                miniContent
                    .padding(.top, 8)

                // MARK: - Full View (visible when expanded)
                fullContent
                    .padding(.top, 24)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 40)
        }
        .background(ColageColors.background)
    }

    // MARK: - Mini Content

    private var miniContent: some View {
        HStack(spacing: 16) {
            // Avatar
            AvatarView(
                imageURL: student.profile.profilePhotoURL,
                size: 72,
                borderColor: themeColor,
                initials: student.profile.displayName.initials
            )

            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(student.profile.displayName)
                    .font(ColageFonts.title3)
                    .foregroundStyle(ColageColors.textPrimary)

                if let major = student.profile.major {
                    Text(major)
                        .font(ColageFonts.subheadline)
                        .foregroundStyle(ColageColors.textSecondary)
                }

                HStack(spacing: 8) {
                    // Distance
                    HStack(spacing: 4) {
                        Image(systemName: "location.fill")
                            .font(.system(size: 10))
                            .foregroundStyle(themeColor)
                        Text(student.distance.formattedDistance)
                            .font(ColageFonts.monoSmall)
                            .foregroundStyle(ColageColors.textSecondary)
                    }

                    // Floor
                    HStack(spacing: 4) {
                        Image(systemName: "building.2.fill")
                            .font(.system(size: 10))
                            .foregroundStyle(ColageColors.textTertiary)
                        Text(student.location.floor < 0 ? "B\(abs(student.location.floor))" : "Floor \(student.location.floor)")
                            .font(ColageFonts.monoSmall)
                            .foregroundStyle(ColageColors.textTertiary)
                    }
                }
                .padding(.top, 2)
            }

            Spacer()
        }
    }

    // MARK: - Full Content

    private var fullContent: some View {
        VStack(spacing: 20) {
            // Bio
            if let bio = student.profile.bio, !bio.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("About")
                        .font(ColageFonts.captionBold)
                        .foregroundStyle(ColageColors.textTertiary)

                    Text(bio)
                        .font(ColageFonts.body)
                        .foregroundStyle(ColageColors.textPrimary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            // Social Links
            if !student.profile.socialLinks.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Connect")
                        .font(ColageFonts.captionBold)
                        .foregroundStyle(ColageColors.textTertiary)

                    ForEach(student.profile.socialLinks) { link in
                        SocialLinkButton(link: link, themeColor: themeColor)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }


        }
    }

    // Using Double.formattedDistance extension
}

// MARK: - Social Link Button

struct SocialLinkButton: View {
    let link: SocialLink
    let themeColor: Color

    var body: some View {
        Button {
            if let url = link.url {
                UIApplication.shared.open(url)
            }
        } label: {
            HStack(spacing: 12) {
                Image(systemName: link.platform.iconName)
                    .font(.system(size: 18))
                    .foregroundStyle(themeColor)
                    .frame(width: 36, height: 36)
                    .background(themeColor.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 10))

                VStack(alignment: .leading, spacing: 2) {
                    Text(link.platform.displayName)
                        .font(ColageFonts.bodyBold)
                        .foregroundStyle(ColageColors.textPrimary)
                    Text(link.handle)
                        .font(ColageFonts.caption)
                        .foregroundStyle(ColageColors.textSecondary)
                }

                Spacer()

                Image(systemName: "arrow.up.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(ColageColors.textTertiary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(ColageColors.surface)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }
}

#Preview {
    MiniProfileSheet(student: NearbyStudent.mock(index: 0, baseLat: 42.278, baseLng: -83.738))
        .environmentObject(UniversityService())
}
