module.exports = {
  purge: ['public/**/*.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        "bglight": "#E5E5E5",
        "bggray": "#333533",
        "darkgray": "#242423",
        "offwhite": "#E8EDDF",
        "high-yellow": "#F5CB5C",
        "botnav": "#2c2c2c",
        "placeholder": "#636363",
        "goodgray": "#484848",
        "altgray": "#292928",
        "high-red": "#FF756C"
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
