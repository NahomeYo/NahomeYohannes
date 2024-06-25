window.onload = () => {
    /*
    const loader = document.querySelector(".loadingScreen");
    setTimeout(() => {
        loader.classList.add('fadeOut');
    }, 4000);
    setTimeout(() => {
        loader.remove();
    }, 5000);
    */

    const root = document.documentElement;
    const primaryColor = window.getComputedStyle(root).getPropertyValue('--primary-color');
    const secondaryColor = window.getComputedStyle(root).getPropertyValue('--secondary-color');
    const backgroundColor = window.getComputedStyle(root).getPropertyValue('--background');
    const fontSize = window.getComputedStyle(root).getPropertyValue('--font-size');


    const modeContainer = document.querySelector('.modeButtonContainer');
    const circle = document.querySelector('.modeButtonContainer circle');

    function switchMode(event) {
        if (modeContainer.contains(event.target)) {
            circle.classList.add('swipeLeft');
            circle.style.right = "40px";
            modeContainer.style.background = 'var(--secondary-color)';
            window.removeEventListener("click", switchMode);
            window.addEventListener("click", revertMode);
            root.style.setProperty('--background', secondaryColor);
            root.style.setProperty('--secondary-color', backgroundColor);
            root.style.setProperty('--primary-color', backgroundColor)
        }
    }

    function revertMode(event) {
        if (modeContainer.contains(event.target)) {
            circle.classList.add('swipeRight');
            circle.style.right = "0px";
            modeContainer.style.background = 'black';
            window.removeEventListener("click", revertMode);
            window.addEventListener("click", switchMode);
            root.style.setProperty('--background', backgroundColor);
            root.style.setProperty('--secondary-color', secondaryColor);
            root.style.setProperty('--primary-color', primaryColor)
        }
    }
}    
