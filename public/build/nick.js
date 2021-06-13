let home2 = document.getElementById("home")
//let navsound = document.getElementById("navsound")

let homeimg = document.getElementById("homeimg")
let navimg = document.getElementById("navimg")

let homepage = document.getElementById("homepage")
let soundpage = document.getElementById("songpage")

home.addEventListener('click', () => {
    home2.className = "selected w-3/4 py-2 rounded-lg mt-6 mx-auto"
    navsound.className = "notselected w-3/4 py-2 rounded-lg mt-5 mx-auto"

    homeimg.src = "../images/homefill.svg"

    homepage.className = "w-full h-full px-9 mt-7 block"
    soundpage.className = "w-full h-full px-9 mt-7 hidden"
})

navsound.addEventListener('click', () => {
    home.className = "notselected w-3/4 py-2 rounded-lg mt-6 mx-auto"
    navsound.className = "selected w-3/4 py-2 rounded-lg mt-5 mx-auto"

    homeimg.src = "../images/homehallow.svg"

    homepage.className = "w-full h-full px-9 mt-7 hidden"
    soundpage.className = "w-full h-full px-9 mt-7 block"
})