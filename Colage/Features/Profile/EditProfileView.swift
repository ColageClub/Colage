import SwiftUI
import PhotosUI

/// Edit profile screen — accessible from own profile
struct EditProfileView: View {
    @Environment(\.themeColor) private var themeColor
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) private var dismiss
    @State private var displayName: String
    @State private var bio: String
    @State private var major: String
    @State private var socialLinks: [SocialPlatform: String]
    @State private var selectedItem: PhotosPickerItem?
    @State private var profileImage: Image?
    @State private var showCamera = false
    @State private var capturedImage: UIImage?
    @State private var isSaving = false

    init() {
        let profile = UserProfile.current
        _displayName = State(initialValue: profile?.displayName ?? "")
        _bio = State(initialValue: profile?.bio ?? "")
        _major = State(initialValue: profile?.major ?? "")

        var links: [SocialPlatform: String] = [:]
        for link in profile?.socialLinks ?? [] {
            links[link.platform] = link.handle
        }
        _socialLinks = State(initialValue: links)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                ColageColors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Profile photo
                        ZStack {
                            if let profileImage {
                                profileImage
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 120, height: 120)
                                    .clipShape(Circle())
                            } else {
                                AvatarView(
                                    imageURL: UserProfile.current?.profilePhotoURL,
                                    size: 120
                                )
                            }
                        }
                        .padding(.top, 24)

                        HStack(spacing: 12) {
                            PhotosPicker(selection: $selectedItem, matching: .images) {
                                Text("Change Photo")
                                    .font(ColageFonts.captionBold)
                                    .foregroundStyle(themeColor)
                            }

                            Button("Take Photo") { showCamera = true }
                                .font(ColageFonts.captionBold)
                                .foregroundStyle(themeColor)
                        }

                        // Fields
                        VStack(spacing: 20) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Name")
                                    .font(ColageFonts.captionBold)
                                    .foregroundStyle(ColageColors.textSecondary)
                                ColageTextField(placeholder: "Your name", text: $displayName)
                            }

                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text("Bio")
                                        .font(ColageFonts.captionBold)
                                        .foregroundStyle(ColageColors.textSecondary)
                                    Spacer()
                                    Text("\(bio.count)/160")
                                        .font(ColageFonts.caption)
                                        .foregroundStyle(bio.count > 160 ? ColageColors.error : ColageColors.textTertiary)
                                }
                                TextField("Something about you...", text: $bio, axis: .vertical)
                                    .font(ColageFonts.body)
                                    .foregroundStyle(ColageColors.textPrimary)
                                    .lineLimit(3...5)
                                    .padding(.horizontal, 20)
                                    .padding(.vertical, 16)
                                    .background(ColageColors.surface)
                                    .clipShape(RoundedRectangle(cornerRadius: 16))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 16)
                                            .strokeBorder(ColageColors.border, lineWidth: 1)
                                    )
                            }

                            VStack(alignment: .leading, spacing: 8) {
                                Text("Major")
                                    .font(ColageFonts.captionBold)
                                    .foregroundStyle(ColageColors.textSecondary)
                                ColageTextField(placeholder: "Your major", text: $major)
                            }
                        }
                        .padding(.horizontal, 24)

                        // Social links
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Social Links")
                                .font(ColageFonts.captionBold)
                                .foregroundStyle(ColageColors.textSecondary)
                                .padding(.horizontal, 24)

                            ForEach([SocialPlatform.instagram, .tiktok, .x, .snapchat, .facebook, .bereal, .linkedin], id: \.self) { platform in
                                HStack(spacing: 12) {
                                    Image(systemName: platform.iconName)
                                        .font(.system(size: 16))
                                        .foregroundStyle(themeColor)
                                        .frame(width: 32)

                                    TextField(platform.displayName, text: Binding(
                                        get: { socialLinks[platform] ?? "" },
                                        set: { socialLinks[platform] = $0 }
                                    ))
                                    .font(ColageFonts.body)
                                    .foregroundStyle(ColageColors.textPrimary)
                                    .textInputAutocapitalization(.never)
                                }
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                                .background(ColageColors.surface)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                            .padding(.horizontal, 24)
                        }

                        Spacer().frame(height: 100)
                    }
                }

                // Save button
                VStack {
                    Spacer()
                    ColagePrimaryButton(
                        title: "Save",
                        action: save,
                        isLoading: isSaving,
                        isDisabled: displayName.trimmingCharacters(in: .whitespaces).isEmpty
                    )
                    .padding(.horizontal, 24)
                    .padding(.bottom, 40)
                    .background(
                        LinearGradient(
                            colors: [ColageColors.background.opacity(0), ColageColors.background],
                            startPoint: .top,
                            endPoint: .center
                        )
                    )
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(ColageColors.textSecondary)
                }
            }
            .fullScreenCover(isPresented: $showCamera) {
                CameraCaptureView(capturedImage: $capturedImage)
                    .ignoresSafeArea()
            }
            .onChange(of: selectedItem) { _, newItem in
                Task {
                    if let data = try? await newItem?.loadTransferable(type: Data.self),
                       let uiImage = UIImage(data: data) {
                        profileImage = Image(uiImage: uiImage)
                    }
                }
            }
            .onChange(of: capturedImage) { _, newImage in
                if let newImage {
                    profileImage = Image(uiImage: newImage)
                }
            }
        }
    }

    private func save() {
        isSaving = true
        let links = socialLinks.compactMap { (platform, handle) -> SocialLink? in
            guard !handle.isEmpty else { return nil }
            return SocialLink(platform: platform, handle: handle)
        }

        authService.createDevProfile(
            name: displayName,
            bio: bio.isEmpty ? nil : bio,
            major: major.isEmpty ? nil : major,
            socialLinks: links
        )

        isSaving = false
        dismiss()
    }
}

#Preview {
    EditProfileView()
        .environmentObject(AuthService())
}
