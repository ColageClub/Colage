import SwiftUI

// MARK: - Primary Button
struct ColagePrimaryButton: View {
    let title: String
    let action: () -> Void
    var isLoading: Bool = false
    var isDisabled: Bool = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                }
                Text(title)
                    .font(ColageFonts.bodyBold)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(isDisabled ? ColageColors.surfaceElevated : ColageColors.primary)
            .foregroundStyle(isDisabled ? ColageColors.textTertiary : .white)
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .disabled(isDisabled || isLoading)
    }
}

// MARK: - Text Field
struct ColageTextField: View {
    let placeholder: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default
    var autocapitalization: TextInputAutocapitalization = .sentences

    var body: some View {
        TextField(placeholder, text: $text)
            .font(ColageFonts.body)
            .foregroundStyle(ColageColors.textPrimary)
            .padding(.horizontal, 20)
            .frame(height: 56)
            .background(ColageColors.surface)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .strokeBorder(ColageColors.border, lineWidth: 1)
            )
            .keyboardType(keyboardType)
            .textInputAutocapitalization(autocapitalization)
    }
}

// MARK: - OTP Code Field
struct OTPCodeField: View {
    @Binding var code: String
    let length: Int
    var onComplete: ((String) -> Void)? = nil

    var body: some View {
        HStack(spacing: 12) {
            ForEach(0..<length, id: \.self) { index in
                let char = index < code.count
                    ? String(code[code.index(code.startIndex, offsetBy: index)])
                    : ""
                Text(char)
                    .font(ColageFonts.title)
                    .frame(width: 48, height: 60)
                    .background(ColageColors.surface)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .strokeBorder(
                                index < code.count ? ColageColors.primary : ColageColors.border,
                                lineWidth: index < code.count ? 2 : 1
                            )
                    )
            }
        }
        .overlay(
            // Hidden text field captures keyboard input
            TextField("", text: $code)
                .keyboardType(.numberPad)
                .textContentType(.oneTimeCode)
                .opacity(0.01)
                .onChange(of: code) { _, newValue in
                    // Limit to length
                    if newValue.count > length {
                        code = String(newValue.prefix(length))
                    }
                    // Filter non-digits
                    code = code.filter { $0.isNumber }
                    if code.count == length {
                        onComplete?(code)
                    }
                }
        )
    }
}

// MARK: - Circular Avatar
struct AvatarView: View {
    let imageURL: String?
    let size: CGFloat
    var borderColor: Color = ColageColors.primary
    var showBorder: Bool = true

    var body: some View {
        Group {
            if let url = imageURL, let imageUrl = URL(string: url) {
                AsyncImage(url: imageUrl) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFill()
                    default:
                        placeholderAvatar
                    }
                }
            } else {
                placeholderAvatar
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
        .overlay(
            Circle()
                .strokeBorder(showBorder ? borderColor : .clear, lineWidth: 2)
        )
    }

    private var placeholderAvatar: some View {
        ZStack {
            ColageColors.surfaceElevated
            Image(systemName: "person.fill")
                .font(.system(size: size * 0.4))
                .foregroundStyle(ColageColors.textTertiary)
        }
    }
}

// MARK: - Visibility Toggle Button
struct VisibilityToggle: View {
    @Binding var isVisible: Bool

    var body: some View {
        Button {
            isVisible.toggle()
        } label: {
            Image(systemName: isVisible ? "eye.fill" : "eye.slash.fill")
                .font(.system(size: 18, weight: .medium))
                .foregroundStyle(isVisible ? ColageColors.textPrimary : ColageColors.textTertiary)
                .frame(width: 40, height: 40)
                .background(ColageColors.surface.opacity(0.8))
                .clipShape(Circle())
        }
    }
}

// MARK: - Floor Picker
struct FloorPicker: View {
    @Binding var selectedFloor: Int
    let floors: [Int]

    var body: some View {
        VStack(spacing: 4) {
            ForEach(floors.reversed(), id: \.self) { floor in
                Button {
                    selectedFloor = floor
                } label: {
                    Text(floorLabel(floor))
                        .font(ColageFonts.captionBold)
                        .foregroundStyle(
                            selectedFloor == floor
                                ? ColageColors.primary
                                : ColageColors.textSecondary
                        )
                        .frame(width: 36, height: 32)
                        .background(
                            selectedFloor == floor
                                ? ColageColors.primary.opacity(0.15)
                                : ColageColors.surface.opacity(0.8)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
        }
        .padding(4)
        .background(ColageColors.surface.opacity(0.6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func floorLabel(_ floor: Int) -> String {
        switch floor {
        case ..<0: return "B\(abs(floor))"
        case 0: return "G"
        default: return "\(floor)"
        }
    }
}

// MARK: - Segmented Mode Picker
struct DiscoveryModePicker: View {
    @Binding var activeMode: AppState.DiscoveryMode

    var body: some View {
        HStack(spacing: 0) {
            ForEach(AppState.DiscoveryMode.allCases, id: \.self) { mode in
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        activeMode = mode
                    }
                } label: {
                    Text(mode.rawValue)
                        .font(ColageFonts.captionBold)
                        .foregroundStyle(
                            activeMode == mode
                                ? ColageColors.textPrimary
                                : ColageColors.textSecondary
                        )
                        .frame(width: 64, height: 32)
                        .background(
                            activeMode == mode
                                ? ColageColors.primary
                                : Color.clear
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
        .padding(4)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

// MARK: - Progress Steps Indicator
struct OnboardingProgress: View {
    let currentStep: Int
    let totalSteps: Int

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<totalSteps, id: \.self) { step in
                RoundedRectangle(cornerRadius: 2)
                    .fill(step <= currentStep ? ColageColors.primary : ColageColors.border)
                    .frame(height: 3)
            }
        }
        .padding(.horizontal, 24)
    }
}
