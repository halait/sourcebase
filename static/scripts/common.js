
const nav = document.querySelector(".header-nav");
document.getElementById("header-menu-btn").addEventListener("click", function(e){
	nav.classList.add("slide-out");
	e.stopPropagation();
});
document.querySelector("body").addEventListener("click", function(){
	nav.classList.remove("slide-out");
});