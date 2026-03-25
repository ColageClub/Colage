import SwiftUI

// MARK: - Primary Button
struct ColagePrimaryButton: View {
    @Environment(.themeColor) private var themeColor
    let title: String
    let action: () -> Void
    var isLoading: Bool = false
    var isDisabled: Bool = false

    var body: some View {
        Button(action: {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            action()
        }) {
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
            .background(isDisabled ? ColageColors.surfaceElevated : themeColor)
            .foregroundStyle(isDisabled ? ColageColors.textTertiary : .white)
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .disabled(isDisabled || isLoading)
    }
}

// MARK: - Text Field
struct ColageTextField: View {
    @Environment(.themeColor) private var themeColor
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
    @Environment(.themeColor) private var themeColor
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
                                index < code.count ? themeColor : ColageColors.border,
                                lineWidth: index < code.count ? 2 : 1
                            )
                    )
            }
        }
        // Tappable text field below the boxes
        TextField("Enter code", text: $code)
            .keyboardType(.numberPad)
            .textContentType(.oneTimeCode)
            .font(ColageFonts.mono)
            .foregroundStyle(ColageColors.textPrimary)
            .multilineTextAlignment(.center)
            .frame(height: 44)
            .background(ColageColors.surface)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .padding(.horizontal, 40)
            .padding(.top, 8)
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
    }
}

// MARK: - Circular Avatar
struct AvatarView: View {
    @Environment(.themeColor) private var themeColor
    let imageURL: String?
    let size: CGFloat
    var borderColor: Color = themeColor
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

    var initials: String? = nil

    private var placeholderAvatar: some View {
        ZStack {
            ColageColors.surfaceElevated
            if let initials, !initials.isEmpty {
                Text(initials)
                    .font(.system(size: size * 0.35, weight: .semibold, design: .rounded))
                    .foregroundStyle(themeColor)
            } else {
                Image(systemName: "person.fill")
                    .font(.system(size: size * 0.4))
                    .foregroundStyle(ColageColors.textTertiary)
            }
        }
    }
}

// MARK: - Visibility Toggle Button
struct VisibilityToggle: View {
    @Environment(.themeColor) private var themeColor
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
    @Environment(.themeColor) private var themeColor
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
                                ? themeColor
                                : ColageColors.textSecondary
                        )
                        .frame(width: 36, height: 32)
                        .background(
                            selectedFloor == floor
                                ? themeColor.opacity(0.15)
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
        default: return "\(floor)"
        }
    }
}

// MARK: - Segmented Mode Picker
struct DiscoveryModePicker: View {
    @Environment(.themeColor) private var themeColor
    @Binding var activeMode: AppState.DiscoveryMode

    var body: some View {
        HStack(spacing: 0) {
            ForEach(AppState.DiscoveryMode.allCases, id: \.self) { mode in
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        activeMode = mode
                    }
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
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
                                ? themeColor
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

// MARK: - Distance Formatting
extension Double {
    /// Format distance in feet to a human-readable string
    var formattedDistance: String {
        if self < 50 { return "nearby" }
        if self < 5280 { return "\(Int(self)) ft" }
        return String(format: "%.1f mi", self / 5280.0)
    }
}

// MARK: - String Initials Extension
extension String {
    /// Returns up to 2 initials from a name, e.g. "Emma Wilson" → "EW"
    var initials: String {
        let parts = self.split(separator: " ").map { String($0) }
        if parts.count >= 2 {
            return String(parts[0].prefix(1) + parts[1].prefix(1)).uppercased()
        }
        return String(self.prefix(2)).uppercased()
    }
}

// MARK: - Progress Steps Indicator
struct OnboardingProgress: View {
    @Environment(.themeColor) private var themeColor
    let currentStep: Int
    let totalSteps: Int

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<totalSteps, id: \.self) { step in
                RoundedRectangle(cornerRadius: 2)
                    .fill(step <= currentStep ? themeColor : ColageColors.border)
                    .frame(height: 3)
            }
        }
        .padding(.horizontal, 24)
    }
}
