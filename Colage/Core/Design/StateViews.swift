import SwiftUI

// MARK: - Loading State (Skeleton)

struct LoadingStateView: View {
    @Environment(\.themeColor) private var themeColor
    var message: String = "Loading..."

    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .tint(themeColor)
                .scaleEffect(1.2)
            Text(message)
                .font(ColageFonts.body)
                .foregroundStyle(ColageColors.textSecondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(ColageColors.background)
    }
}

// MARK: - Error State with Retry

struct ErrorStateView: View {
    @Environment(\.themeColor) private var themeColor
    let title: String
    let message: String
    var retryAction: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "wifi.exclamationmark")
                .font(.system(size: 44))
                .foregroundStyle(ColageColors.textTertiary)

            Text(title)
                .font(ColageFonts.title3)
                .foregroundStyle(ColageColors.textPrimary)

            Text(message)
                .font(ColageFonts.body)
                .foregroundStyle(ColageColors.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            if let retry = retryAction {
                Button(action: retry) {
                    HStack(spacing: 8) {
                        Image(systemName: "arrow.clockwise")
                        Text("Try Again")
                    }
                    .font(ColageFonts.bodyBold)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(themeColor)
                    .clipShape(Capsule())
                }
                .padding(.top, 8)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(ColageColors.background)
    }
}

// MARK: - Empty State with Illustration

struct EmptyStateView: View {
    @Environment(\.themeColor) private var themeColor
    let icon: String
    let title: String
    let subtitle: String
    var emoji: String? = nil

    var body: some View {
        VStack(spacing: 16) {
            if let emoji = emoji {
                Text(emoji)
                    .font(.system(size: 56))
            } else {
                Image(systemName: icon)
                    .font(.system(size: 44))
                    .foregroundStyle(themeColor.opacity(0.6))
            }

            Text(title)
                .font(ColageFonts.title3)
                .foregroundStyle(ColageColors.textPrimary)

            Text(subtitle)
                .font(ColageFonts.body)
                .foregroundStyle(ColageColors.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(ColageColors.background)
    }
}

// MARK: - Stale Data Banner

struct StaleDataBanner: View {
    let lastUpdated: Date

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "clock.arrow.circlepath")
                .font(.system(size: 12))
            Text("Last updated \(lastUpdated.timeAgoDisplay)")
                .font(ColageFonts.caption)
        }
        .foregroundStyle(ColageColors.warning)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(ColageColors.warning.opacity(0.1))
        .clipShape(Capsule())
    }
}

extension Date {
    var timeAgoDisplay: String {
        let seconds = Int(-timeIntervalSinceNow)
        if seconds < 60 { return "just now" }
        if seconds < 3600 { return "\(seconds / 60)m ago" }
        return "\(seconds / 3600)h ago"
    }
}
