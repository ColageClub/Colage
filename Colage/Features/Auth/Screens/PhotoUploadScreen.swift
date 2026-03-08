import SwiftUI
import PhotosUI

struct PhotoUploadScreen: View {
    let onContinue: () -> Void
    @State private var selectedItem: PhotosPickerItem?
    @State private var profileImage: Image?
    @State private var profileUIImage: UIImage?
    @State private var showCamera = false
    @State private var capturedImage: UIImage?

    var body: some View {
        ZStack {
            ColageColors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                OnboardingProgress(currentStep: 4, totalSteps: 10)
                    .padding(.top, 8)

                VStack(spacing: 12) {
                    Text("Add a profile photo")
                        .font(ColageFonts.title)
                        .foregroundStyle(ColageColors.textPrimary)
                    Text("This is how people will find you")
                        .font(ColageFonts.body)
                        .foregroundStyle(ColageColors.textSecondary)
                }
                .padding(.top, 48)

                Spacer().frame(height: 48)

                // Photo preview
                ZStack {
                    if let profileImage {
                        profileImage
                            .resizable()
                            .scaledToFill()
                            .frame(width: 160, height: 160)
                            .clipShape(Circle())
                            .overlay(
                                Circle()
                                    .strokeBorder(ColageColors.primary, lineWidth: 3)
                            )
                    } else {
                        Circle()
                            .fill(ColageColors.surface)
                            .frame(width: 160, height: 160)
                            .overlay(
                                VStack(spacing: 8) {
                                    Image(systemName: "camera.fill")
                                        .font(.system(size: 36))
                                    Text("Add Photo")
                                        .font(ColageFonts.caption)
                                }
                                .foregroundStyle(ColageColors.textTertiary)
                            )
                            .overlay(
                                Circle()
                                    .strokeBorder(ColageColors.border, lineWidth: 2)
                            )
                    }

                    // Change photo button (when photo exists)
                    if profileImage != nil {
                        VStack {
                            Spacer()
                            HStack {
                                Spacer()
                                Image(systemName: "pencil.circle.fill")
                                    .font(.system(size: 32))
                                    .foregroundStyle(ColageColors.primary)
                                    .background(Circle().fill(ColageColors.background).frame(width: 28, height: 28))
                            }
                        }
                        .frame(width: 160, height: 160)
                    }
                }

                Spacer().frame(height: 32)

                // Photo source buttons
                HStack(spacing: 16) {
                    PhotosPicker(selection: $selectedItem, matching: .images) {
                        Label("Library", systemImage: "photo.on.rectangle")
                            .font(ColageFonts.bodyBold)
                            .foregroundStyle(ColageColors.primary)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(ColageColors.primary.opacity(0.12))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    Button {
                        showCamera = true
                    } label: {
                        Label("Camera", systemImage: "camera")
                            .font(ColageFonts.bodyBold)
                            .foregroundStyle(ColageColors.primary)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                            .background(ColageColors.primary.opacity(0.12))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                .padding(.horizontal, 24)

                Spacer()

                VStack(spacing: 12) {
                    ColagePrimaryButton(title: "Continue", action: onContinue)

                    Button("Skip for now") {
                        onContinue()
                    }
                    .font(ColageFonts.body)
                    .foregroundStyle(ColageColors.textSecondary)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
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
                    profileUIImage = uiImage
                    profileImage = Image(uiImage: uiImage)
                }
            }
        }
        .onChange(of: capturedImage) { _, newImage in
            if let newImage {
                profileUIImage = newImage
                profileImage = Image(uiImage: newImage)
            }
        }
    }
}

#Preview {
    NavigationStack {
        PhotoUploadScreen(onContinue: {})
    }
}
