import SwiftUI

/// Horizontal ad banner shown at the bottom of the map view
struct AdBannerView: View {
    @StateObject private var adService = AdService.shared
    @State private var showAdDetail = false

    var body: some View {
        Group {
            if let ad = adService.currentAd {
                Button {
                    adService.trackTap(adId: ad.id)
                    showAdDetail = true
                } label: {
                    adBanner(ad: ad)
                }
                .buttonStyle(.plain)
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .sheet(isPresented: $showAdDetail) {
                    AdDetailSheet(ad: ad)
                        .presentationDetents([.fraction(0.55), .large])
                        .presentationDragIndicator(.visible)
                }
            }
        }
        .animation(.spring(response: 0.5, dampingFraction: 0.8), value: adService.currentAd?.id)
        .onAppear {
            adService.fetchAd()
        }
    }

    private func adBanner(ad: AdData) -> some View {
        HStack(spacing: 12) {
            // Logo
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(ColageColors.primary.opacity(0.15))
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
                // Base background
                RoundedRectangle(cornerRadius: 18)
                    .fill(.ultraThinMaterial)

                // Transparent logo watermark
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
    let ad: AdData
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Header with logo background
                ZStack {
                    // Gradient background with transparent logo
                    LinearGradient(
                        colors: [ColageColors.primary.opacity(0.15), ColageColors.background],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: 180)

                    Text(ad.logoEmoji)
                        .font(.system(size: 100))
                        .opacity(0.08)

                    // Logo card
                    VStack {
                        Spacer()
                        ZStack {
                            RoundedRectangle(cornerRadius: 20)
                                .fill(ColageColors.primary.opacity(0.15))
                                .frame(width: 72, height: 72)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20)
                                        .strokeBorder(ColageColors.primary.opacity(0.3), lineWidth: 2)
                                )

                            Text(ad.logoEmoji)
                                .font(.system(size: 36))
                        }
                        .offset(y: 36)
                    }
                    .frame(height: 180)
                }

                // Content
                VStack(spacing: 20) {
                    // Name + bio
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

                    // Info row
                    HStack(spacing: 20) {
                        InfoBadge(icon: "location.fill", text: ad.distance)
                        InfoBadge(icon: "clock.fill", text: "Open now")
                        InfoBadge(icon: "camera.fill", text: "Screenshot")
                    }

                    // Actions
                    VStack(spacing: 10) {
                        // Get directions
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
                            .background(ColageColors.primary)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                        }

                        // Screenshot
                        Button {
                            takeScreenshot()
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "camera.fill")
                                Text("Save Screenshot")
                            }
                            .font(ColageFonts.bodyBold)
                            .foregroundStyle(ColageColors.primary)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(ColageColors.primary.opacity(0.1))
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

    private func takeScreenshot() {
        // Capture the ad view as an image and save to photos
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else { return }

        let renderer = UIGraphicsImageRenderer(size: window.bounds.size)
        let image = renderer.image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
    }
}

// MARK: - Info Badge

struct InfoBadge: View {
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
