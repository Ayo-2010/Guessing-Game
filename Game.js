let p = document.querySelectorAll("p")
let a = document.querySelector("a")
let form = document.querySelector("form")
let input = form.elements[0]
let btn = document.querySelector("button")




btn.addEventListener("click", (e)=>{
    e.preventDefault()
    let c = Math.random();
    let b = c*10
    let d = Math.round(b)
    let g = Number(p[1].innerHTML)
    let f = Number(p[2].innerHTML)
    let valued = input.value
    if (valued==d) {
        g+=
        p[0].innerHTML = g
        alert("Correct")
    } else {
       alert("Oops the correct answer is "+d) 
       console.log(valued);
    }
})