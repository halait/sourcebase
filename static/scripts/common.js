"use strict";
const nav = document.querySelector(".header-nav");
document.getElementById("header-menu-btn").addEventListener("click", function(e){
	nav.classList.add("slide-out");
	e.stopPropagation();
});
document.querySelector("body").addEventListener("click", function(){
	nav.classList.remove("slide-out");
});

let lastScrollY = window.scrollY;
let header = document.querySelector("header");
document.addEventListener("scroll", function() {
	let scrollY = window.scrollY;
	if(scrollY < lastScrollY) {
		header.classList.remove("hide-header");
	} else {
		header.classList.add("hide-header");
	}
	lastScrollY = scrollY;
});
function show() {
	document.querySelector('main').style.opacity = '1';
}
window.addEventListener('load', show);
setTimeout(show, 3000);