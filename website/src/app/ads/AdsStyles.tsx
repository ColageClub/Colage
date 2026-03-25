"use client";

export function AdsStyles() {
  return (
    <style jsx global>{`
      .ads-map-grid {
        flex-wrap: wrap;
      }
      @media (max-width: 680px) {
        .ads-map-grid {
          flex-direction: column;
          align-items: center;
        }
      }
    `}</style>
  );
}
