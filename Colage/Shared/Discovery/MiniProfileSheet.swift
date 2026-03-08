import SwiftUI

/// Mini profile sheet — 30% detent, draggable to full
struct MiniProfileSheet: View {
    let student: NearbyStudent

    var body: some View {
        VStack(spacing: 16) {
            // Profile photo + name
            HStack(spacing: 16) {
                AvatarView(
                    imageURL: student.profile.profilePhotoURL,
                    size: 64
                )

                VStack(alignment: .leading, spacing: 4) {
                    Text(student.profile.displayName)
                        .font(ColageFonts.title3)
                        .foregroundStyle(ColageColors.textPrimary)

                    HStack(spacing: 6) {
                        Image(systemName: "location.fill")
                            .font(.system(size: 11))
                        Text("\(Int(student.distance)) ft away")
                            .font(ColageFonts.monoSmall)
                    }
                    .foregroundStyle(ColageColors.textSecondary)

                    if let major = student.profile.major {
                        Text(major)
                            .font(ColageFonts.caption)
                            .foregroundStyle(ColageColors.textTertiary)
                    }
                }

                Spacer()
            }

            // Social links row
            if !student.profile.socialLinks.isEmpty {
                HStack(spacing: 12) {
                    ForEach(student.profile.socialLinks) { link in
                        Button {
                            if let url = link.url {
                                UIApplication.shared.open(url)
                            }
                        } label: {
                            Image(systemName: link.platform.iconName)
                                .font(.system(size: 18))
                                .foregroundStyle(ColageColors.primary)
                                .frame(width: 40, height: 40)
                                .background(ColageColors.primary.opacity(0.12))
                                .clipShape(Circle())
                        }
                    }
                    Spacer()
                }
            }

            // Bio preview
            if let bio = student.profile.bio {
                Text(bio)
                    .font(ColageFonts.body)
                    .foregroundStyle(ColageColors.textSecondary)
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(24)
        .background(ColageColors.background)
    }
}

#Preview {
    MiniProfileSheet(
        student: NearbyStudent.mock(index: 0, baseLat: 42.278, baseLng: -83.738)
    )
}
