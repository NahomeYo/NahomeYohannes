window.onload = () => {
    const titleContainers = document.querySelectorAll('.titleContainer');
    const machineryLeft = document.querySelector('.machineryLeft');
    const machineryRight = document.querySelector('.machineryRight');

    titleContainers.forEach((titleContainer) => {
        if (titleContainer.firstElementChild) {
            titleContainer.insertBefore(machineryLeft.cloneNode(true), titleContainer.firstElementChild);
        }

        if (titleContainer.lastElementChild) {
            titleContainer.appendChild(machineryRight.cloneNode(true), titleContainer);
        }
    });

    const footerHeader = document.querySelector('.footerHeader');
    const projectTabs = document.querySelectorAll('.tabsContainer .tab');

    footerHeader.style.width = "100%";
    footerHeader.style.height = "10%";
    footerHeader.style.marginBottom = "1vw";

    projectTabs.forEach((tab) => {
        if (tab.firstElementChild) {
            tab.insertBefore(footerHeader.cloneNode(true), tab.firstElementChild);
        }
    });

    const galleryImgs = document.querySelectorAll('.columnContainer .col li');
    const imgTitles = new Map();

    galleryImgs.forEach((img) => {
        const title = img.querySelector('.columnContainer .col li p');
        if (title) {
            imgTitles.set(img, title);
            title.remove();
        }
    });

    galleryImgs.forEach((img) => {
        img.addEventListener('mouseenter', imgHover);
        img.addEventListener('mouseleave', imgLeave);
    });

    function imgHover(event) {
        const selection = event.target;
        const title = imgTitles.get(selection);
        const image = selection.querySelector('.columnContainer .col li img');
        if (title) {
            selection.appendChild(title);
            selection.classList.add('imgHover');
            if (image) {
                image.style.filter = "blur(2px)";
            }
        }
    }

    function imgLeave(event) {
        const selection = event.target;
        const title = imgTitles.get(selection);
        const image = selection.querySelector('.columnContainer .col li img');
        if (title) {
            title.remove();
            selection.classList.remove('imgHover');
            if (image) {
                image.style.filter = "blur(0px)";
            }
        }
    }

    imgHover();
    imgLeave();
}
