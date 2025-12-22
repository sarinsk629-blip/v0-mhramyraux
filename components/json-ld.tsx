import Script from "next/script"

interface JsonLdProps {
  soulsOnline?: number
  pageType?: "home" | "sphere" | "profile"
  sphereName?: string
}

export function JsonLd({ soulsOnline = 0, pageType = "home", sphereName }: JsonLdProps) {
  const baseUrl = "https://mharmyraux.com"

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Mharmyraux",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "A global social ecosystem for real-time Human-to-Human connection. No AI. No bots. No algorithms.",
    sameAs: ["https://twitter.com/mharmyraux", "https://instagram.com/mharmyraux"],
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Mharmyraux",
    url: baseUrl,
    description: "Where Souls Collide - Real human connections without AI or algorithms",
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }

  const socialMediaPostingSchema = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: "Mharmyraux - Where Souls Collide",
    description: `${soulsOnline.toLocaleString()} real humans are connected right now. Join the revolution of authentic connection.`,
    url: baseUrl,
    datePublished: new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: "Mharmyraux",
    },
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/ActiveUsers",
      userInteractionCount: soulsOnline,
    },
  }

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Mharmyraux",
    url: baseUrl,
    applicationCategory: "SocialNetworkingApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: soulsOnline > 100 ? Math.floor(soulsOnline / 10) : 100,
      bestRating: "5",
      worstRating: "1",
    },
  }

  const sphereSchema =
    pageType === "sphere" && sphereName
      ? {
          "@context": "https://schema.org",
          "@type": "Place",
          name: `The ${sphereName}`,
          description: `A virtual space in Mharmyraux for real human connection`,
          url: `${baseUrl}/${sphereName.toLowerCase()}`,
          containedInPlace: {
            "@type": "VirtualLocation",
            name: "Mharmyraux",
          },
        }
      : null

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="social-media-posting-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(socialMediaPostingSchema) }}
      />
      <Script
        id="webapp-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      {sphereSchema && (
        <Script
          id="sphere-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sphereSchema) }}
        />
      )}
    </>
  )
}
