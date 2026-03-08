import SwiftUI
import UIKit

/// Camera capture view for profile photos
struct CameraCaptureView: UIViewControllerRepresentable {
    @Binding var capturedImage: UIImage?
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.cameraDevice = .front
        picker.allowsEditing = true // Built-in circular crop
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraCaptureView

        init(_ parent: CameraCaptureView) {
            self.parent = parent
        }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            // Prefer edited (cropped) image
            if let edited = info[.editedImage] as? UIImage {
                parent.capturedImage = edited
            } else if let original = info[.originalImage] as? UIImage {
                parent.capturedImage = original
            }
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

/// Circular crop overlay for profile photos
struct CircularCropView: View {
    let image: UIImage
    @Binding var croppedImage: UIImage?
    @Environment(\.dismiss) private var dismiss
    @State private var scale: CGFloat = 1.0
    @State private var offset: CGSize = .zero
    @State private var lastOffset: CGSize = .zero

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            // Image with gestures
            Image(uiImage: image)
                .resizable()
                .scaledToFill()
                .scaleEffect(scale)
                .offset(offset)
                .gesture(
                    DragGesture()
                        .onChanged { value in
                            offset = CGSize(
                                width: lastOffset.width + value.translation.width,
                                height: lastOffset.height + value.translation.height
                            )
                        }
                        .onEnded { _ in
                            lastOffset = offset
                        }
                )
                .gesture(
                    MagnificationGesture()
                        .onChanged { value in
                            scale = max(1.0, value)
                        }
                )

            // Circle cutout overlay
            CircleCutoutOverlay()
                .allowsHitTesting(false)

            // Controls
            VStack {
                Spacer()
                HStack(spacing: 40) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .font(ColageFonts.body)
                    .foregroundStyle(.white)

                    Button("Use Photo") {
                        // TODO: Actually crop to circle
                        croppedImage = image
                        dismiss()
                    }
                    .font(ColageFonts.bodyBold)
                    .foregroundStyle(ColageColors.primary)
                }
                .padding(.bottom, 50)
            }
        }
    }
}

/// Overlay with transparent circle cutout
struct CircleCutoutOverlay: View {
    var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height) * 0.75
            ZStack {
                Rectangle()
                    .fill(.black.opacity(0.5))
                Circle()
                    .frame(width: size, height: size)
                    .blendMode(.destinationOut)
            }
            .compositingGroup()

            // Circle border
            Circle()
                .strokeBorder(.white.opacity(0.5), lineWidth: 2)
                .frame(width: size, height: size)
                .position(x: geo.size.width / 2, y: geo.size.height / 2)
        }
    }
}
