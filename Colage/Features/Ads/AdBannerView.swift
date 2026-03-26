import SwiftUI

/// Horizontal ad banner shown at the bottom of the map view
struct AdBannerView: View {
    @Environment(\.themeColor) private var themeColor
    @State private var currentAd: AdData? = nil
    @State private var showAdDetail = false
    @State private var adIndex = 0

    // Mock ads loaded directly — no singleton needed
    private let mockAds: [AdData] = [
        AdData(
            id: "ad-1",
            businessName: "Blue Brew Coffee",
            bio: "Student-favorite coffee shop since 2019",
            deal: "15% off any drink — show this ad",
            logoEmoji: "☕",
            logoUrl: nil,
            distance: "0.2 mi"
        ),
        AdData(
            id: "ad-2",
            businessName: "Campus Pizza Co.",
            bio: "Late night slices, every night",
            deal: "Free garlic knots with any large pizza",
            logoEmoji: "🍕",
            logoUrl: nil,
            distance: "0.4 mi"
        ),
        AdData(
            id: "ad-3",
            businessName: "FitZone Gym",
            bio: "24/7 gym, 1 block from campus",
            deal: "First month free for students",
            logoEmoji: "🏋️",
            logoUrl: nil,
            distance: "0.3 mi"
        ),
        AdData(
            id: "ad-4",
            businessName: "BookStack",
            bio: "Used textbooks at 60% off retail",
            deal: "Extra 10% off with .edu email",
            logoEmoji: "📚",
            logoUrl: nil,
            distance: "0.1 mi"
        ),
    ]

    let timer = Timer.publish(every: 15, on: .main, in: .common).autoconnect()

    var body: some View {
        VStack {
            if let ad = currentAd {
                Button {
                    showAdDetail = true
                } label: {
                    adBanner(ad: ad)
                }
                .buttonStyle(.plain)
                .sheet(isPresented: $showAdDetail) {
                    AdDetailSheet(ad: ad)
                        .presentationDetents([.fraction(0.55), .large])
                        .presentationDragIndicator(.visible)
                }
            } else {
                Text("Loading ads...")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.5))
                    .padding()
                    .background(.ultraThinMaterial)
                    .clipShape(Capsule())
            }
        }
        .onAppear {
            print("[AdBanner] onAppear — setting first ad")
            currentAd = mockAds.first
        }
        .onReceive(timer) { _ in
            // Don't rotate while sheet is open
            guard !showAdDetail else { return }
            adIndex = (adIndex + 1) % mockAds.count
            currentAd = mockAds[adIndex]
        }
    }

    private func adBanner(ad: AdData) -> some View {
        HStack(spacing: 12) {
            // Logo
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(themeColor.opacity(0.15))
                    .frame(width: 44, height: 44)

                Text(ad.logoEmoji)
                    .font(.system(size: 22))
            }

            // Info
            VStack(alignment: .leading, spacing: 2) {
                Text(ad.businessName)
                    .font(ColageFonts.bodyBold)
                    .foregroundStyle(ColageColors.textPrimary)
                    .lineLimit(1)

                Text(ad.deal)
                    .font(ColageFonts.caption)
                    .foregroundStyle(ColageColors.online)
                    .lineLimit(1)
            }

            Spacer()

            // Distance
            VStack(alignment: .trailing, spacing: 2) {
                Text(ad.distance)
                    .font(ColageFonts.monoSmall)
                    .foregroundStyle(ColageColors.textTertiary)

                Text("Ad")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundStyle(ColageColors.textTertiary)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(ColageColors.textTertiary.opacity(0.15))
                    .clipShape(Capsule())
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background {
            ZStack {
                RoundedRectangle(cornerRadius: 18)
                    .fill(.ultraThinMaterial)

                HStack {
                    Spacer()
                    Text(ad.logoEmoji)
                        .font(.system(size: 60))
                        .opacity(0.04)
                        .offset(x: -10)
                }
                .clipShape(RoundedRectangle(cornerRadius: 18))
            }
        }
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .strokeBorder(ColageColors.border.opacity(0.5), lineWidth: 0.5)
        )
    }
}

// MARK: - Ad Detail Sheet

struct AdDetailSheet: View {
    @Environment(\.themeColor) private var themeColor
    let ad: AdData
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Header with logo background
                ZStack {
                    LinearGradient(
                        colors: [themeColor.opacity(0.15), ColageColors.background],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: 180)

                    Text(ad.logoEmoji)
                        .font(.system(size: 100))
                        .opacity(0.08)

                    VStack {
                        Spacer()
                        ZStack {
                            RoundedRectangle(cornerRadius: 20)
                                .fill(themeColor.opacity(0.15))
                                .frame(width: 72, height: 72)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20)
                                        .strokeBorder(themeColor.opacity(0.3), lineWidth: 2)
                                )

                            Text(ad.logoEmoji)
                                .font(.system(size: 36))
                        }
                        .offset(y: 36)
                    }
                    .frame(height: 180)
                }

                VStack(spacing: 20) {
                    VStack(spacing: 6) {
                        Text(ad.businessName)
                            .font(ColageFonts.title)
                            .foregroundStyle(ColageColors.textPrimary)

                        if !ad.bio.isEmpty {
                            Text(ad.bio)
                                .font(ColageFonts.body)
                                .foregroundStyle(ColageColors.textSecondary)
                                .multilineTextAlignment(.center)
                        }
                    }
                    .padding(.top, 44)

                    // Deal card
                    VStack(spacing: 8) {
                        HStack(spacing: 6) {
                            Text("🎉")
                            Text(ad.deal)
                                .font(ColageFonts.bodyBold)
                                .foregroundStyle(ColageColors.online)
                        }

                        Text("Screenshot this ad and show it at checkout")
                            .font(ColageFonts.caption)
                            .foregroundStyle(ColageColors.textTertiary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .padding(.horizontal, 20)
                    .background(ColageColors.online.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .strokeBorder(ColageColors.online.opacity(0.15), lineWidth: 1)
                    )

                    HStack(spacing: 20) {
                        InfoBadge(icon: "location.fill", text: ad.distance)
                        InfoBadge(icon: "clock.fill", text: "Open now")
                        InfoBadge(icon: "camera.fill", text: "Screenshot")
                    }

                    VStack(spacing: 10) {
                        Button {
                            // Open in Maps
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "arrow.triangle.turn.up.right.diamond.fill")
                                Text("Get Directions")
                            }
                            .font(ColageFonts.bodyBold)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(themeColor)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                        }

                        Button {
                            // TODO: Implement proper screenshot saving
                            print("[AdDetail] Screenshot requested for \(ad.businessName)")
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "camera.fill")
                                Text("Save Screenshot")
                            }
                            .font(ColageFonts.bodyBold)
                            .foregroundStyle(themeColor)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(themeColor.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                        }
                    }
                    .padding(.top, 8)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
        }
        .background(ColageColors.background)
    }

    // Screenshot saving deferred — simulator can freeze with UIGraphicsImageRenderer
}

// MARK: - Info Badge

struct InfoBadge: View {
    @Environment(\.themeColor) private var themeColor
    let icon: String
    let text: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundStyle(ColageColors.textTertiary)
            Text(text)
                .font(ColageFonts.caption)
                .foregroundStyle(ColageColors.textSecondary)
        }
        .frame(maxWidth: .infinity)
    }
}

#Preview {
    AdBannerView()
}
