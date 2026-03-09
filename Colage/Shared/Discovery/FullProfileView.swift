import SwiftUI

/// Full profile view — expanded from mini sheet or list tap
struct FullProfileView: View {
    let student: NearbyStudent
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    // Header with photo
                    VStack(spacing: 16) {
                        AvatarView(
                            imageURL: student.profile.profilePhotoURL,
                            size: 120,
                            initials: student.profile.displayName.initials
                        )

                        Text(student.profile.displayName)
                            .font(ColageFonts.title)
                            .foregroundStyle(ColageColors.textPrimary)

                        HStack(spacing: 12) {
                            // University badge
                            HStack(spacing: 4) {
                                Image(systemName: "graduationcap.fill")
                                    .font(.system(size: 12))
                                Text(student.profile.universityDomain.replacingOccurrences(of: ".edu", with: "").uppercased())
                                    .font(ColageFonts.captionBold)
                            }
                            .foregroundStyle(ColageColors.primary)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(ColageColors.primary.opacity(0.12))
                            .clipShape(Capsule())

                            // Distance
                            HStack(spacing: 4) {
                                Image(systemName: "location.fill")
                                    .font(.system(size: 12))
                                Text("\(Int(student.distance)) ft")
                                    .font(ColageFonts.captionBold)
                            }
                            .foregroundStyle(ColageColors.textSecondary)
                        }
                    }
                    .padding(.top, 40)

                    // Major
                    if let major = student.profile.major {
                        HStack(spacing: 6) {
                            Image(systemName: "book.fill")
                                .font(.system(size: 14))
                            Text(major)
                                .font(ColageFonts.body)
                        }
                        .foregroundStyle(ColageColors.textSecondary)
                    }

                    // Bio
                    if let bio = student.profile.bio {
                        Text(bio)
                            .font(ColageFonts.body)
                            .foregroundStyle(ColageColors.textPrimary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }

                    // Social links
                    if !student.profile.socialLinks.isEmpty {
                        VStack(spacing: 10) {
                            Text("Connect")
                                .font(ColageFonts.captionBold)
                                .foregroundStyle(ColageColors.textTertiary)
                                .frame(maxWidth: .infinity, alignment: .leading)

                            ForEach(student.profile.socialLinks) { link in
                                Button {
                                    if let url = link.url {
                                        UIApplication.shared.open(url)
                                    }
                                } label: {
                                    HStack(spacing: 14) {
                                        Image(systemName: link.platform.iconName)
                                            .font(.system(size: 18))
                                            .foregroundStyle(ColageColors.primary)
                                            .frame(width: 40, height: 40)
                                            .background(ColageColors.primary.opacity(0.12))
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
                                            .font(.system(size: 14))
                                            .foregroundStyle(ColageColors.textTertiary)
                                    }
                                    .padding(12)
                                    .background(ColageColors.surface)
                                    .clipShape(RoundedRectangle(cornerRadius: 14))
                                }
                            }
                        }
                        .padding(.horizontal, 24)
                    }

                    Spacer().frame(height: 40)
                }
            }

            // Close button
            VStack {
                HStack {
                    Spacer()
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(ColageColors.textSecondary)
                            .frame(width: 32, height: 32)
                            .background(ColageColors.surfaceElevated)
                            .clipShape(Circle())
                    }
                    .padding(16)
                }
                Spacer()
            }
        }
    }
}

#Preview {
    FullProfileView(
        student: NearbyStudent.mock(index: 0, baseLat: 42.278, baseLng: -83.738)
    )
}
