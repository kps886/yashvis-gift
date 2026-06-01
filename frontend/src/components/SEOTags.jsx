import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOTags = ({ 
    title, 
    description, 
    image = '/suman-logo.png',
    url = window.location.href 
}) => {
    const siteTitle = `${title} | MonikaCreation`;

    return (
        <Helmet>
            {/* Standard SEO */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />

            {/* Open Graph (Facebook, WhatsApp, LinkedIn) */}
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />
            <meta property="og:type" content="website" />

            {/* Twitter / X */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};

export default SEOTags;