import SwiftUI
import UIKit

/// Camera capture view for profile photos
struct CameraCaptureView: UIViewControllerRepresentable {
    @Environment(\.themeColor) private var themeColor
    @Binding var capturedImage: UIImage?
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        if UIImagePickerController.isSourceTypeAvailable(.camera) {
            picker.sourceType = .camera
            picker.cameraDevice = .front
        } else {
            // Fallback to photo library on simulator
            picker.sourceType = .photoLibrary
        }
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
