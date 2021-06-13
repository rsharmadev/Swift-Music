module.exports = {
    plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
        require('@fullhuman/postcss-purgecss')({
            content: [
                './public/build/index.html',

            ],
            defaultExtractor: content => content.match(/[A-Za-z0-9_:/]+/g) || []
        })
    ]
}